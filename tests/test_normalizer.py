import pytest
from datetime import datetime
from services.normalizer.unified_schema import UnifiedEvent
from services.normalizer.razorpay_normalizer import RazorpayNormalizer


def test_unified_event_schema():
    event = UnifiedEvent(
        event_id="evt_123",
        source="razorpay",
        event_type="payment_failed",
        customer_id="cust_abc",
        amount=1499.50,
        currency="INR",
        failure_reason="INSUFFICIENT_FUNDS",
        payment_method="upi",
        timestamp=datetime.utcnow(),
        metadata={"bank": "HDFC", "custom_tag": "test"}
    )
    assert event.event_id == "evt_123"
    assert event.source == "razorpay"
    assert event.amount == 1499.50
    assert event.metadata["bank"] == "HDFC"


def test_razorpay_normalizer_payment_failed():
    normalizer = RazorpayNormalizer()
    raw_payload = {
        "entity": "event",
        "account_id": "acc_test_merchant",
        "event": "payment.failed",
        "event_id": "evt_fail_999",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_001",
                    "amount": 50000,  # 500.00 INR
                    "currency": "INR",
                    "status": "failed",
                    "method": "card",
                    "customer_id": "cust_test_123",
                    "error_code": "BAD_REQUEST_ERROR",
                    "error_description": "Payment failed due to insufficient funds",
                    "error_reason": "payment_failed",
                    "created_at": 1672531199,
                    "notes": {"merchant_id": "merch_001"}
                }
            }
        }
    }

    unified = normalizer.normalize(raw_payload)

    assert unified.event_id == "evt_fail_999"
    assert unified.source == "razorpay"
    assert unified.event_type == "payment_failed"
    assert unified.amount == 500.0
    assert unified.currency == "INR"
    assert unified.failure_reason == "Payment failed due to insufficient funds"
    assert unified.payment_method == "card"
    assert unified.customer_id == "cust_test_123"
    assert unified.metadata["merchant_id"] == "merch_001"
    assert unified.metadata["account_id"] == "acc_test_merchant"


def test_razorpay_normalizer_payment_captured():
    normalizer = RazorpayNormalizer()
    raw_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_captured",
                    "amount": 100000,  # 1000.00 INR
                    "currency": "INR",
                    "status": "captured",
                    "method": "upi",
                    "customer_id": "cust_test_456",
                    "created_at": 1672532000
                }
            }
        }
    }

    unified = normalizer.normalize(raw_payload)

    assert unified.event_id == "pay_test_captured"
    assert unified.event_type == "payment_captured"
    assert unified.amount == 1000.0
    assert unified.payment_method == "upi"
    assert unified.customer_id == "cust_test_456"
    assert unified.failure_reason is None


def test_razorpay_normalizer_payment_link_paid():
    normalizer = RazorpayNormalizer()
    raw_payload = {
        "event": "payment_link.paid",
        "payload": {
            "payment_link": {
                "entity": {
                    "id": "plink_test_789",
                    "amount": 25000,
                    "currency": "INR",
                    "status": "paid",
                    "customer": {
                        "id": "cust_plink_1"
                    },
                    "created_at": 1672533000
                }
            }
        }
    }

    unified = normalizer.normalize(raw_payload)

    assert unified.event_id == "plink_test_789"
    assert unified.event_type == "payment_link_paid"
    assert unified.amount == 250.0
    assert unified.customer_id == "cust_plink_1"
