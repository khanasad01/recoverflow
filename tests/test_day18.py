import pytest
import json
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import (
    Merchant,
    Customer,
    RevenueOpportunity,
    StrategyPerformance,
    StrategyWeight,
)
from simulator.generate_events import (
    create_failed_payment_event,
    create_captured_payment_event,
    create_payment_link_paid_event,
    create_stripe_event,
    sign_razorpay,
    sign_stripe,
    INDIAN_CUSTOMERS,
)
from scripts.seed_demo_data import seed_demo_data


def test_simulator_payload_generators_diversity():
    cust = INDIAN_CUSTOMERS[0]
    
    # 1. Razorpay Failed Event
    rzp_fail = create_failed_payment_event(cust, 1499.00)
    assert rzp_fail["event"] == "payment.failed"
    assert rzp_fail["payload"]["payment"]["entity"]["amount"] == 149900
    assert rzp_fail["payload"]["payment"]["entity"]["email"] == cust["email"]
    assert rzp_fail["payload"]["payment"]["entity"]["error_reason"] is not None

    # 2. Razorpay Captured Event
    rzp_cap = create_captured_payment_event(cust, 2499.00)
    assert rzp_cap["event"] == "payment.captured"
    assert rzp_cap["payload"]["payment"]["entity"]["status"] == "captured"

    # 3. Razorpay Payment Link Paid Event
    rzp_plink = create_payment_link_paid_event(cust, 999.00)
    assert rzp_plink["event"] == "payment_link.paid"
    assert rzp_plink["payload"]["payment_link"]["entity"]["status"] == "paid"

    # 4. Stripe Invoice Failed Event
    str_inv = create_stripe_event(cust, 5000.00, "invoice.payment_failed")
    assert str_inv["type"] == "invoice.payment_failed"
    assert str_inv["data"]["object"]["amount_due"] == 500000

    # 5. Stripe Checkout Abandoned
    str_chk = create_stripe_event(cust, 7500.00, "checkout.session.abandoned")
    assert str_chk["type"] == "checkout.session.abandoned"
    assert str_chk["data"]["object"]["status"] == "expired"


def test_simulator_hmac_signatures():
    payload = json.dumps({"test": "data"}).encode("utf-8")
    secret_rzp = "rzp_secret_key_123"
    secret_str = "whsec_stripe_test_123"

    sig_rzp = sign_razorpay(payload, secret_rzp)
    assert len(sig_rzp) == 64  # SHA256 hex length

    sig_str = sign_stripe(payload, secret_str)
    assert sig_str.startswith("t=")
    assert ",v1=" in sig_str


def test_seed_demo_data_runs_cleanly():
    # Test that seed_demo_data runs without exceptions
    seed_demo_data()
    # Re-run to ensure idempotency
    seed_demo_data()
