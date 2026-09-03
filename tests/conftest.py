import os
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
