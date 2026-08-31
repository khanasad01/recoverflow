import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import User, RevenueOpportunity, Outcome, Customer, Intervention
from apps.api.main import app
from apps.api.deps import get_db
from services.analytics.report_generator import ExecutiveReportGenerator


@pytest.fixture
def day9_client():
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
    # Seed data
    cust = Customer(id="cust_d9", merchant_id="merch_d9", email="vip@merchant.com")
    opp1 = RevenueOpportunity(
        id="opp_d9_1",
        merchant_id="merch_d9",
        customer_id="cust_d9",
        source_type="razorpay",
        amount_at_risk=Decimal("5000.00"),
        status="RECOVERED",
        failure_reason="CARD_DECLINED"
    )
    opp2 = RevenueOpportunity(
        id="opp_d9_2",
        merchant_id="merch_d9",
        customer_id="cust_d9",
        source_type="razorpay",
        amount_at_risk=Decimal("2500.00"),
        status="OPEN",
        failure_reason="INSUFFICIENT_FUNDS"
    )
    inv = Intervention(
        id="inv_d9_1",
        opportunity_id="opp_d9_1",
        action_type="payment_link",
        status="EXECUTED"
    )
    out = Outcome(
        id="out_d9_1",
        opportunity_id="opp_d9_1",
        intervention_id="inv_d9_1",
        payment_status="captured",
        recovered_amount=Decimal("5000.00")
    )
    db.add_all([cust, opp1, opp2, inv, out])
    db.commit()
    db.close()

    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_executive_report_generator_direct():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    cust = Customer(id="cust_rep", merchant_id="merch_rep")
    opp = RevenueOpportunity(
        id="opp_rep",
        merchant_id="merch_rep",
        customer_id="cust_rep",
        source_type="razorpay",
        amount_at_risk=Decimal("4000.00"),
        status="RECOVERED"
    )
    out = Outcome(
        id="out_rep",
        opportunity_id="opp_rep",
        payment_status="captured",
        recovered_amount=Decimal("4000.00")
    )
    db.add_all([cust, opp, out])
    db.commit()

    generator = ExecutiveReportGenerator()
    data = generator.generate_report_data(db)
    assert data["summary"]["total_opportunities"] == 1
    assert data["summary"]["gross_recovered_amount"] == 4000.0
    assert data["summary"]["recovery_rate_percent"] == 100.0

    md = generator.generate_markdown_summary(db)
    assert "RecoverFlow Executive Recovery Performance Report" in md
    assert "4,000.00" in md
    db.close()


def test_analytics_report_api_endpoint(day9_client):
    # 1. JSON Report
    resp_json = day9_client.get("/api/v1/analytics/report?format=json")
    assert resp_json.status_code == 200
    data = resp_json.json()
    assert "summary" in data
    assert data["summary"]["total_opportunities"] == 2
    assert data["summary"]["gross_recovered_amount"] == 5000.0
    assert data["summary"]["recovery_rate_percent"] == 50.0

    # 2. Markdown Report
    resp_md = day9_client.get("/api/v1/analytics/report?format=markdown")
    assert resp_md.status_code == 200
    assert "report_markdown" in resp_md.json()
    assert "RecoverFlow Executive Recovery Performance Report" in resp_md.json()["report_markdown"]
