import pytest
from datetime import datetime
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import Merchant, RevenueOpportunity, OpportunityScore, Intervention, Outcome
from apps.api.main import app, get_db


@pytest.fixture
def client_with_db():
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

    # Seed data
    db = TestingSessionLocal()
    merchant = Merchant(id="merch_test_api", name="API Test Merchant", email="test@merch.io")
    db.add(merchant)
    db.flush()

    opp1 = RevenueOpportunity(
        id="opp_api_001",
        merchant_id=merchant.id,
        customer_id="cust_api_1",
        source_type="razorpay",
        source_id="evt_001",
        amount_at_risk=Decimal("1500.00"),
        currency="INR",
        failure_reason="CARD_DECLINED",
        status="OPEN",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    opp2 = RevenueOpportunity(
        id="opp_api_002",
        merchant_id=merchant.id,
        customer_id="cust_api_2",
        source_type="razorpay",
        source_id="evt_002",
        amount_at_risk=Decimal("250.00"),
        currency="INR",
        failure_reason="TIMEOUT",
        status="RECOVERED",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add_all([opp1, opp2])
    db.commit()

    score = OpportunityScore(
        id="score_001",
        opportunity_id="opp_api_001",
        model_version="heuristic_v1",
        recoverability_score=Decimal("0.8500"),
        expected_recovery=Decimal("1275.00"),
        priority_score=Decimal("1.2500"),
        created_at=datetime.utcnow()
    )
    db.add(score)
    db.commit()
    db.close()

    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_list_opportunities(client_with_db):
    response = client_with_db.get("/api/v1/opportunities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["currency"] == "INR"


def test_list_opportunities_filter_status(client_with_db):
    response = client_with_db.get("/api/v1/opportunities?status=OPEN")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "opp_api_001"
    assert data[0]["status"] == "OPEN"


def test_list_opportunities_filter_min_amount(client_with_db):
    response = client_with_db.get("/api/v1/opportunities?min_amount=1000")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "opp_api_001"


def test_get_opportunity_detail(client_with_db):
    response = client_with_db.get("/api/v1/opportunities/opp_api_001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "opp_api_001"
    assert data["amount_at_risk"] == 1500.0
    assert len(data["scores"]) == 1
    assert data["scores"][0]["model_version"] == "heuristic_v1"


def test_get_opportunity_not_found(client_with_db):
    response = client_with_db.get("/api/v1/opportunities/non_existent_id")
    assert response.status_code == 404
    assert response.json()["detail"] == "Opportunity not found"
