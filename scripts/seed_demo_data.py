import os
import sys
import uuid
import random
from decimal import Decimal
from datetime import datetime, timedelta

# Ensure python path includes project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.session import SessionLocal, Base, engine
from database.models import (
    Merchant,
    Customer,
    Payment,
    RevenueOpportunity,
    OpportunityScore,
    Intervention,
    Outcome,
    Experiment,
    ExperimentAssignment,
    StrategyPerformance,
    StrategyWeight,
    EvidenceEvent,
    ResourceLimit,
    User,
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

INDIAN_FIRST_NAMES = [
    "Rajesh", "Priya", "Amit", "Ananya", "Vikram", "Sneha", "Rohan", "Divya", "Karthik", "Meera",
    "Sanjay", "Pooja", "Arjun", "Kavita", "Aditya", "Neha", "Manoj", "Ritu", "Deepak", "Swati",
    "Nikhil", "Shreya", "Rahul", "Aarti", "Gaurav", "Sunita", "Harish", "Pallavi", "Vivek", "Tanvi"
]

INDIAN_LAST_NAMES = [
    "Sharma", "Patel", "Verma", "Iyer", "Malhotra", "Reddy", "Gupta", "Nair", "Sundaram", "Joshi",
    "Chopra", "Deshmukh", "Singhania", "Mukherjee", "Bhatia", "Rao", "Saxena", "Menon", "Trivedi", "Banerjee"
]

DOMAINS = ["gmail.com", "outlook.com", "yahoo.co.in", "hdfcbank.com", "techcorp.in", "fintech.io", "saasbox.io"]

FAILURE_REASONS = [
    ("insufficient_funds", 0.75),
    ("card_declined", 0.65),
    ("payment_failed", 0.70),
    ("expired_card", 0.85),
    ("bank_error", 0.90),
    ("network_issue", 0.88),
    ("gateway_timeout", 0.82),
]

ACTION_TYPES = [
    "payment_link", "smart_retry", "upi_qr", "payment_method_recovery",
    "incentive", "email_reminder", "subscription_recovery", "voice_call", "human_escalation"
]


def seed_demo_data():
    db = SessionLocal()
    try:
        print("🌱 [Seed] Checking database tables and existing demo data...")
        Base.metadata.create_all(bind=engine)

        # 1. Create or get Merchant
        merchant = db.query(Merchant).filter(Merchant.id == "merch_demo_hq").first()
        if not merchant:
            merchant = Merchant(
                id="merch_demo_hq",
                name="RecoverFlow Enterprise Demo HQ",
                email="billing@recoverflow.dev",
                razorpay_key_id="rzp_test_recoverflow_live_123"
            )
            db.add(merchant)
            db.commit()
            print("   ✅ Created Demo Merchant: merch_demo_hq")
        else:
            print("   ℹ️ Demo Merchant already exists")

        # 2. Create Users (Admin & Support)
        admin_user = db.query(User).filter(User.email == "admin@recoverflow.dev").first()
        if not admin_user:
            admin_user = User(
                id="usr_admin_default",
                email="admin@recoverflow.dev",
                hashed_password=pwd_context.hash("admin123"),
                full_name="Enterprise Admin",
                role="admin",
                phone="+919800000001",
                is_active=True
            )
            db.add(admin_user)

        support_user = db.query(User).filter(User.email == "support@recoverflow.dev").first()
        if not support_user:
            support_user = User(
                id="usr_support_default",
                email="support@recoverflow.dev",
                hashed_password=pwd_context.hash("support123"),
                full_name="Operations Concierge",
                role="support",
                phone="+919800000002",
                is_active=True
            )
            db.add(support_user)
        db.commit()

        # 3. Create or check Experiment
        exp = db.query(Experiment).filter(Experiment.id == "default").first()
        if not exp:
            exp = Experiment(
                id="default",
                name="Default 50/50 Autonomous Recovery Holdout",
                description="Randomized holdout comparison evaluating incremental revenue lift of AI recovery vs natural baseline.",
                status="ACTIVE",
                treatment_percent=50
            )
            db.add(exp)
            db.commit()
            print("   ✅ Created Default 50/50 A/B Experiment")

        # Check existing opportunities count
        opp_count = db.query(RevenueOpportunity).count()
        if opp_count >= 60:
            print(f"   ℹ️ Database already has {opp_count} opportunities. Skipping full population.")
            return

        print("🚀 [Seed] Seeding 50 realistic Indian customers and 100+ recovery opportunities...")

        # 4. Generate 50 Customers
        customers = []
        for i in range(50):
            fn = random.choice(INDIAN_FIRST_NAMES)
            ln = random.choice(INDIAN_LAST_NAMES)
            cust_name = f"{fn} {ln}"
            cust_email = f"{fn.lower()}.{ln.lower()}{random.randint(10, 99)}@{random.choice(DOMAINS)}"
            cust_phone = f"+9198{random.randint(10000000, 99999999)}"
            cust_id = f"cust_in_{i+1:03d}"

            cust = db.query(Customer).filter(Customer.id == cust_id).first()
            if not cust:
                cust = Customer(
                    id=cust_id,
                    merchant_id=merchant.id,
                    external_id=f"ext_{cust_id}",
                    email=cust_email,
                    phone=cust_phone,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(10, 60))
                )
                db.add(cust)
            customers.append(cust)

        db.commit()

        # 5. Generate 100 Opportunities across statuses
        amounts = [499.0, 999.0, 1499.0, 2499.0, 3999.0, 5999.0, 9999.0, 14999.0, 24999.0, 55000.0, 85000.0, 120000.0]
        gateways = ["razorpay", "razorpay", "stripe"]
        statuses = ["RECOVERED", "RECOVERED", "ACTIONED", "ACTIONED", "OPEN", "HUMAN_REVIEW", "STOPPED", "CLOSED"]

        for i in range(100):
            cust = random.choice(customers)
            amt = random.choice(amounts)
            fail_reason, base_score = random.choice(FAILURE_REASONS)
            source = random.choice(gateways)
            status = random.choice(statuses)

            # High value items (>50,000) mapped to HUMAN_REVIEW
            if amt > 50000 and status not in ("RECOVERED", "CLOSED"):
                status = "HUMAN_REVIEW"

            opp_id = f"opp_demo_{i+1:03d}"
            created_time = datetime.utcnow() - timedelta(days=random.randint(0, 25), hours=random.randint(0, 23))

            opp = RevenueOpportunity(
                id=opp_id,
                merchant_id=merchant.id,
                customer_id=cust.id,
                amount_at_risk=Decimal(str(amt)),
                currency="INR",
                failure_reason=fail_reason,
                status=status,
                retry_count=random.randint(0, 2),
                source_type=source,
                created_at=created_time,
                updated_at=created_time + timedelta(hours=1)
            )
            db.add(opp)
            db.flush()

            # Assign A/B Variant
            variant = "treatment" if random.random() < 0.5 else "control"
            assignment = ExperimentAssignment(
                id=f"asgn_{opp_id}",
                experiment_id="default",
                opportunity_id=opp.id,
                variant=variant,
                assigned_at=created_time
            )
            db.add(assignment)

            # Create Opportunity Score
            score_val = min(0.98, max(0.20, base_score + random.uniform(-0.15, 0.10)))
            exp_rec = round(amt * score_val, 2)
            score = OpportunityScore(
                id=f"sc_{opp_id}",
                opportunity_id=opp.id,
                model_version="heuristic_v1",
                recoverability_score=Decimal(str(round(score_val, 4))),
                expected_recovery=Decimal(str(exp_rec)),
                features_json={"amount": amt, "failure_reason": fail_reason, "retry_count": opp.retry_count},
                created_at=created_time + timedelta(minutes=2)
            )
            db.add(score)


            # Create Intervention if status in (ACTIONED, RECOVERED, STOPPED, CLOSED)
            if status in ("ACTIONED", "RECOVERED", "STOPPED", "CLOSED"):
                action_chosen = random.choice(ACTION_TYPES)
                if status == "STOPPED":
                    action_chosen = "stop"

                intv = Intervention(
                    id=f"intv_{opp_id}",
                    opportunity_id=opp.id,
                    action_type=action_chosen,
                    decision_reason=f"Autonomous intervention for {fail_reason} ({score_val*100:.0f}% confidence)",
                    confidence=Decimal(str(round(score_val, 4))),
                    policy_status="APPROVED",
                    status="EXECUTED",
                    external_ref=f"{action_chosen}_{uuid.uuid4().hex[:8]}",
                    created_at=created_time + timedelta(minutes=5),
                    updated_at=created_time + timedelta(minutes=5)
                )
                db.add(intv)
                db.flush()

                # If RECOVERED, create Outcome
                if status == "RECOVERED":
                    out = Outcome(
                        id=f"out_{opp_id}",
                        intervention_id=intv.id,
                        opportunity_id=opp.id,
                        payment_status="captured",
                        recovered_amount=Decimal(str(amt)),
                        observed_at=created_time + timedelta(hours=random.randint(1, 12)),
                        created_at=created_time + timedelta(hours=random.randint(1, 12))
                    )
                    db.add(out)

            # Add Evidence Trail
            ev1 = EvidenceEvent(
                id=f"ev_sc_{opp_id}",
                opportunity_id=opp.id,
                event_type="OPPORTUNITY_SCORED",
                actor="scoring_engine",
                reason=f"Recoverability score calculated as {score_val:.2f}",
                payload={"score": score_val, "method": "heuristic_v1"},
                created_at=created_time + timedelta(minutes=2)
            )
            db.add(ev1)

        db.commit()

        # 6. Seed Strategy Performance & Strategy Weights
        print("🧠 [Seed] Populating Strategy Performance & Learned Strategy Weights...")
        for act in ACTION_TYPES:
            for fr, base_lift in FAILURE_REASONS:
                success_rate = min(0.95, max(0.35, base_lift + random.uniform(-0.1, 0.1)))
                attempts = random.randint(15, 60)
                successes = int(attempts * success_rate)

                sp = StrategyPerformance(
                    id=f"sp_{act}_{fr}",
                    segment_id="default_segment",
                    failure_type=fr,
                    action_type=act,
                    total_attempts=attempts,
                    success_count=successes,
                    success_rate=Decimal(str(round(success_rate, 4))),
                    avg_lift=Decimal(str(round(success_rate, 4))),
                    updated_at=datetime.utcnow()
                )
                db.add(sp)

                sw = StrategyWeight(
                    id=f"sw_{act}_{fr}",
                    action_type=act,
                    failure_reason=fr,
                    weight=Decimal(str(round(success_rate, 4))),
                    sample_size=attempts,
                    updated_at=datetime.utcnow()
                )
                db.add(sw)

        db.commit()
        print(f"✨ [Seed] Completed successfully! Seeded 50 customers, 100 opportunities, and full strategy weights.")

    except Exception as e:
        db.rollback()
        print(f"❌ [Seed] Error during demo data seeding: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
