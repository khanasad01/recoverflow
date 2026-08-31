import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import Merchant, Customer, Payment, RevenueOpportunity, OpportunityScore
from services.customer_profile.builder import CustomerProfileBuilder
from services.scoring.heuristic import HeuristicScoringService, compute_expected_recovery
from services.scoring.service import score_opportunity
from services.policy.engine import PolicyEngine
from apps.api.main import app, get_db


@pytest.fixture
def memory_db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    yield session
    session.close()


def test_customer_profile_builder(memory_db):
    merchant = Merchant(id="merch_cp", name="CP Merch", email="cp@merch.io")
    customer = Customer(id="cust_cp_1", merchant_id="merch_cp")
    memory_db.add_all([merchant, customer])
    memory_db.flush()

    now = datetime.utcnow()
    # Payments
    p1 = Payment(id="p1", merchant_id="merch_cp", customer_id="cust_cp_1", amount=Decimal("1000.00"), status="captured", created_at=now - timedelta(days=10))
    p2 = Payment(id="p2", merchant_id="merch_cp", customer_id="cust_cp_1", amount=Decimal("500.00"), status="failed", created_at=now - timedelta(days=20))
    p3 = Payment(id="p3", merchant_id="merch_cp", customer_id="cust_cp_1", amount=Decimal("1500.00"), status="captured", created_at=now - timedelta(days=60))
    
    # Opportunities
    opp1 = RevenueOpportunity(id="opp1", merchant_id="merch_cp", customer_id="cust_cp_1", source_type="razorpay", amount_at_risk=Decimal("500.00"), status="RECOVERED")
    opp2 = RevenueOpportunity(id="opp2", merchant_id="merch_cp", customer_id="cust_cp_1", source_type="razorpay", amount_at_risk=Decimal("1000.00"), status="OPEN")
    
    memory_db.add_all([p1, p2, p3, opp1, opp2])
    memory_db.commit()

    builder = CustomerProfileBuilder()
    profile = builder.build_profile("cust_cp_1", memory_db)

    assert profile["customer_id"] == "cust_cp_1"
    assert profile["successful_payment_count_30d"] == 1
    assert profile["successful_payment_count_90d"] == 2
    assert profile["failed_payment_count_30d"] == 1
    assert profile["average_payment_amount"] == 1000.0
    assert profile["previous_recovery_success_rate"] == 0.5


def test_customer_profile_builder_missing_customer(memory_db):
    builder = CustomerProfileBuilder()
    profile = builder.build_profile(None, memory_db)
    assert profile["successful_payment_count_30d"] == 0
    assert profile["average_payment_amount"] == 0.0


def test_heuristic_scoring_service():
    service = HeuristicScoringService()

    # Case 1: High recoverability (positive reason, low amount, retries = 0, good customer profile)
    opp_high = RevenueOpportunity(
        id="opp_high",
        failure_reason="insufficient_funds",
        amount_at_risk=Decimal("500.00"),
        retry_count=0
    )
    profile_good = {
        "successful_payment_count_90d": 3,
        "failed_payment_count_90d": 1
    }
    score_high = service.calculate_score(opp_high, profile_good)
    # base 0.5 + 0.2 (reason) + 0.1 (success) + 0.1 (failed<=2) + 0.1 (<1000) + 0.1 (retry=0) = 1.1 -> clamped to 1.0
    assert score_high == 1.0
    expected_rec = compute_expected_recovery(score_high, 500.0)
    assert expected_rec == 500.0

    # Case 2: Low recoverability (negative reason, high amount, retries > 0, poor profile)
    opp_low = RevenueOpportunity(
        id="opp_low",
        failure_reason="card_expired",
        amount_at_risk=Decimal("15000.00"),
        retry_count=2
    )
    profile_poor = {
        "successful_payment_count_90d": 0,
        "failed_payment_count_90d": 5
    }
    score_low = service.calculate_score(opp_low, profile_poor)
    # base 0.5 - 0.2 (reason) - 0.1 (success=0) - 0.1 (failed>2) - 0.05 (>=1000) - 0.1 (retry>0) = -0.05 -> clamped to 0.0
    assert score_low == 0.0


def test_score_opportunity(memory_db):
    merchant = Merchant(id="merch_sc", name="Score Merch", email="sc@merch.io")
    customer = Customer(id="cust_sc_1", merchant_id="merch_sc")
    memory_db.add_all([merchant, customer])
    memory_db.flush()

    opp = RevenueOpportunity(
        id="opp_sc_1",
        merchant_id="merch_sc",
        customer_id="cust_sc_1",
        source_type="razorpay",
        amount_at_risk=Decimal("800.00"),
        failure_reason="card_declined",
        retry_count=0
    )
    memory_db.add(opp)
    memory_db.commit()

    score_rec = score_opportunity("opp_sc_1", memory_db)
    assert score_rec is not None
    assert score_rec.opportunity_id == "opp_sc_1"
    assert score_rec.model_version == "heuristic_v1"
    assert float(score_rec.recoverability_score) > 0.0
    assert float(score_rec.expected_recovery) > 0.0
    assert "successful_payment_count_90d" in score_rec.features_json


def test_policy_engine():
    engine = PolicyEngine()

    # Rule 1: Allow valid payment link
    opp_valid = RevenueOpportunity(
        id="opp_pol_1",
        amount_at_risk=Decimal("2000.00"),
        failure_reason="insufficient_funds",
        retry_count=1
    )
    result = engine.evaluate(opp_valid, "payment_link")
    assert result["allowed"] is True

    # Rule 2: Deny when amount exceeds limit (10000)
    opp_high_amt = RevenueOpportunity(
        id="opp_pol_2",
        amount_at_risk=Decimal("15000.00"),
        failure_reason="insufficient_funds",
        retry_count=1
    )
    result = engine.evaluate(opp_high_amt, "payment_link")
    assert result["allowed"] is False
    assert result["reason"] == "Amount exceeds limit"

    # Rule 3: Deny when max retries exceeded (>= 3)
    opp_max_retries = RevenueOpportunity(
        id="opp_pol_3",
        amount_at_risk=Decimal("1000.00"),
        failure_reason="insufficient_funds",
        retry_count=3
    )
    result = engine.evaluate(opp_max_retries, "payment_link")
    assert result["allowed"] is False
    assert result["reason"] == "Max retries exceeded"

    # Rule 4: Deny when failure reason is not allowed
    opp_bad_reason = RevenueOpportunity(
        id="opp_pol_4",
        amount_at_risk=Decimal("1000.00"),
        failure_reason="fraud_detected",
        retry_count=0
    )
    result = engine.evaluate(opp_bad_reason, "payment_link")
    assert result["allowed"] is False
    assert result["reason"] == "Failure reason not allowed"


def test_opportunities_api_sort_by_score():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    db = TestingSessionLocal()
    merchant = Merchant(id="merch_sort_test", name="Sort Merch", email="sort@merch.io")
    db.add(merchant)
    db.flush()

    opp_low = RevenueOpportunity(
        id="opp_sort_low",
        merchant_id=merchant.id,
        source_type="razorpay",
        amount_at_risk=Decimal("5000.00"),
        status="OPEN",
        created_at=datetime.utcnow()
    )
    opp_high = RevenueOpportunity(
        id="opp_sort_high",
        merchant_id=merchant.id,
        source_type="razorpay",
        amount_at_risk=Decimal("500.00"),
        status="OPEN",
        created_at=datetime.utcnow() - timedelta(minutes=5)
    )
    db.add_all([opp_low, opp_high])
    db.flush()

    score_low = OpportunityScore(
        id="sc_low",
        opportunity_id="opp_sort_low",
        model_version="heuristic_v1",
        recoverability_score=Decimal("0.2500"),
        expected_recovery=Decimal("1250.00"),
        created_at=datetime.utcnow()
    )
    score_high = OpportunityScore(
        id="sc_high",
        opportunity_id="opp_sort_high",
        model_version="heuristic_v1",
        recoverability_score=Decimal("0.9500"),
        expected_recovery=Decimal("475.00"),
        created_at=datetime.utcnow()
    )
    db.add_all([score_low, score_high])
    db.commit()
    db.close()

    client = TestClient(app)
    response = client.get("/api/v1/opportunities?sort=score")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    # Highest score first
    assert data[0]["id"] == "opp_sort_high"
    assert data[0]["latest_score"]["recoverability_score"] == 0.95
    assert data[1]["id"] == "opp_sort_low"
    assert data[1]["latest_score"]["recoverability_score"] == 0.25

    app.dependency_overrides.clear()
