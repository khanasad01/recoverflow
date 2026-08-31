import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import User
from apps.api.main import app
from apps.api.deps import get_db, get_current_user, get_current_active_user
from apps.api.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)


@pytest.fixture
def auth_test_client():
    # Remove mock overrides for auth testing
    app.dependency_overrides.pop(get_current_active_user, None)
    app.dependency_overrides.pop(get_current_user, None)

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
    admin_user = User(
        id="user_admin_test",
        email="admin@recoverflow.dev",
        hashed_password=get_password_hash("admin123"),
        full_name="Admin Tester",
        role="admin",
        is_active=True,
        created_at=datetime.utcnow()
    )
    support_user = User(
        id="user_support_test",
        email="support@recoverflow.dev",
        hashed_password=get_password_hash("support123"),
        full_name="Support Tester",
        role="support",
        is_active=True,
        created_at=datetime.utcnow()
    )
    inactive_user = User(
        id="user_inactive_test",
        email="inactive@recoverflow.dev",
        hashed_password=get_password_hash("inactive123"),
        full_name="Inactive Tester",
        role="support",
        is_active=False,
        created_at=datetime.utcnow()
    )
    db.add_all([admin_user, support_user, inactive_user])
    db.commit()
    db.close()

    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_password_hashing_and_jwt_tokens():
    raw_pass = "my_secure_password_99"
    hashed = get_password_hash(raw_pass)
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("wrong_pass", hashed) is False

    token = create_access_token({"sub": "test@user.io", "role": "admin"})
    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == "test@user.io"
    assert payload.get("role") == "admin"


def test_login_endpoint(auth_test_client):
    # 1. Success login as Admin
    resp_admin = auth_test_client.post("/api/v1/auth/login", json={
        "email": "admin@recoverflow.dev",
        "password": "admin123"
    })
    assert resp_admin.status_code == 200
    data_admin = resp_admin.json()
    assert "access_token" in data_admin
    assert data_admin["user"]["role"] == "admin"

    # 2. Success login as Support
    resp_supp = auth_test_client.post("/api/v1/auth/login", json={
        "email": "support@recoverflow.dev",
        "password": "support123"
    })
    assert resp_supp.status_code == 200
    assert resp_supp.json()["user"]["role"] == "support"

    # 3. Invalid password
    resp_bad = auth_test_client.post("/api/v1/auth/login", json={
        "email": "admin@recoverflow.dev",
        "password": "wrong_password"
    })
    assert resp_bad.status_code == 401

    # 4. Inactive user
    resp_inactive = auth_test_client.post("/api/v1/auth/login", json={
        "email": "inactive@recoverflow.dev",
        "password": "inactive123"
    })
    assert resp_inactive.status_code == 400


def test_protected_endpoints_auth_enforcement(auth_test_client):
    # 1. Accessing /api/v1/overview without token -> 401 Unauthorized
    resp_unauth = auth_test_client.get("/api/v1/overview")
    assert resp_unauth.status_code == 401

    # 2. Accessing /api/v1/auth/me without token -> 401 Unauthorized
    resp_me_unauth = auth_test_client.get("/api/v1/auth/me")
    assert resp_me_unauth.status_code == 401

    # 3. Login to get token
    login_resp = auth_test_client.post("/api/v1/auth/login", json={
        "email": "support@recoverflow.dev",
        "password": "support123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Accessing /api/v1/auth/me with token -> 200 OK
    resp_me = auth_test_client.get("/api/v1/auth/me", headers=headers)
    assert resp_me.status_code == 200
    assert resp_me.json()["email"] == "support@recoverflow.dev"

    # 5. Accessing /api/v1/overview with token -> 200 OK
    resp_overview = auth_test_client.get("/api/v1/overview", headers=headers)
    assert resp_overview.status_code == 200


def test_rbac_role_enforcement(auth_test_client):
    # Support token
    supp_login = auth_test_client.post("/api/v1/auth/login", json={
        "email": "support@recoverflow.dev",
        "password": "support123"
    })
    supp_token = supp_login.json()["access_token"]
    supp_headers = {"Authorization": f"Bearer {supp_token}"}

    # Admin token
    admin_login = auth_test_client.post("/api/v1/auth/login", json={
        "email": "admin@recoverflow.dev",
        "password": "admin123"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Support tries to update policy -> 403 Forbidden
    resp_supp_policy = auth_test_client.put(
        "/api/v1/policy",
        json={"yaml_content": "max_payment_link_amount: 5000\n"},
        headers=supp_headers
    )
    assert resp_supp_policy.status_code == 403

    # 2. Admin updates policy -> 200 OK
    resp_admin_policy = auth_test_client.put(
        "/api/v1/policy",
        json={"yaml_content": "max_payment_link_amount: 5000\n"},
        headers=admin_headers
    )
    assert resp_admin_policy.status_code == 200

    # 3. Support tries to create experiment -> 403 Forbidden
    resp_supp_exp = auth_test_client.post(
        "/api/v1/experiments",
        json={"name": "Support Exp", "treatment_percent": 50},
        headers=supp_headers
    )
    assert resp_supp_exp.status_code == 403

    # 4. Admin creates experiment -> 200 OK
    resp_admin_exp = auth_test_client.post(
        "/api/v1/experiments",
        json={"name": "Admin Exp", "treatment_percent": 50},
        headers=admin_headers
    )
    assert resp_admin_exp.status_code == 200
