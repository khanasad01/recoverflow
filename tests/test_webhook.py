import os
import json
import hmac
import hashlib
from unittest.mock import patch

from fastapi.testclient import TestClient

from apps.api.main import app

client = TestClient(app)

SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "recoverflow_webhook_secret_123")


def generate_signature(payload: bytes) -> str:
    return hmac.new(SECRET.encode(), payload, hashlib.sha256).hexdigest()


def create_payload(event_id="pay_test_123"):
    return json.dumps({
        "event": "payment.captured",
        "event_id": event_id,
        "payload": {
            "payment": {
                "entity": {
                    "id": event_id
                }
            }
        }
    }).encode()


def post_webhook(payload: bytes, signature: str = None):
    headers = {"Content-Type": "application/json"}
    if signature:
        headers["X-Razorpay-Signature"] = signature
    return client.post("/webhooks/razorpay", content=payload, headers=headers)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_valid_signature():
    payload = create_payload()
    sig = generate_signature(payload)
    # Mock the Celery delay to avoid Redis connection
    with patch('services.worker.tasks.store_raw_event.delay') as mock_delay:
        response = post_webhook(payload, sig)
    assert response.status_code == 200
    assert response.json() == {"status": "accepted"}
    mock_delay.assert_called_once()


def test_missing_signature():
    payload = create_payload()
    response = post_webhook(payload)  # no signature
    assert response.status_code == 400
    assert response.json()["detail"] == "Missing signature header"


def test_invalid_signature():
    payload = create_payload()
    response = post_webhook(payload, "bad_signature")
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid signature"


def test_invalid_json():
    payload = b"not a json"
    sig = generate_signature(payload)
    response = post_webhook(payload, sig)
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid JSON payload"