from fastapi import FastAPI, Request, HTTPException, Depends, Query, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import json
import hmac
import hashlib
import uuid
import os
import random
import yaml
import logging

from apps.api.middleware import RequestIDMiddleware, RateLimitMiddleware
from apps.api.metrics import get_prometheus_metrics, webhook_events_total
from services.streams.producer import publish_raw_event
from apps.api.deps import (
    get_db,
    get_current_user,
    get_current_active_user,
    require_roles,
)
from apps.api.security import (
    verify_password,
    get_password_hash,
    create_access_token,
)
from apps.api.schemas import (
    LoginRequest,
    GoogleAuthRequest,
    RequestEmailOTPRequest,
    VerifyEmailOTPRequest,
    RequestWhatsAppOTPRequest,
    VerifyWhatsAppOTPRequest,
    OTPResponse,
    UserResponse,
    TokenResponse,
    OpportunityResponse,
    OpportunityDetailResponse,
    InterventionResponse,
    ManualActionRequest,
    OutcomeResponse,
    EvidenceEventResponse,
    ExperimentResponse,
    CreateExperimentRequest,
    ExperimentLiftResponse,
    StrategyPerformanceResponse,
    IncrementalRecoveryResponse,
    ResourceLimitResponse,
    CustomerResponse,
    CustomerDetailResponse,

    OverviewResponse,
    PolicyResponse,
    UpdatePolicyRequest,
    SettingsResponse,
)
from database.session import SessionLocal, Base, engine
from database.models import (
    User,
    EmailOTP,
    WhatsAppOTP,
    RevenueOpportunity,
    OpportunityScore,
    Outcome,
    EvidenceEvent,
    Experiment,
    StrategyPerformance,
    Customer,
    Intervention,
)

from services.customer_profile.builder import CustomerProfileBuilder
from services.policy.engine import PolicyEngine, DEFAULT_POLICY_PATH
from services.action_executor.executor import ActionExecutor
from services.experiment.engine import compute_lift, get_or_create_default_experiment
from services.attribution.attribution import calculate_incremental_recovery
from services.learning.update import update_strategy_performance
from services.worker.tasks import store_raw_event

# Configure basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RecoverFlow Enterprise API",
    version="1.2.0",
    description="Production-Grade Payment Failure Recovery & Revenue Engine"
)

# Add CORS middleware to enable Next.js dashboard connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Request ID and Rate Limiting middleware
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RateLimitMiddleware)


def seed_default_users():
    """Seed initial enterprise admin and support users if not present."""
    db = SessionLocal()
    try:
        # 1. Admin User
        admin = db.query(User).filter(User.email == "admin@recoverflow.dev").first()
        if not admin:
            admin = User(
                id=f"user_admin_{uuid.uuid4().hex[:8]}",
                email="admin@recoverflow.dev",
                hashed_password=get_password_hash("admin123"),
                full_name="RecoverFlow Administrator",
                role="admin",
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(admin)
            logger.info("Seeded default admin user: admin@recoverflow.dev")

        # 2. Support User
        support = db.query(User).filter(User.email == "support@recoverflow.dev").first()
        if not support:
            support = User(
                id=f"user_supp_{uuid.uuid4().hex[:8]}",
                email="support@recoverflow.dev",
                hashed_password=get_password_hash("support123"),
                full_name="Support Operations",
                role="support",
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(support)
            logger.info("Seeded default support user: support@recoverflow.dev")

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding default users: {e}")
    finally:
        db.close()


# Environment validation function
INSECURE_JWT_FALLBACK = "recoverflow_super_secret_jwt_key_987654321_secure_enterprise"


def validate_env():
    """
    Fail-fast startup check:
    1. Critical security and infrastructure variables must be present and non-default.
    2. Degraded feature warnings for optional third-party integrations.
    """
    # 1. Critical Fail-Fast Check: JWT_SECRET_KEY
    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if not jwt_secret:
        raise RuntimeError("FATAL: JWT_SECRET_KEY is missing. A secure, unique JWT secret is required.")
    if jwt_secret == INSECURE_JWT_FALLBACK:
        raise RuntimeError(
            "FATAL: JWT_SECRET_KEY matches the insecure hardcoded fallback string. "
            "Set a distinct, secure JWT_SECRET_KEY in your environment."
        )

    # Core required infrastructure variables
    required = [
        "DATABASE_URL",
        "RAZORPAY_KEY_ID",
        "RAZORPAY_KEY_SECRET",
        "RAZORPAY_WEBHOOK_SECRET",
    ]
    missing = [var for var in required if not os.getenv(var)]
    if missing:
        raise RuntimeError(f"FATAL: Missing required environment variables: {', '.join(missing)}")

    # 2. Non-fatal warnings for degraded integrations
    redis_url = os.getenv("REDIS_URL")
    if not redis_url or "localhost" in redis_url:
        logger.warning("WARNING: using local Redis fallback, Celery workers may not connect in multi-host deployment")

    if not os.getenv("SENDGRID_API_KEY"):
        logger.warning("WARNING: email notifications disabled, SendGrid key not set")

    if not os.getenv("TWILIO_ACCOUNT_SID") or not os.getenv("TWILIO_AUTH_TOKEN"):
        logger.warning("WARNING: WhatsApp notifications disabled, Twilio credentials not set")

    if not os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
        logger.warning("WARNING: AI diagnosis disabled, falling back to rule-based scoring")

    scoring_mode = os.getenv("SCORING_MODEL", "heuristic").lower().strip()
    if scoring_mode != "ml":
        logger.warning("WARNING: running in heuristic scoring mode, not ML mode")

    logger.info("Environment configuration validated successfully.")


def ensure_dynamic_schema_columns():
    """Ensure newly added columns exist in postgres/sqlite."""
    try:
        with engine.begin() as conn:
            try:
                conn.execute(text("ALTER TABLE raw_events ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'razorpay' NOT NULL;"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE revenue_opportunities ADD COLUMN IF NOT EXISTS related_opportunity_id VARCHAR REFERENCES revenue_opportunities(id);"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE strategy_performance ADD COLUMN IF NOT EXISTS success_rate NUMERIC(5, 4) DEFAULT 0.0;"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;"))
            except Exception:
                pass
    except Exception as e:
        logger.warning(f"Schema column check: {e}")



# Run validation and seeding on startup
@app.on_event("startup")
def startup_event():
    validate_env()
    Base.metadata.create_all(bind=engine)
    ensure_dynamic_schema_columns()
    seed_default_users()
    logger.info("Enterprise startup initialization complete")




@app.get("/health")
@app.get("/api/v1/health")
def health():
    """Public healthcheck probe for Docker/Kubernetes container orchestration."""
    return {"status": "ok"}


@app.get("/metrics")
def metrics():
    """Prometheus telemetry scrape endpoint."""
    return get_prometheus_metrics()


# ================= Authentication Endpoints =================
@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password, issuing a signed JWT access token."""
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated. Contact system administrator."
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.full_name or user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@app.post("/api/v1/auth/google", response_model=TokenResponse)
def login_with_google(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Verify Google ID token, provision or load user, and issue JWT access token."""
    id_token_str = req.id_token.strip()
    if not id_token_str:
        raise HTTPException(status_code=400, detail="Missing Google ID token")

    email = None
    name = None

    # Handle test / mock tokens for development & testing
    if id_token_str.startswith("mock_google_token_") or id_token_str.startswith("test_token_"):
        token_sub = id_token_str.replace("mock_google_token_", "").replace("test_token_", "")
        email = token_sub if "@" in token_sub else f"{token_sub}@gmail.com"
        name = email.split("@")[0].replace(".", " ").title()
    else:
        # Verify with google-auth library if available, else tokeninfo endpoint
        try:
            from google.oauth2 import id_token as google_id_token
            from google.auth.transport import requests as google_requests
            client_id = os.getenv("GOOGLE_CLIENT_ID", "")
            id_info = google_id_token.verify_oauth2_token(
                id_token_str, google_requests.Request(), client_id if client_id else None
            )
            email = id_info.get("email")
            name = id_info.get("name")
        except Exception as e:
            logger.warning(f"google.oauth2 verification failed: {e}, attempting tokeninfo endpoint")
            import urllib.request
            try:
                url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token_str}"
                with urllib.request.urlopen(url, timeout=5) as response:
                    info = json.loads(response.read().decode())
                    email = info.get("email")
                    name = info.get("name")
            except Exception as http_err:
                logger.error(f"Google tokeninfo verification error: {http_err}")
                raise HTTPException(status_code=401, detail="Invalid Google ID token")

    if not email:
        raise HTTPException(status_code=401, detail="Google authentication did not provide a valid email")

    clean_email = email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        user = User(
            id=f"usr_g_{uuid.uuid4().hex[:12]}",
            email=clean_email,
            full_name=name or clean_email.split("@")[0].title(),
            role="support",
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated. Contact system administrator."
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.full_name or user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@app.post("/api/v1/auth/request-email-otp", response_model=OTPResponse)
def request_email_otp(req: RequestEmailOTPRequest, db: Session = Depends(get_db)):
    """Generate 6-digit OTP, store bcrypt hash with 5-minute expiry, and dispatch email via SendGrid."""
    from services.notification.email_service import EmailService
    clean_email = req.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Invalid email address format")

    otp_str = f"{random.randint(100000, 999999)}"
    otp_hash = get_password_hash(otp_str)
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    # Purge existing pending OTPs for this email
    db.query(EmailOTP).filter(EmailOTP.email == clean_email).delete()

    otp_record = EmailOTP(
        id=f"eotp_{uuid.uuid4().hex[:12]}",
        email=clean_email,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        created_at=datetime.utcnow()
    )
    db.add(otp_record)
    db.commit()

    # Dispatch email using SendGrid service with fallback
    try:
        email_svc = EmailService()
        email_svc.send_otp_email(clean_email, otp_str)
    except Exception as e:
        logger.warning(f"Error calling EmailService: {e}")

    return {
        "message": f"Verification code sent to {clean_email}",
        "status": "sent",
        "demo_otp": otp_str
    }



@app.post("/api/v1/auth/verify-email-otp", response_model=TokenResponse)
def verify_email_otp(req: VerifyEmailOTPRequest, db: Session = Depends(get_db)):
    """Verify 6-digit email OTP, enforce rate limits (< 5 attempts), provision user, and return JWT."""
    clean_email = req.email.strip().lower()
    otp_input = req.otp.strip()

    otp_record = db.query(EmailOTP).filter(EmailOTP.email == clean_email).first()
    if not otp_record:
        raise HTTPException(status_code=400, detail="No OTP verification pending. Please request a code first.")

    if otp_record.attempts >= 5:
        db.delete(otp_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many incorrect OTP attempts. Please request a new verification code."
        )

    if datetime.utcnow() > otp_record.expires_at:
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")

    if not verify_password(otp_input, otp_record.otp_hash):
        otp_record.attempts += 1
        db.commit()
        remaining = 5 - otp_record.attempts
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect verification code. {remaining} attempt(s) remaining."
        )

    # Success: delete used OTP
    db.delete(otp_record)
    db.commit()

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        user = User(
            id=f"usr_e_{uuid.uuid4().hex[:12]}",
            email=clean_email,
            full_name=clean_email.split("@")[0].replace(".", " ").title(),
            role="support",
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated. Contact system administrator."
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.full_name or user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@app.post("/api/v1/auth/request-whatsapp-otp", response_model=OTPResponse)
def request_whatsapp_otp(req: RequestWhatsAppOTPRequest, db: Session = Depends(get_db)):
    """Generate 6-digit WhatsApp OTP, store hash, and dispatch WhatsApp message via Twilio."""
    from services.notification.whatsapp_service import WhatsAppService
    clean_phone = req.phone.strip().replace(" ", "").replace("-", "")
    if len(clean_phone) < 8:
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    otp_str = f"{random.randint(100000, 999999)}"
    otp_hash = get_password_hash(otp_str)
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    db.query(WhatsAppOTP).filter(WhatsAppOTP.phone == clean_phone).delete()

    otp_record = WhatsAppOTP(
        id=f"waotp_{uuid.uuid4().hex[:12]}",
        phone=clean_phone,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        created_at=datetime.utcnow()
    )
    db.add(otp_record)
    db.commit()

    # Dispatch WhatsApp message using Twilio service with fallback
    try:
        wa_svc = WhatsAppService()
        wa_svc.send_otp_whatsapp(clean_phone, otp_str)
    except Exception as e:
        logger.warning(f"Error calling WhatsAppService: {e}")

    return {
        "message": f"Verification code sent via WhatsApp to {clean_phone}",
        "status": "sent",
        "demo_otp": otp_str
    }



@app.post("/api/v1/auth/verify-whatsapp-otp", response_model=TokenResponse)
def verify_whatsapp_otp(req: VerifyWhatsAppOTPRequest, db: Session = Depends(get_db)):
    """Verify 6-digit WhatsApp OTP, load or provision user by phone, and issue JWT access token."""
    clean_phone = req.phone.strip().replace(" ", "").replace("-", "")
    otp_input = req.otp.strip()

    otp_record = db.query(WhatsAppOTP).filter(WhatsAppOTP.phone == clean_phone).first()
    if not otp_record:
        raise HTTPException(status_code=400, detail="No WhatsApp verification pending for this phone number.")

    if otp_record.attempts >= 5:
        db.delete(otp_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many incorrect OTP attempts. Request a new verification code."
        )

    if datetime.utcnow() > otp_record.expires_at:
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=400, detail="WhatsApp verification code has expired.")

    if not verify_password(otp_input, otp_record.otp_hash):
        otp_record.attempts += 1
        db.commit()
        remaining = 5 - otp_record.attempts
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect verification code. {remaining} attempt(s) remaining."
        )

    db.delete(otp_record)
    db.commit()

    # Find user by phone
    user = db.query(User).filter(User.phone == clean_phone).first()
    if not user:
        synthetic_email = f"wa_{clean_phone.replace('+', '')}@recoverflow.phone"
        user = db.query(User).filter(User.email == synthetic_email).first()
        if not user:
            user = User(
                id=f"usr_wa_{uuid.uuid4().hex[:12]}",
                email=synthetic_email,
                phone=clean_phone,
                full_name=f"WhatsApp User {clean_phone[-4:]}",
                role="support",
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.phone = clean_phone
            db.commit()

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated. Contact system administrator."
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "name": user.full_name or clean_phone}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@app.get("/api/v1/auth/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get authenticated user profile."""
    return current_user



# ================= Public Webhook Ingestion =================
@app.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    """Public webhook receiver guarded by HMAC-SHA256 signature verification."""
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "recoverflow_webhook_secret_123")

    # Verify signature
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature header")

    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Parse event data
    try:
        event_data = json.loads(payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event_data.get("event", "unknown")
    event_id = event_data.get("event_id") or hashlib.sha256(payload).hexdigest()

    # Track Prometheus telemetry
    webhook_events_total.labels(event_type=event_type).inc()

    # Publish to Redis Stream for high-throughput stream decoupling
    try:
        publish_raw_event(event_id, event_type, payload.decode("utf-8"))
    except Exception as stream_err:
        logger.warning(f"Redis stream publish failed: {stream_err}")

    # Enqueue Celery task
    try:
        store_raw_event.delay(event_id, event_type, payload.decode("utf-8"))
        logger.info(f"Enqueued event: {event_id} ({event_type})")
    except Exception as e:
        logger.error(f"Failed to enqueue task: {e}")
        return {"status": "accepted", "warning": "task enqueue failed"}

    return {"status": "accepted"}


@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    """Stripe webhook receiver guarded by HMAC signature verification."""
    payload = await request.body()
    signature = request.headers.get("Stripe-Signature") or request.headers.get("X-Stripe-Signature")
    secret = os.getenv("STRIPE_WEBHOOK_SECRET", "recoverflow_stripe_webhook_secret_123")

    # Verify signature
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature header")

    # Handle Stripe header formatting (t=...,v1=...) as well as raw HMAC
    sig_to_check = signature
    payload_to_check = payload
    if "t=" in signature and "v1=" in signature:
        try:
            parts = dict(item.split("=", 1) for item in signature.split(",") if "=" in item)
            t = parts.get("t", "")
            sig_to_check = parts.get("v1", "")
            payload_to_check = f"{t}.".encode() + payload
        except Exception:
            pass

    expected = hmac.new(secret.encode(), payload_to_check, hashlib.sha256).hexdigest()
    raw_expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    if not (hmac.compare_digest(sig_to_check, expected) or hmac.compare_digest(signature, raw_expected)):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Parse event data
    try:
        event_data = json.loads(payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event_data.get("type", "unknown")
    event_id = event_data.get("id") or hashlib.sha256(payload).hexdigest()

    # Track Prometheus telemetry
    webhook_events_total.labels(event_type=event_type).inc()

    # Publish to Redis Stream
    try:
        publish_raw_event(event_id, event_type, payload.decode("utf-8"))
    except Exception as stream_err:
        logger.warning(f"Redis stream publish failed: {stream_err}")

    # Enqueue Celery task with source='stripe'
    try:
        store_raw_event.delay(event_id, event_type, payload.decode("utf-8"), source="stripe")
        logger.info(f"Enqueued Stripe event: {event_id} ({event_type})")
    except Exception as e:
        logger.error(f"Failed to enqueue Stripe task: {e}")
        return {"status": "accepted", "source": "stripe", "warning": "task enqueue failed"}

    return {"status": "accepted", "source": "stripe"}



# ================= Server-Sent Events (SSE) Real-Time Stream =================
@app.get("/api/v1/events")
async def sse_events(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Server-Sent Events (SSE) live pipeline feed for real-time dashboard sync."""
    async def event_generator():
        for _ in range(5):
            if await request.is_disconnected():
                break
            opp_count = db.query(RevenueOpportunity).count()
            rec_count = db.query(RevenueOpportunity).filter(RevenueOpportunity.status == "RECOVERED").count()
            data = json.dumps({
                "type": "heartbeat",
                "timestamp": datetime.utcnow().isoformat(),
                "total_opportunities": opp_count,
                "recovered_count": rec_count,
            })
            yield f"data: {data}\n\n"
            await asyncio.sleep(2)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ================= Overview / Analytics Endpoints =================
@app.get("/api/v1/overview", response_model=OverviewResponse)
def get_overview(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Executive KPI overview metrics for the recovery command center (Requires Auth)."""
    opps = db.query(RevenueOpportunity).all()

    total_opps = len(opps)
    rev_at_risk = sum(float(o.amount_at_risk or 0.0) for o in opps)

    # Calculate status breakdown
    status_dist: Dict[str, int] = {"OPEN": 0, "ACTIONED": 0, "RECOVERED": 0, "FAILED": 0}
    for o in opps:
        st = (o.status or "OPEN").upper()
        status_dist[st] = status_dist.get(st, 0) + 1

    recovered_count = status_dist.get("RECOVERED", 0)
    actioned_count = status_dist.get("ACTIONED", 0)
    open_count = status_dist.get("OPEN", 0)
    recovery_rate_pct = round((recovered_count / total_opps * 100), 2) if total_opps > 0 else 0.0

    # Gross recovered amount
    outcomes = db.query(Outcome).filter(
        Outcome.payment_status.in_(["captured", "paid", "recovered", "success"])
    ).all()
    gross_recovered = sum(float(out.recovered_amount or 0.0) for out in outcomes)

    # Expected recovery from latest scores
    scores = db.query(OpportunityScore).all()
    latest_score_map: Dict[str, float] = {}
    for s in sorted(scores, key=lambda x: x.created_at):
        latest_score_map[s.opportunity_id] = float(s.expected_recovery or 0.0)
    expected_recovery = sum(latest_score_map.values())

    # Incremental recovery calculation
    attr = calculate_incremental_recovery("default", db)
    incremental_recovery = attr.get("attribution", {}).get("incremental_recovery", 0.0) if attr else 0.0

    # Recent interventions
    recent_intvs = db.query(Intervention).order_by(Intervention.created_at.desc()).limit(5).all()

    # Timeline (last 7 days grouped)
    timeline = []
    now = datetime.utcnow()
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        day_created = sum(1 for o in opps if o.created_at and o.created_at.strftime("%Y-%m-%d") == day_date)
        day_recovered = sum(
            1 for out in outcomes if out.created_at and out.created_at.strftime("%Y-%m-%d") == day_date
        )
        timeline.append({
            "date": day_date,
            "created": day_created,
            "recovered": day_recovered
        })

    return {
        "revenue_at_risk": round(rev_at_risk, 2),
        "expected_recovery": round(expected_recovery, 2),
        "gross_recovered": round(gross_recovered, 2),
        "incremental_recovery": round(incremental_recovery, 2),
        "total_opportunities": total_opps,
        "recovered_count": recovered_count,
        "actioned_count": actioned_count,
        "open_count": open_count,
        "recovery_rate_percent": recovery_rate_pct,
        "status_distribution": status_dist,
        "recent_interventions": recent_intvs,
        "timeline": timeline
    }


# ================= Opportunities Endpoints =================
@app.get("/api/v1/opportunities", response_model=List[OpportunityResponse])
def list_opportunities(
    status: Optional[str] = Query(None, description="Filter by status (OPEN, RECOVERED, FAILED, ACTIONED, HUMAN_REVIEW)"),
    source_type: Optional[str] = Query(None, description="Filter by source type (razorpay, stripe, etc.)"),
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    merchant_id: Optional[str] = Query(None, description="Filter by merchant ID"),
    min_amount: Optional[float] = Query(None, description="Filter by minimum amount at risk"),
    sort: Optional[str] = Query("created_at", description="Sort by 'score' or 'created_at'"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List revenue opportunities with filtering, sorting, and pagination (Requires Auth)."""
    query = db.query(RevenueOpportunity)
    if status:
        query = query.filter(RevenueOpportunity.status == status.upper())
    if source_type:
        query = query.filter(RevenueOpportunity.source_type == source_type.lower())
    if customer_id:
        query = query.filter(RevenueOpportunity.customer_id == customer_id)
    if merchant_id:
        query = query.filter(RevenueOpportunity.merchant_id == merchant_id)
    if min_amount is not None:
        query = query.filter(RevenueOpportunity.amount_at_risk >= min_amount)


    if sort == "score":
        score_subquery = (
            db.query(
                OpportunityScore.opportunity_id,
                func.max(OpportunityScore.recoverability_score).label("max_score")
            )
            .group_by(OpportunityScore.opportunity_id)
            .subquery()
        )
        query = query.outerjoin(
            score_subquery,
            RevenueOpportunity.id == score_subquery.c.opportunity_id
        ).order_by(score_subquery.c.max_score.desc().nullslast(), RevenueOpportunity.created_at.desc())
    else:
        query = query.order_by(RevenueOpportunity.created_at.desc())

    return query.offset(offset).limit(limit).all()


@app.get("/api/v1/opportunities/{opportunity_id}", response_model=OpportunityDetailResponse)
def get_opportunity(
    opportunity_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve detailed information about a single opportunity (Requires Auth)."""
    opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opp


@app.post("/api/v1/opportunities/{opportunity_id}/action", response_model=InterventionResponse)
def trigger_manual_action(
    opportunity_id: str,
    action_req: ManualActionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Trigger a manual action on an opportunity with policy verification (Requires Auth)."""
    opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    policy_engine = PolicyEngine()
    eval_result = policy_engine.evaluate(opp, action_req.action_type)
    if not eval_result["allowed"]:
        raise HTTPException(
            status_code=422,
            detail=f"Policy violation: {eval_result['reason']}"
        )

    executor = ActionExecutor()
    intervention = executor.execute(
        opportunity=opp,
        action_type=action_req.action_type,
        decision_reason=action_req.decision_reason or f"manual override by {current_user.email}",
        confidence=action_req.confidence or 1.0,
        db=db
    )
    return intervention


@app.post("/api/v1/opportunities/{opportunity_id}/approve", response_model=OpportunityResponse)
def approve_opportunity(
    opportunity_id: str,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Approve a high-value opportunity in HUMAN_REVIEW status (Restricted to Admin Role)."""
    opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    before_status = opp.status
    opp.status = "APPROVED"
    opp.updated_at = datetime.utcnow()

    # Log approval evidence
    from services.evidence.service import add_evidence
    add_evidence(
        opportunity_id=opp.id,
        event_type="OPPORTUNITY_APPROVED",
        actor=f"admin:{current_user.email}",
        reason=f"High-value recovery approved by administrator {current_user.email}",
        before_state={"status": before_status},
        after_state={"status": "APPROVED"},
        payload={"approved_by": current_user.email, "amount_at_risk": float(opp.amount_at_risk or 0.0)},
        db=db
    )

    # Execute recovery action upon human approval
    executor = ActionExecutor()
    executor.execute(
        opportunity=opp,
        action_type="payment_link",
        decision_reason=f"Approved by administrator ({current_user.email})",
        confidence=1.0,
        db=db
    )

    db.commit()
    db.refresh(opp)
    logger.info(f"Opportunity {opportunity_id} APPROVED by {current_user.email}")
    return opp


@app.post("/api/v1/opportunities/{opportunity_id}/reject", response_model=OpportunityResponse)
def reject_opportunity(
    opportunity_id: str,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Reject a high-value opportunity in HUMAN_REVIEW status (Restricted to Admin Role)."""
    opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    before_status = opp.status
    opp.status = "REJECTED"
    opp.updated_at = datetime.utcnow()

    from services.evidence.service import add_evidence
    add_evidence(
        opportunity_id=opp.id,
        event_type="OPPORTUNITY_REJECTED",
        actor=f"admin:{current_user.email}",
        reason=f"Recovery intervention rejected by administrator {current_user.email}",
        before_state={"status": before_status},
        after_state={"status": "REJECTED"},
        payload={"rejected_by": current_user.email, "amount_at_risk": float(opp.amount_at_risk or 0.0)},
        db=db
    )

    db.commit()
    db.refresh(opp)
    logger.info(f"Opportunity {opportunity_id} REJECTED by {current_user.email}")
    return opp



# ================= Customers Endpoints =================
@app.get("/api/v1/customers", response_model=List[CustomerResponse])
def list_customers(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all customers with aggregated opportunity stats (Requires Auth)."""
    customers = db.query(Customer).order_by(Customer.created_at.desc()).offset(offset).limit(limit).all()
    results = []
    for c in customers:
        total_opps = len(c.opportunities) if c.opportunities else 0
        recovered_amt = sum(
            float(o.amount_at_risk or 0.0) for o in (c.opportunities or []) if o.status == "RECOVERED"
        )
        c_dict = {
            "id": c.id,
            "merchant_id": c.merchant_id,
            "external_id": c.external_id,
            "email": c.email,
            "phone": c.phone,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "total_opportunities": total_opps,
            "total_recovered": round(recovered_amt, 2)
        }
        results.append(c_dict)
    return results


@app.get("/api/v1/customers/{customer_id}", response_model=CustomerDetailResponse)
def get_customer(
    customer_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get customer details with 360 profile metrics and history (Requires Auth)."""
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")

    profile_builder = CustomerProfileBuilder()
    profile_metrics = profile_builder.build_profile(customer_id, db)

    total_opps = len(c.opportunities) if c.opportunities else 0
    recovered_amt = sum(
        float(o.amount_at_risk or 0.0) for o in (c.opportunities or []) if o.status == "RECOVERED"
    )

    return {
        "id": c.id,
        "merchant_id": c.merchant_id,
        "external_id": c.external_id,
        "email": c.email,
        "phone": c.phone,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
        "total_opportunities": total_opps,
        "total_recovered": round(recovered_amt, 2),
        "profile_metrics": profile_metrics,
        "opportunities": c.opportunities or []
    }


# ================= Interventions Endpoints =================
@app.get("/api/v1/interventions", response_model=List[InterventionResponse])
def list_interventions(
    status: Optional[str] = Query(None, description="Filter by status (PENDING, EXECUTED, FAILED)"),
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all recovery interventions and actions (Requires Auth)."""
    query = db.query(Intervention)
    if status:
        query = query.filter(Intervention.status == status.upper())
    if action_type:
        query = query.filter(Intervention.action_type == action_type)
    return query.order_by(Intervention.created_at.desc()).offset(offset).limit(limit).all()


# ================= Outcomes Endpoints =================
@app.get("/api/v1/outcomes", response_model=List[OutcomeResponse])
def list_outcomes(
    opportunity_id: Optional[str] = Query(None, description="Filter outcomes by opportunity ID"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List recovery outcome records (Requires Auth)."""
    query = db.query(Outcome)
    if opportunity_id:
        query = query.filter(Outcome.opportunity_id == opportunity_id)
    return query.order_by(Outcome.created_at.desc()).offset(offset).limit(limit).all()


# ================= Evidence Audit Trail =================
@app.get("/api/v1/opportunities/{opportunity_id}/evidence", response_model=List[EvidenceEventResponse])
def get_opportunity_evidence(
    opportunity_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve complete chronological evidence audit log for an opportunity (Requires Auth)."""
    opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    events = db.query(EvidenceEvent).filter(
        EvidenceEvent.opportunity_id == opportunity_id
    ).order_by(EvidenceEvent.created_at.asc()).all()
    return events


# ================= Experiments Endpoints =================
@app.get("/api/v1/experiments", response_model=List[ExperimentResponse])
def list_experiments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all A/B recovery experiments (Requires Auth)."""
    get_or_create_default_experiment(db)
    db.commit()
    return db.query(Experiment).order_by(Experiment.created_at.desc()).all()


@app.post("/api/v1/experiments", response_model=ExperimentResponse)
def create_experiment(
    req: CreateExperimentRequest,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Create a new A/B recovery experiment (Restricted to Admin Role)."""
    exp = Experiment(
        id=f"exp_{uuid.uuid4().hex[:10]}",
        name=req.name,
        treatment_percent=req.treatment_percent or 50,
        metric=req.metric or "recovery_rate",
        status="ACTIVE",
        start_date=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@app.get("/api/v1/experiments/{experiment_id}/lift", response_model=ExperimentLiftResponse)
def get_experiment_lift(
    experiment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Calculate statistical recovery rate and lift for an experiment (Requires Auth)."""
    lift_data = compute_lift(experiment_id, db)
    return lift_data


# ================= Analytics & Attribution =================
@app.get("/api/v1/analytics/incremental", response_model=IncrementalRecoveryResponse)
def get_incremental_attribution(
    experiment_id: str = Query("default", description="Experiment ID to evaluate attribution for"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Calculate incremental revenue attribution against control baseline (Requires Auth)."""
    return calculate_incremental_recovery(experiment_id, db)


@app.get("/api/v1/analytics/report")
def get_executive_report(
    format: Optional[str] = Query("json", description="Output format ('json' or 'markdown')"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate comprehensive executive stakeholder recovery report (Requires Auth)."""
    from services.analytics.report_generator import ExecutiveReportGenerator
    generator = ExecutiveReportGenerator()
    if format == "markdown":
        return {"report_markdown": generator.generate_markdown_summary(db)}
    return generator.generate_report_data(db)


@app.get("/api/v1/analytics/resource-usage", response_model=List[ResourceLimitResponse])
def get_resource_usage(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """View real-time daily recovery action resource quotas and usage (Requires Admin Role)."""
    from services.resource_manager import get_all_usage
    return get_all_usage(db)




# ================= Learning & Strategy Performance =================
@app.get("/api/v1/learning/performance", response_model=List[StrategyPerformanceResponse])
def get_strategy_performance(
    refresh: bool = Query(False, description="Whether to trigger immediate recalculation"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get strategy performance breakdown across actions and failure types (Requires Auth)."""
    if refresh:
        update_strategy_performance(db)
    return db.query(StrategyPerformance).order_by(StrategyPerformance.avg_lift.desc().nullslast()).all()


# ================= Policy Management =================
@app.get("/api/v1/policy", response_model=PolicyResponse)
def get_policy(current_user: User = Depends(get_current_active_user)):
    """Read current YAML policy file and parsed rules (Requires Auth)."""
    engine = PolicyEngine()
    yaml_text = ""
    if os.path.exists(DEFAULT_POLICY_PATH):
        with open(DEFAULT_POLICY_PATH, "r") as f:
            yaml_text = f.read()
    else:
        yaml_text = yaml.dump(engine.rules)

    return {
        "yaml_content": yaml_text,
        "parsed": engine.rules
    }


@app.put("/api/v1/policy", response_model=PolicyResponse)
def update_policy(
    req: UpdatePolicyRequest,
    current_user: User = Depends(require_roles("admin"))
):
    """Update YAML policy rules with syntax validation (Restricted to Admin Role)."""
    try:
        parsed_data = yaml.safe_load(req.yaml_content)
        if not isinstance(parsed_data, dict):
            raise ValueError("Policy must be a valid YAML dictionary mapping")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML policy: {e}")

    # Write to policy file
    os.makedirs(os.path.dirname(DEFAULT_POLICY_PATH), exist_ok=True)
    with open(DEFAULT_POLICY_PATH, "w") as f:
        f.write(req.yaml_content)

    return {
        "yaml_content": req.yaml_content,
        "parsed": parsed_data
    }


# ================= Settings / Status =================
@app.get("/api/v1/settings", response_model=SettingsResponse)
def get_settings(current_user: User = Depends(get_current_active_user)):
    """Get environment and integration configuration details (Requires Auth)."""
    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    masked_key = f"{key_id[:8]}...{key_id[-4:]}" if len(key_id) > 12 else "rzp_test_****"

    return {
        "environment": "Enterprise Production-Ready Mode",
        "razorpay_key_id_masked": masked_key,
        "webhook_url": "http://localhost:8000/webhooks/razorpay",
        "version": "1.2.0",
        "status": "Healthy"
    }