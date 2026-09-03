import os
from unittest.mock import MagicMock, patch
import pytest

# Ensure test environments satisfy fail-fast startup checks
os.environ.setdefault("JWT_SECRET_KEY", "test_suite_secure_jwt_secret_key_9876543210")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("RAZORPAY_KEY_ID", "rzp_test_suite_key")
os.environ.setdefault("RAZORPAY_KEY_SECRET", "test_suite_secret")
os.environ.setdefault("RAZORPAY_WEBHOOK_SECRET", "test_suite_webhook_secret")

from database.models import User
from apps.api.deps import get_current_active_user, get_current_user
from apps.api.main import app


def smart_mock_requests_post(url, *args, **kwargs):
    """Hermetic mock for external HTTP POST calls across payment gateways and notification APIs."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    url_str = str(url)

    if "api.razorpay.com/v1/payment_links" in url_str:
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "id": "plink_mock_test_12345",
            "short_url": "https://rzp.io/i/plink_mock_test_12345",
            "status": "created",
            "amount": 150000
        }
        mock_resp.text = '{"id": "plink_mock_test_12345", "status": "created"}'
    elif "api.razorpay.com/v1/orders" in url_str:
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "id": "order_mock_test_12345",
            "status": "created",
            "amount": 120000
        }
        mock_resp.text = '{"id": "order_mock_test_12345", "status": "created"}'
    elif "api.sendgrid.com" in url_str:
        mock_resp.status_code = 202
        mock_resp.json.return_value = {}
        mock_resp.text = ""
    elif "api.twilio.com" in url_str:
        mock_resp.status_code = 201
        mock_resp.json.return_value = {
            "sid": "SM_mock_test_12345",
            "status": "queued"
        }
        mock_resp.text = '{"sid": "SM_mock_test_12345", "status": "queued"}'
    else:
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"status": "ok"}
        mock_resp.text = '{"status": "ok"}'

    return mock_resp


def smart_mock_requests_get(url, *args, **kwargs):
    """Hermetic mock for external HTTP GET calls."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"status": "ok"}
    mock_resp.text = '{"status": "ok"}'
    return mock_resp


def get_mock_sendgrid_client(*args, **kwargs):
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.status_code = 202
    mock_client.send.return_value = mock_resp
    return mock_client


def get_mock_twilio_client(*args, **kwargs):
    mock_client = MagicMock()
    mock_msg = MagicMock()
    mock_msg.sid = "SM_mock_twilio_12345"
    mock_msg.status = "queued"
    mock_client.messages.create.return_value = mock_msg
    return mock_client


def get_mock_genai_client(*args, **kwargs):
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "Payment declined due to transient issuer limits. Recommended rail: Smart Retry."
    mock_client.models.generate_content.return_value = mock_resp
    return mock_client


@pytest.fixture(autouse=True)
def mock_all_external_network_calls():
    """
    Autouse fixture that prevents any unit tests from making outbound HTTP or SDK network calls.
    Mocks Razorpay, SendGrid, Twilio, and Google GenAI APIs with realistic payload structures.
    """
    patches = [
        patch("requests.post", side_effect=smart_mock_requests_post),
        patch("requests.get", side_effect=smart_mock_requests_get),
    ]

    try:
        from services.notification import email_service
        patches.append(patch.object(email_service, "SendGridAPIClient", side_effect=get_mock_sendgrid_client))
    except Exception:
        pass

    try:
        from services.notification import whatsapp_service
        patches.append(patch.object(whatsapp_service, "Client", side_effect=get_mock_twilio_client))
    except Exception:
        pass

    try:
        from google import genai
        patches.append(patch.object(genai, "Client", side_effect=get_mock_genai_client))
    except Exception:
        pass

    for p in patches:
        try:
            p.start()
        except Exception:
            pass

    yield

    for p in reversed(patches):
        try:
            p.stop()
        except Exception:
            pass


@pytest.fixture(autouse=True)
def default_auth_override():
    """Provides a default authenticated admin user mock for general test suites."""
    mock_user = User(
        id="user_test_default",
        email="admin@recoverflow.dev",
        full_name="Default Test Admin",
        role="admin",
        is_active=True
    )
    app.dependency_overrides[get_current_active_user] = lambda: mock_user
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield
    app.dependency_overrides.pop(get_current_active_user, None)
    app.dependency_overrides.pop(get_current_user, None)
