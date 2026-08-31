import pytest
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
