import os
import pytest
from datetime import datetime
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import User, RevenueOpportunity, Intervention, Customer, OpportunityScore, EvidenceEvent
from apps.api.main import app
from apps.api.deps import get_db, get_current_user, get_current_active_user, require_roles
from apps.api.security import get_password_hash
from services.action_executor.smart_retry import SmartRetryAdapter
from services.action_executor.incentive import IncentiveAdapter
from services.action_executor.subscription_recovery import SubscriptionRecoveryAdapter
from services.action_executor.executor import ActionExecutor
from services.policy.engine import PolicyEngine
from agents.orchestrator.graph import run_recovery_graph, select_action_node, check_policy_node, RecoveryState


@pytest.fixture
def day10_db():
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
def day10_client():
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
    # Seed high-value opportunity in HUMAN_REVIEW
    opp_review = RevenueOpportunity(
        id="opp_review_100",
        merchant_id="merch_d10",
        customer_id="cust_d10",
        source_type="razorpay",
        amount_at_risk=Decimal("75000.00"),
        status="HUMAN_REVIEW",
        failure_reason="CARD_DECLINED"
    )
    db.add(opp_review)
    db.commit()
    db.close()

    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_smart_retry_adapter(day10_db):
    opp = RevenueOpportunity(
        id="opp_retry_test",
        merchant_id="merch_1",
        source_type="razorpay",
        amount_at_risk=Decimal("1200.00"),
        failure_reason="bank_error",
        status="OPEN"
    )
    inv = Intervention(id="inv_retry", opportunity_id=opp.id, action_type="smart_retry")
    day10_db.add_all([opp, inv])
    day10_db.commit()

    adapter = SmartRetryAdapter()
    result = adapter.execute(opp, inv, day10_db)
    assert result["success"] is True
    assert result["external_ref"].startswith("retry_")
    assert result["payload"]["strategy"] == "exponential_backoff_with_jitter"


def test_incentive_adapter(day10_db):
    opp = RevenueOpportunity(
        id="opp_inc_test",
        merchant_id="merch_1",
        source_type="razorpay",
        amount_at_risk=Decimal("3500.00"),
        failure_reason="card_declined",
        status="OPEN"
    )
    inv = Intervention(id="inv_inc", opportunity_id=opp.id, action_type="incentive")
    day10_db.add_all([opp, inv])
    day10_db.commit()

    adapter = IncentiveAdapter()
    result = adapter.execute(opp, inv, day10_db)
    assert result["success"] is True
    assert result["external_ref"].startswith("DISC_")
    assert result["payload"]["discount_percentage"] == 10


def test_subscription_recovery_adapter(day10_db):
    opp = RevenueOpportunity(
        id="opp_sub_test",
        merchant_id="merch_1",
        source_type="subscription",
        amount_at_risk=Decimal("999.00"),
        failure_reason="card_declined",
        status="OPEN"
    )
    inv = Intervention(id="inv_sub", opportunity_id=opp.id, action_type="subscription_recovery")
    day10_db.add_all([opp, inv])
    day10_db.commit()

    adapter = SubscriptionRecoveryAdapter()
    result = adapter.execute(opp, inv, day10_db)
    assert result["success"] is True
    assert result["external_ref"].startswith("sub_retry_")
    assert result["payload"]["subscription_dunning_stage"] == 1


def test_action_executor_with_day10_actions(day10_db):
    executor = ActionExecutor()
    opp = RevenueOpportunity(
        id="opp_exec_10",
        merchant_id="merch_1",
        source_type="razorpay",
        amount_at_risk=Decimal("2000.00"),
        status="OPEN"
    )
    day10_db.add(opp)
    day10_db.commit()

    # 1. Smart retry
    inv1 = executor.execute(opp, "smart_retry", decision_reason="Network error", db=day10_db)
    assert inv1.status == "EXECUTED"
    assert inv1.action_type == "smart_retry"
    assert inv1.external_ref.startswith("retry_")

    # 2. Incentive
    inv2 = executor.execute(opp, "incentive", decision_reason="Discount coupon", db=day10_db)
    assert inv2.status == "EXECUTED"
    assert inv2.action_type == "incentive"
    assert inv2.external_ref.startswith("DISC_")


def test_policy_engine_human_approval_threshold():
    engine = PolicyEngine()
    assert engine.needs_human_approval(Decimal("60000.00")) is True
    assert engine.needs_human_approval(Decimal("50000.00")) is False
    assert engine.needs_human_approval(Decimal("1500.00")) is False
    assert engine.needs_human_approval(None) is False


def test_langgraph_action_selection_matrix(day10_db):
    # 1. Transient error -> smart_retry
    state_retry: RecoveryState = {
        "opportunity_data": {
            "amount_at_risk": 1500.0,
            "failure_reason": "bank_error",
            "retry_count": 0,
            "source_type": "razorpay"
        },
        "score": 0.6,
        "evidence_events": []
    }
    res_retry = select_action_node(state_retry)
    assert res_retry["selected_action"] == "smart_retry"

    # 2. High value decline -> incentive
    state_inc: RecoveryState = {
        "opportunity_data": {
            "amount_at_risk": 4500.0,
            "failure_reason": "card_declined",
            "retry_count": 0,
            "source_type": "razorpay"
        },
        "score": 0.6,
        "evidence_events": []
    }
    res_inc = select_action_node(state_inc)
    assert res_inc["selected_action"] == "incentive"

    # 3. Subscription source -> subscription_recovery
    state_sub: RecoveryState = {
        "opportunity_data": {
            "amount_at_risk": 999.0,
            "failure_reason": "card_declined",
            "retry_count": 0,
            "source_type": "subscription"
        },
        "score": 0.6,
        "evidence_events": []
    }
    res_sub = select_action_node(state_sub)
    assert res_sub["selected_action"] == "subscription_recovery"


def test_langgraph_human_review_routing(day10_db):
    cust = Customer(id="cust_high_val", merchant_id="merch_1")
    opp_high = RevenueOpportunity(
        id="opp_high_value_999",
        merchant_id="merch_1",
        customer_id="cust_high_val",
        source_type="razorpay",
        amount_at_risk=Decimal("80000.00"),
        status="OPEN",
        failure_reason="CARD_DECLINED"
    )
    score_rec = OpportunityScore(
        id="sc_high",
        opportunity_id=opp_high.id,
        recoverability_score=Decimal("0.85"),
        expected_recovery=Decimal("68000.00")
    )
    day10_db.add_all([cust, opp_high, score_rec])
    day10_db.commit()

    # Run LangGraph recovery orchestration
    res = run_recovery_graph(opp_high.id, day10_db)
    assert res.get("human_review") is True
    assert res.get("execution_status") == "PENDING_APPROVAL"

    # Verify opportunity updated to HUMAN_REVIEW in DB
    refreshed_opp = day10_db.query(RevenueOpportunity).filter_by(id=opp_high.id).first()
    assert refreshed_opp.status == "HUMAN_REVIEW"


def test_approve_and_reject_endpoints(day10_client):
    # 1. Test Approve
    resp_approve = day10_client.post("/api/v1/opportunities/opp_review_100/approve")
    assert resp_approve.status_code == 200
    data_app = resp_approve.json()
    assert data_app["id"] == "opp_review_100"
    assert data_app["status"] in ("APPROVED", "ACTIONED")

    # 2. Test Reject on another opportunity
    # Create a new opportunity in HUMAN_REVIEW
    resp_reject = day10_client.post("/api/v1/opportunities/opp_review_100/reject")
    assert resp_reject.status_code == 200
    assert resp_reject.json()["status"] == "REJECTED"

    # 3. Test Non-existent opportunity
    resp_404 = day10_client.post("/api/v1/opportunities/opp_not_found_999/approve")
    assert resp_404.status_code == 404
