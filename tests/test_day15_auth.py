import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import User, EmailOTP, WhatsAppOTP
from apps.api.main import app
from apps.api.deps import get_db
from apps.api.security import get_password_hash


@pytest.fixture
def auth_db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()

    # Seed admin user
    admin = User(
        id="usr_test_admin",
        email="admin@recoverflow.dev",
        hashed_password=get_password_hash("admin123"),
        full_name="Admin Test",
        role="admin",
        is_active=True
    )
    db.add(admin)
    db.commit()

    yield db
    db.close()


@pytest.fixture
def auth_client(auth_db):
    def override_get_db():
        try:
            yield auth_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# 1. Existing Password Login
def test_password_login_success_and_failure(auth_client):
    # Success
    resp = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@recoverflow.dev", "password": "admin123"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@recoverflow.dev"
    assert data["user"]["role"] == "admin"

    # Bad password
    bad_resp = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@recoverflow.dev", "password": "wrongpassword"}
    )
    assert bad_resp.status_code == 401


# 2. Google OAuth
def test_google_oauth_login_mock_token(auth_client, auth_db):
    resp = auth_client.post(
        "/api/v1/auth/google",
        json={"id_token": "mock_google_token_developer.google@company.com"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "developer.google@company.com"
    assert data["user"]["role"] == "support"

    # Check user in DB
    u = auth_db.query(User).filter(User.email == "developer.google@company.com").first()
    assert u is not None
    assert u.full_name == "Developer Google"


def test_google_oauth_empty_token(auth_client):
    resp = auth_client.post("/api/v1/auth/google", json={"id_token": ""})
    assert resp.status_code == 400


# 3. Email OTP
def test_email_otp_lifecycle_success(auth_client, auth_db):
    target_email = "otpuser@enterprise.io"

    # Request OTP
    req_resp = auth_client.post(
        "/api/v1/auth/request-email-otp",
        json={"email": target_email}
    )
    assert req_resp.status_code == 200
    req_data = req_resp.json()
    assert req_data["status"] == "sent"
    otp_code = req_data["demo_otp"]
    assert len(otp_code) == 6

    # Verify OTP
    verify_resp = auth_client.post(
        "/api/v1/auth/verify-email-otp",
        json={"email": target_email, "otp": otp_code}
    )
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert "access_token" in verify_data
    assert verify_data["user"]["email"] == target_email

    # Verify user created in DB
    u = auth_db.query(User).filter(User.email == target_email).first()
    assert u is not None


def test_email_otp_invalid_code(auth_client):
    target_email = "wrongotp@enterprise.io"
    auth_client.post("/api/v1/auth/request-email-otp", json={"email": target_email})

    resp = auth_client.post(
        "/api/v1/auth/verify-email-otp",
        json={"email": target_email, "otp": "000000"}
    )
    assert resp.status_code == 401
    assert "4 attempt(s) remaining" in resp.json()["detail"]


def test_email_otp_expired(auth_client, auth_db):
    target_email = "expired@enterprise.io"
    auth_client.post("/api/v1/auth/request-email-otp", json={"email": target_email})

    # Manually expire
    rec = auth_db.query(EmailOTP).filter(EmailOTP.email == target_email).first()
    rec.expires_at = datetime.utcnow() - timedelta(minutes=10)
    auth_db.commit()

    resp = auth_client.post(
        "/api/v1/auth/verify-email-otp",
        json={"email": target_email, "otp": "123456"}
    )
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()


def test_email_otp_attempt_lockout(auth_client, auth_db):
    target_email = "lockout@enterprise.io"
    auth_client.post("/api/v1/auth/request-email-otp", json={"email": target_email})

    # Fail 5 times
    rec = auth_db.query(EmailOTP).filter(EmailOTP.email == target_email).first()
    rec.attempts = 5
    auth_db.commit()

    resp = auth_client.post(
        "/api/v1/auth/verify-email-otp",
        json={"email": target_email, "otp": "999999"}
    )
    assert resp.status_code == 429
    assert "Too many incorrect OTP attempts" in resp.json()["detail"]


# 4. WhatsApp OTP
def test_whatsapp_otp_lifecycle_success(auth_client, auth_db):
    phone = "+919876543210"

    req_resp = auth_client.post(
        "/api/v1/auth/request-whatsapp-otp",
        json={"phone": phone}
    )
    assert req_resp.status_code == 200
    req_data = req_resp.json()
    assert req_data["status"] == "sent"
    otp_code = req_data["demo_otp"]

    verify_resp = auth_client.post(
        "/api/v1/auth/verify-whatsapp-otp",
        json={"phone": phone, "otp": otp_code}
    )
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert "access_token" in verify_data
    assert verify_data["user"]["phone"] == phone


def test_whatsapp_otp_invalid_phone(auth_client):
    resp = auth_client.post("/api/v1/auth/request-whatsapp-otp", json={"phone": "123"})
    assert resp.status_code == 400
