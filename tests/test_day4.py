import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import Merchant, Customer, RevenueOpportunity, Intervention, Outcome, EvidenceEvent
from services.action_executor.razorpay_adapter import RazorpayPaymentLinkAdapter
from services.action_executor.email_adapter import EmailReminderAdapter
from services.action_executor.human_escalation import HumanEscalationAdapter
from services.action_executor.executor import ActionExecutor
from agents.orchestrator.graph import run_recovery_graph
from apps.api.main import app, get_db


@pytest.fixture
def test_db():
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


def test_razorpay_payment_link_adapter(test_db):
    merchant = Merchant(id="merch_rzp", name="Rzp Merch", email="rzp@merch.io")
    customer = Customer(id="cust_rzp", merchant_id="merch_rzp", email="cust@test.com", phone="9999999999")
    opp = RevenueOpportunity(
        id="opp_rzp_1",
        merchant_id="merch_rzp",
        customer_id="cust_rzp",
        source_type="razorpay",
        amount_at_risk=Decimal("1500.00"),
        currency="INR"
    )
    intervention = Intervention(
        id="intv_rzp_1",
        opportunity_id="opp_rzp_1",
        action_type="payment_link"
    )
    test_db.add_all([merchant, customer, opp, intervention])
    test_db.flush()

    adapter = RazorpayPaymentLinkAdapter()
    with patch("integrations.razorpay_client.requests.post") as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "id": "plink_test_12345",
            "short_url": "https://rzp.io/i/test12345",
            "status": "created",
            "amount": 150000
        }
        result = adapter.execute(opp, intervention, test_db)

    assert result["success"] is True
    assert result["external_ref"] == "plink_test_12345"


def test_email_reminder_adapter(test_db):
    opp = RevenueOpportunity(
        id="opp_email_1",
        merchant_id="merch_default",
        source_type="razorpay",
        amount_at_risk=Decimal("499.00"),
        currency="INR"
    )
    intervention = Intervention(
        id="intv_email_1",
        opportunity_id="opp_email_1",
        action_type="email_reminder"
    )
    test_db.add_all([opp, intervention])
    test_db.flush()

    adapter = EmailReminderAdapter()
    result = adapter.execute(opp, intervention, test_db)
    assert result["success"] is True
    assert result["payload"]["status"] == "sent"


def test_human_escalation_adapter(test_db):
    opp = RevenueOpportunity(
        id="opp_esc_1",
        merchant_id="merch_default",
        source_type="razorpay",
        amount_at_risk=Decimal("25000.00"),
        currency="INR"
    )
    intervention = Intervention(
        id="intv_esc_1",
        opportunity_id="opp_esc_1",
        action_type="human_escalation",
        decision_reason="Large unpaid invoice"
    )
    test_db.add_all([opp, intervention])
    test_db.flush()

    adapter = HumanEscalationAdapter()
    result = adapter.execute(opp, intervention, test_db)
    assert result["success"] is True
    assert result["payload"]["escalated"] is True
    assert result["payload"]["priority"] == "HIGH"


def test_action_executor_execute_and_outcome(test_db):
    merchant = Merchant(id="merch_exec", name="Exec Merch", email="exec@merch.io")
    opp = RevenueOpportunity(
        id="opp_exec_1",
        merchant_id="merch_exec",
        source_type="razorpay",
        amount_at_risk=Decimal("800.00"),
        status="OPEN",
        retry_count=0
    )
    test_db.add_all([merchant, opp])
    test_db.commit()

    executor = ActionExecutor()
    intervention = executor.execute(
        opportunity=opp,
        action_type="email_reminder",
        decision_reason="Mild reminder",
        confidence=0.9,
        db=test_db
    )

    assert intervention.status == "EXECUTED"
    assert intervention.action_type == "email_reminder"
    assert opp.status == "ACTIONED"
    assert opp.retry_count == 1

    # Record outcome
    outcome = executor.record_outcome(
        intervention=intervention,
        payment_status="captured",
        recovered_amount=800.00,
        event_id="evt_paid_123",
        db=test_db
    )

    assert outcome.payment_status == "captured"
    assert float(outcome.recovered_amount) == 800.00
    assert opp.status == "RECOVERED"


def test_langgraph_recovery_orchestrator(test_db):
    merchant = Merchant(id="merch_lg", name="LG Merch", email="lg@merch.io")
    customer = Customer(id="cust_lg", merchant_id="merch_lg", email="cust@lg.io")
    opp = RevenueOpportunity(
        id="opp_lg_1",
        merchant_id="merch_lg",
        customer_id="cust_lg",
        source_type="razorpay",
        amount_at_risk=Decimal("1200.00"),
        failure_reason="insufficient_funds",
        status="OPEN"
    )
    test_db.add_all([merchant, customer, opp])
    test_db.commit()

    result = run_recovery_graph("opp_lg_1", test_db)

    assert result["opportunity_id"] == "opp_lg_1"
    assert "diagnosis" in result
    assert result["selected_action"] in ("payment_link", "email_reminder", "human_escalation")
    assert result["execution_status"] in ("EXECUTED", "PENDING", "SKIPPED")

    # Verify EvidenceEvents persisted in DB
    ev_events = test_db.query(EvidenceEvent).filter(EvidenceEvent.opportunity_id == "opp_lg_1").all()
    assert len(ev_events) >= 3


def test_manual_action_api():
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
    merchant = Merchant(id="merch_api_act", name="API Action Merch", email="act@merch.io")
    opp_valid = RevenueOpportunity(
        id="opp_api_act_1",
        merchant_id=merchant.id,
        source_type="razorpay",
        amount_at_risk=Decimal("1000.00"),
        failure_reason="insufficient_funds",
        status="OPEN",
        retry_count=0
    )
    opp_denied = RevenueOpportunity(
        id="opp_api_act_2",
        merchant_id=merchant.id,
        source_type="razorpay",
        amount_at_risk=Decimal("25000.00"),  # exceeds max 10000 for payment_link
        failure_reason="insufficient_funds",
        status="OPEN",
        retry_count=0
    )
    db.add_all([merchant, opp_valid, opp_denied])
    db.commit()
    db.close()

    client = TestClient(app)

    # 1. Successful manual action
    resp_success = client.post(
        "/api/v1/opportunities/opp_api_act_1/action",
        json={"action_type": "payment_link", "decision_reason": "agent override", "confidence": 0.95}
    )
    assert resp_success.status_code == 200
    data_success = resp_success.json()
    assert data_success["status"] == "EXECUTED"
    assert data_success["action_type"] == "payment_link"

    # 2. Policy violation action
    resp_denied = client.post(
        "/api/v1/opportunities/opp_api_act_2/action",
        json={"action_type": "payment_link", "decision_reason": "should fail"}
    )
    assert resp_denied.status_code == 422
    assert "Policy violation" in resp_denied.json()["detail"]

    # 3. Non existent
    resp_404 = client.post(
        "/api/v1/opportunities/non_existent/action",
        json={"action_type": "email_reminder"}
    )
    assert resp_404.status_code == 404

    app.dependency_overrides.clear()
