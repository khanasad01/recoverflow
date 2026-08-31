import os
import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import User, RevenueOpportunity, Customer
from apps.api.main import app
from apps.api.deps import get_db
from services.scoring.ml_scoring import MLScoringService, DEFAULT_MODEL_PATH
from services.scoring.service import score_opportunity
from services.streams.producer import publish_raw_event
from services.streams.consumer import consume_stream_events


@pytest.fixture
def day8_client():
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
    opp = RevenueOpportunity(
        id="opp_d8_test",
        merchant_id="merch_d8",
        source_type="razorpay",
        amount_at_risk=Decimal("1999.00"),
        status="OPEN"
    )
    db.add(opp)
    db.commit()
    db.close()

    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_prometheus_metrics_endpoint(day8_client):
    # Hit an endpoint to generate request metrics
    day8_client.get("/health")

    # Scrape metrics
    resp = day8_client.get("/metrics")
    assert resp.status_code == 200
    metrics_text = resp.text
    assert "http_requests_total" in metrics_text
    assert "webhook_events_total" in metrics_text
    assert "opportunity_recovery_rate" in metrics_text


def test_ml_scoring_service():
    test_model_path = "ml/models/test_model.pkl"
    ml_service = MLScoringService(model_path=test_model_path)

    # 1. Train model
    model = ml_service.train_and_save_model(n_samples=200)
    assert model is not None
    assert os.path.exists(test_model_path)

    # 2. Perform score inference
    score = ml_service.calculate_score(
        amount_at_risk=2500.0,
        customer_profile={
            "days_since_last_payment": 10,
            "successful_payments_30d": 4,
            "failed_payments_30d": 0,
            "historical_recovery_rate": 0.9
        },
        failure_reason="insufficient_funds"
    )
    assert isinstance(score, float)
    assert 0.01 <= score <= 0.99

    # Clean up test artifact
    if os.path.exists(test_model_path):
        os.remove(test_model_path)


def test_score_opportunity_with_ml_model():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    cust = Customer(id="cust_ml_test", merchant_id="merch_ml")
    opp = RevenueOpportunity(
        id="opp_ml_test",
        merchant_id="merch_ml",
        customer_id="cust_ml_test",
        source_type="razorpay",
        amount_at_risk=Decimal("3500.00"),
        failure_reason="insufficient_funds",
        status="OPEN"
    )
    db.add_all([cust, opp])
    db.commit()

    # Set SCORING_MODEL=ml
    os.environ["SCORING_MODEL"] = "ml"
    try:
        score_record = score_opportunity("opp_ml_test", db)
        assert score_record is not None
        assert score_record.model_version in ("ml_v1", "heuristic_v1")
        assert float(score_record.recoverability_score) > 0.0
    finally:
        os.environ.pop("SCORING_MODEL", None)
        db.close()


def test_redis_stream_producer_and_consumer():
    # Mock Redis client
    mock_redis = MagicMock()
    mock_redis.xadd.return_value = "1724600000000-0"
    mock_redis.xread.return_value = [
        ("recoverflow_events", [
            ("1724600000000-0", {"event_id": "evt_test", "event_type": "payment.failed"})
        ])
    ]

    # Test producer
    stream_id = publish_raw_event(
        event_id="evt_test_101",
        event_type="payment.failed",
        payload='{"amount": 1000}',
        redis_client=mock_redis
    )
    assert stream_id == "1724600000000-0"
    assert mock_redis.xadd.called

    # Test consumer
    messages = consume_stream_events(
        stream_name="recoverflow_events",
        count=5,
        redis_client=mock_redis
    )
    assert len(messages) == 1
    assert messages[0]["id"] == "1724600000000-0"
    assert messages[0]["data"]["event_id"] == "evt_test"


def test_sse_events_endpoint(day8_client):
    # Test streaming response
    with day8_client.stream("GET", "/api/v1/events") as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")
        # Read the first event chunk
        for line in response.iter_lines():
            if line.startswith("data:"):
                assert "total_opportunities" in line
                break
