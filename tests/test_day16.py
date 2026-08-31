import pytest
from decimal import Decimal
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import RevenueOpportunity, Intervention, Customer, Merchant
from services.payments.upi_qr import UPIQRGenerator
from services.notification.email_service import EmailService

from services.notification.whatsapp_service import WhatsAppService
from services.action_executor.upi_qr_adapter import UPIQRAdapter
from services.action_executor.executor import ActionExecutor
from services.policy.engine import PolicyEngine
from services.resource_manager import check_limit, increment_usage, get_all_usage
from agents.orchestrator.graph import run_recovery_graph



@pytest.fixture
def day16_db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()

    merch = Merchant(
        id="merch_123",
        name="RecoverFlow UPI Merchant",
        email="merchant@recoverflow.dev"
    )
    db.add(merch)

    cust = Customer(
        id="cust_upi_123",
        merchant_id="merch_123",
        external_id="ext_cust_123",
        email="upi.customer@recoverflow.dev",
        phone="+919876543210"
    )
    db.add(cust)

    opp = RevenueOpportunity(
        id="opp_upi_test_1",
        merchant_id="merch_123",
        customer_id="cust_upi_123",
        amount_at_risk=Decimal("2500.00"),
        currency="INR",
        failure_reason="insufficient_funds",
        status="OPEN",
        retry_count=0,
        source_type="upi"
    )
    db.add(opp)
    db.commit()

    yield db
    db.close()


def test_upi_qr_generator_uri_and_image():
    gen = UPIQRGenerator(merchant_upi_id="merchant@okaxis", merchant_name="Acme Corp")
    uri = gen.generate_upi_uri(amount=499.50, currency="INR", note="Test Recovery", ref_id="ref_001")
    assert "upi://pay?" in uri
    assert "pa=merchant%40okaxis" in uri or "pa=merchant@okaxis" in uri
    assert "am=499.50" in uri
    assert "cu=INR" in uri

    qr_b64 = gen.generate_qr_base64(amount=499.50, currency="INR", note="Test Recovery", ref_id="ref_001")
    assert isinstance(qr_b64, str)
    assert len(qr_b64) > 100


def test_email_service_send_qr_email():
    svc = EmailService()
    res = svc.send_qr_email(
        to_email="test@enterprise.io",
        subject="Payment Recovery QR",
        amount=1200.00,
        qr_base64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    )
    assert res is True


def test_whatsapp_service_send_qr_whatsapp():
    svc = WhatsAppService()
    res = svc.send_qr_whatsapp(
        to_number="+919876543210",
        amount=1200.00,
        upi_uri="upi://pay?pa=merchant@upi&pn=Merchant&am=1200.00&cu=INR"
    )
    assert res is True


def test_upi_qr_adapter_execution(day16_db):
    opp = day16_db.query(RevenueOpportunity).filter(RevenueOpportunity.id == "opp_upi_test_1").first()
    intv = Intervention(
        id="intv_upi_001",
        opportunity_id=opp.id,
        action_type="upi_qr",
        status="PENDING"
    )
    day16_db.add(intv)
    day16_db.commit()

    adapter = UPIQRAdapter()
    result = adapter.execute(opp, intv, day16_db)

    assert result["success"] is True
    assert result["external_ref"].startswith("upi_qr_")
    assert "upi_uri" in result["payload"]
    assert result["payload"]["amount"] == 2500.0
    assert "whatsapp" in result["payload"]["channels"]
    assert "email" in result["payload"]["channels"]


def test_action_executor_with_upi_qr(day16_db):
    opp = day16_db.query(RevenueOpportunity).filter(RevenueOpportunity.id == "opp_upi_test_1").first()
    executor = ActionExecutor()
    intv = executor.execute(
        opportunity=opp,
        action_type="upi_qr",
        decision_reason="Testing UPI QR execution",
        confidence=0.92,
        db=day16_db
    )

    assert intv.status == "EXECUTED"
    assert intv.external_ref is not None
    assert opp.status == "ACTIONED"
    assert opp.retry_count == 1


def test_policy_engine_evaluates_upi_qr(day16_db):
    engine = PolicyEngine()
    opp = day16_db.query(RevenueOpportunity).filter(RevenueOpportunity.id == "opp_upi_test_1").first()

    # Allowed within 10,000 and valid failure reason
    eval1 = engine.evaluate(opp, "upi_qr")
    assert eval1["allowed"] is True

    # Denied if amount exceeds 10,000
    opp.amount_at_risk = Decimal("15000.00")
    eval2 = engine.evaluate(opp, "upi_qr")
    assert eval2["allowed"] is False
    assert "exceeds limit" in eval2["reason"].lower()


def test_langgraph_selects_upi_qr(day16_db):
    res = run_recovery_graph(
        opportunity_id="opp_upi_test_1",
        db=day16_db
    )
    assert res.get("selected_action") == "upi_qr"
    assert res.get("policy_allowed") is True
    assert res.get("execution_status") == "EXECUTED"




def test_resource_manager_tracks_upi_qr(day16_db):
    assert check_limit("upi_qr", day16_db) is True
    count = increment_usage("upi_qr", day16_db)
    assert count >= 1

    usage = get_all_usage(day16_db)
    upi_usage = next((u for u in usage if u["action_type"] == "upi_qr"), None)
    assert upi_usage is not None
    assert upi_usage["max_daily"] == 500
