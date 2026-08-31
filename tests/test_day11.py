import json
import hmac
import hashlib
import os
import pytest
from datetime import datetime
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import User, RevenueOpportunity, Customer, RawEvent, Merchant
from apps.api.main import app
from apps.api.deps import get_db, get_current_active_user
from services.normalizer.stripe_normalizer import StripeNormalizer
from services.normalizer.unified_schema import UnifiedEvent
from services.opportunity_engine.engine import process_unified_event
from services.worker.tasks import process_raw_event


@pytest.fixture
def day11_db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()
    yield db
    db.close()


@pytest.fixture
def day11_client(day11_db):
    def override_get_db():
        try:
            yield day11_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_stripe_normalizer_payment_intent_failed():
    normalizer = StripeNormalizer()
    raw_payload = {
        "id": "evt_pi_failed_123",
        "type": "payment_intent.payment_failed",
        "created": 1700000000,
        "data": {
            "object": {
                "id": "pi_3Mtw",
                "object": "payment_intent",
                "amount": 5000,  # $50.00
                "currency": "usd",
                "customer": "cus_stripe_abc",
                "last_payment_error": {
                    "code": "card_declined",
                    "message": "Your card was declined."
                },
                "payment_method_types": ["card"],
                "status": "requires_payment_method"
            }
        }
    }

    event = normalizer.normalize(raw_payload)
    assert isinstance(event, UnifiedEvent)
    assert event.event_id == "evt_pi_failed_123"
    assert event.source == "stripe"
    assert event.event_type == "payment_failed"
    assert event.amount == 50.0
    assert event.currency == "USD"
    assert event.customer_id == "cus_stripe_abc"
    assert event.failure_reason == "card_declined"
    assert event.payment_method == "card"


def test_stripe_normalizer_invoice_payment_failed():
    normalizer = StripeNormalizer()
    raw_payload = {
        "id": "evt_in_failed_456",
        "type": "invoice.payment_failed",
        "created": 1700000000,
        "data": {
            "object": {
                "id": "in_1Mtw",
                "object": "invoice",
                "amount_due": 2999,  # $29.99
                "currency": "usd",
                "customer": "cus_sub_999",
                "failure_message": "insufficient_funds",
                "status": "open"
            }
        }
    }

    event = normalizer.normalize(raw_payload)
    assert event.event_id == "evt_in_failed_456"
    assert event.source == "stripe"
    assert event.event_type == "invoice_failed"
    assert event.amount == 29.99
    assert event.customer_id == "cus_sub_999"
    assert event.failure_reason == "insufficient_funds"


def test_stripe_normalizer_checkout_abandoned():
    normalizer = StripeNormalizer()
    raw_payload = {
        "id": "evt_cs_abandoned_789",
        "type": "checkout.session.abandoned",
        "created": 1700000000,
        "data": {
            "object": {
                "id": "cs_test_123",
                "object": "checkout.session",
                "amount_total": 15000,  # $150.00
                "currency": "usd",
                "customer": "cus_chk_111",
                "status": "open"
            }
        }
    }

    event = normalizer.normalize(raw_payload)
    assert event.event_id == "evt_cs_abandoned_789"
    assert event.source == "stripe"
    assert event.event_type == "checkout_abandoned"
    assert event.amount == 150.0
    assert event.customer_id == "cus_chk_111"


def test_stripe_normalizer_payment_succeeded():
    normalizer = StripeNormalizer()
    raw_payload = {
        "id": "evt_pi_succ_111",
        "type": "payment_intent.succeeded",
        "created": 1700000000,
        "data": {
            "object": {
                "id": "pi_succ_123",
                "amount": 5000,
                "currency": "usd",
                "customer": "cus_stripe_abc"
            }
        }
    }

    event = normalizer.normalize(raw_payload)
    assert event.event_type == "payment_captured"
    assert event.source == "stripe"
    assert event.amount == 50.0


def test_related_opportunity_graph_linking(day11_db):
    merchant = Merchant(id="merch_graph", name="Graph Merch", email="graph@merch.io")
    customer = Customer(id="cust_graph_1", merchant_id="merch_graph")
    day11_db.add_all([merchant, customer])
    day11_db.commit()

    # 1. Initial checkout payment failure
    event1 = UnifiedEvent(
        event_id="evt_initial_failed_1",
        source="stripe",
        event_type="payment_failed",
        customer_id="cust_graph_1",
        amount=120.00,
        currency="USD",
        failure_reason="card_declined",
        metadata={"merchant_id": "merch_graph"}
    )
    opp1 = process_unified_event(event1, day11_db)
    assert opp1 is not None
    assert opp1.related_opportunity_id is None

    # 2. Subsequent subscription invoice failure for same customer and amount
    event2 = UnifiedEvent(
        event_id="evt_invoice_failed_2",
        source="stripe",
        event_type="invoice_failed",
        customer_id="cust_graph_1",
        amount=120.00,
        currency="USD",
        failure_reason="card_declined",
        metadata={"merchant_id": "merch_graph"}
    )
    opp2 = process_unified_event(event2, day11_db)
    assert opp2 is not None
    assert opp2.related_opportunity_id == opp1.id


def test_stripe_webhook_endpoint_hmac(day11_client):
    secret = os.getenv("STRIPE_WEBHOOK_SECRET", "recoverflow_stripe_webhook_secret_123")
    payload_dict = {
        "id": "evt_webhook_test_101",
        "type": "payment_intent.payment_failed",
        "data": {
            "object": {
                "id": "pi_webhook_test",
                "amount": 4500,
                "currency": "usd",
                "customer": "cus_webhook_1"
            }
        }
    }
    payload_bytes = json.dumps(payload_dict).encode("utf-8")
    valid_signature = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()

    # 1. Valid signature
    resp = day11_client.post(
        "/webhooks/stripe",
        content=payload_bytes,
        headers={"Stripe-Signature": valid_signature, "Content-Type": "application/json"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"
    assert resp.json()["source"] == "stripe"

    # 2. Missing signature
    resp_missing = day11_client.post("/webhooks/stripe", content=payload_bytes)
    assert resp_missing.status_code == 400

    # 3. Invalid signature
    resp_invalid = day11_client.post(
        "/webhooks/stripe",
        content=payload_bytes,
        headers={"Stripe-Signature": "invalid_sig_abc"}
    )
    assert resp_invalid.status_code == 401


def test_opportunities_api_source_type_filter(day11_client, day11_db):
    merch = Merchant(id="merch_filter", name="Filter Merch", email="filter@merch.io")
    opp_rzp = RevenueOpportunity(
        id="opp_rzp_01",
        merchant_id="merch_filter",
        source_type="razorpay",
        amount_at_risk=Decimal("1000.00"),
        status="OPEN"
    )
    opp_stripe = RevenueOpportunity(
        id="opp_stripe_01",
        merchant_id="merch_filter",
        source_type="stripe",
        amount_at_risk=Decimal("2500.00"),
        status="OPEN"
    )
    day11_db.add_all([merch, opp_rzp, opp_stripe])
    day11_db.commit()


    # Filter by stripe
    res_stripe = day11_client.get("/api/v1/opportunities?source_type=stripe")
    assert res_stripe.status_code == 200
    stripe_opps = res_stripe.json()
    assert all(o["source_type"] == "stripe" for o in stripe_opps)
    assert any(o["id"] == "opp_stripe_01" for o in stripe_opps)

    # Filter by razorpay
    res_rzp = day11_client.get("/api/v1/opportunities?source_type=razorpay")
    assert res_rzp.status_code == 200
    rzp_opps = res_rzp.json()
    assert all(o["source_type"] == "razorpay" for o in rzp_opps)
    assert any(o["id"] == "opp_rzp_01" for o in rzp_opps)
