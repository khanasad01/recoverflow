import pytest
from datetime import datetime
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import (
    Merchant,
    Customer,
    RevenueOpportunity,
    Intervention,
    Outcome,
    OpportunityScore,
)
from apps.api.main import app, get_db
from simulator.generate_events import (
    create_failed_payment_event,
    create_captured_payment_event,
    create_payment_link_paid_event,
    sign_payload,
)


@pytest.fixture
def client_with_day6_db():
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
    merchant = Merchant(id="merch_day6", name="Day 6 HQ", email="hq@recoverflow.io")
    customer = Customer(id="cust_day6_1", merchant_id="merch_day6", email="vip@customer.io", phone="+919876543210")
    db.add_all([merchant, customer])
    db.flush()

    opp1 = RevenueOpportunity(
        id="opp_d6_1",
        merchant_id="merch_day6",
        customer_id="cust_day6_1",
        source_type="razorpay",
        amount_at_risk=Decimal("2500.00"),
        failure_reason="insufficient_funds",
        status="OPEN"
    )
    opp2 = RevenueOpportunity(
        id="opp_d6_2",
        merchant_id="merch_day6",
        customer_id="cust_day6_1",
        source_type="razorpay",
        amount_at_risk=Decimal("1500.00"),
        failure_reason="card_declined",
        status="RECOVERED"
    )
    db.add_all([opp1, opp2])
    db.flush()

    score = OpportunityScore(
        id="score_d6_1",
        opportunity_id="opp_d6_1",
        model_version="heuristic_v1",
        recoverability_score=Decimal("0.8500"),
        expected_recovery=Decimal("2125.00"),
        created_at=datetime.utcnow()
    )
    intv = Intervention(
        id="intv_d6_1",
        opportunity_id="opp_d6_1",
        action_type="payment_link",
        decision_reason="High recovery score",
        status="EXECUTED"
    )
    out = Outcome(
        id="out_d6_1",
        opportunity_id="opp_d6_2",
        payment_status="captured",
        recovered_amount=Decimal("1500.00")
    )
    db.add_all([score, intv, out])
    db.commit()
    db.close()

    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_get_overview_api(client_with_day6_db):
    response = client_with_day6_db.get("/api/v1/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["revenue_at_risk"] == 4000.0
    assert data["gross_recovered"] == 1500.0
    assert data["total_opportunities"] == 2
    assert data["recovered_count"] == 1
    assert data["open_count"] == 1
    assert "status_distribution" in data
    assert "timeline" in data


def test_customers_api(client_with_day6_db):
    # List
    resp_list = client_with_day6_db.get("/api/v1/customers")
    assert resp_list.status_code == 200
    customers = resp_list.json()
    assert len(customers) == 1
    assert customers[0]["id"] == "cust_day6_1"
    assert customers[0]["total_opportunities"] == 2

    # Detail
    resp_detail = client_with_day6_db.get("/api/v1/customers/cust_day6_1")
    assert resp_detail.status_code == 200
    detail = resp_detail.json()
    assert detail["id"] == "cust_day6_1"
    assert "profile_metrics" in detail


def test_interventions_api(client_with_day6_db):
    resp = client_with_day6_db.get("/api/v1/interventions")
    assert resp.status_code == 200
    intvs = resp.json()
    assert len(intvs) >= 1
    assert intvs[0]["action_type"] == "payment_link"


def test_policy_api(client_with_day6_db):
    # GET
    resp_get = client_with_day6_db.get("/api/v1/policy")
    assert resp_get.status_code == 200
    assert "yaml_content" in resp_get.json()
    assert "parsed" in resp_get.json()

    # PUT
    test_yaml = "max_payment_link_amount: 15000\nmax_retry_attempts: 4\nallowed_failure_reasons:\n  - insufficient_funds\n"
    resp_put = client_with_day6_db.put("/api/v1/policy", json={"yaml_content": test_yaml})
    assert resp_put.status_code == 200
    assert resp_put.json()["parsed"]["max_payment_link_amount"] == 15000


def test_settings_api(client_with_day6_db):
    resp = client_with_day6_db.get("/api/v1/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert "webhook_url" in data
    assert data["status"] == "Healthy"


def test_simulator_payload_generators():
    # Test failed payment generator
    fail_payload = create_failed_payment_event("cust_sim_1", 999.0)
    assert fail_payload["event"] == "payment.failed"
    assert fail_payload["payload"]["payment"]["entity"]["amount"] == 99900

    # Test captured payment generator
    cap_payload = create_captured_payment_event("cust_sim_2", 1499.0)
    assert cap_payload["event"] == "payment.captured"
    assert cap_payload["payload"]["payment"]["entity"]["amount"] == 149900

    # Test payment link paid generator
    plink_payload = create_payment_link_paid_event("cust_sim_3", 499.0)
    assert plink_payload["event"] == "payment_link.paid"

    # Test signature computation
    sig = sign_payload(b'{"test": 1}', "secret123")
    assert isinstance(sig, str)
    assert len(sig) == 64
