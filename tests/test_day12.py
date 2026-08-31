import os
import pytest
from datetime import datetime, date as dt_date
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import User, RevenueOpportunity, Intervention, Outcome, StrategyPerformance, ResourceLimit, Customer, Merchant, OpportunityScore
from apps.api.main import app
from apps.api.deps import get_db, require_roles
from services.resource_manager import check_limit, increment_usage, reset_daily_counters, get_all_usage, get_or_create_daily_limit
from services.learning.update import update_strategy_performance
from agents.orchestrator.graph import run_recovery_graph, select_action_node, RecoveryState


@pytest.fixture
def day12_db():
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
def day12_client(day12_db):
    def override_get_db():
        try:
            yield day12_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_resource_manager_check_limit_and_increment(day12_db):
    # 1. Initial check - quota should be available
    assert check_limit("payment_link", day12_db) is True

    # 2. Increment usage
    new_count = increment_usage("payment_link", day12_db)
    assert new_count == 1

    # 3. Simulate hitting the daily limit
    limit_rec = get_or_create_daily_limit("payment_link", day12_db)
    limit_rec.current_count = limit_rec.max_daily
    day12_db.commit()

    assert check_limit("payment_link", day12_db) is False


def test_resource_manager_reset_daily_counters(day12_db):
    rec = get_or_create_daily_limit("smart_retry", day12_db)
    rec.current_count = 50
    day12_db.commit()

    reset_count = reset_daily_counters(day12_db)
    assert reset_count >= 1

    refreshed = get_or_create_daily_limit("smart_retry", day12_db)
    assert refreshed.current_count == 0


def test_resource_manager_get_all_usage(day12_db):
    usage_list = get_all_usage(day12_db)
    assert len(usage_list) >= 5
    actions = [u["action_type"] for u in usage_list]
    assert "payment_link" in actions
    assert "smart_retry" in actions
    assert "email_reminder" in actions
    for u in usage_list:
        assert "remaining" in u
        assert "usage_percent" in u


def test_learning_loop_success_rate_computation(day12_db):
    merch = Merchant(id="merch_lrn", name="Learn Merch", email="learn@merch.io")
    cust = Customer(id="cust_lrn", merchant_id="merch_lrn")
    opp1 = RevenueOpportunity(
        id="opp_lrn_1",
        merchant_id="merch_lrn",
        customer_id="cust_lrn",
        source_type="razorpay",
        amount_at_risk=Decimal("500.00"),
        failure_reason="card_declined",
        status="RECOVERED"
    )
    opp2 = RevenueOpportunity(
        id="opp_lrn_2",
        merchant_id="merch_lrn",
        customer_id="cust_lrn",
        source_type="razorpay",
        amount_at_risk=Decimal("600.00"),
        failure_reason="card_declined",
        status="OPEN"
    )
    intv1 = Intervention(id="intv_lrn_1", opportunity_id="opp_lrn_1", action_type="payment_link", status="EXECUTED")
    intv2 = Intervention(id="intv_lrn_2", opportunity_id="opp_lrn_2", action_type="payment_link", status="EXECUTED")
    out1 = Outcome(id="out_lrn_1", opportunity_id="opp_lrn_1", intervention_id="intv_lrn_1", payment_status="captured", recovered_amount=Decimal("500.00"))

    day12_db.add_all([merch, cust, opp1, opp2, intv1, intv2, out1])
    day12_db.commit()

    updated = update_strategy_performance(day12_db)
    assert len(updated) >= 1

    perf = day12_db.query(StrategyPerformance).filter(
        StrategyPerformance.action_type == "payment_link",
        StrategyPerformance.failure_type == "card_declined"
    ).first()

    assert perf is not None
    assert perf.total_attempts == 2
    assert perf.success_count == 1
    assert float(perf.success_rate) == 0.5


def test_langgraph_action_selection_with_resource_limit_fallback(day12_db):
    merch = Merchant(id="merch_fb", name="Fallback Merch", email="fallback@merch.io")
    cust = Customer(id="cust_fb", merchant_id="merch_fb")
    day12_db.add_all([merch, cust])
    day12_db.commit()

    # Exhaust quota for payment_link
    pl_limit = get_or_create_daily_limit("payment_link", day12_db)
    pl_limit.current_count = pl_limit.max_daily
    day12_db.commit()

    # State where score >= 0.70 would normally select payment_link
    state: RecoveryState = {
        "opportunity_data": {
            "amount_at_risk": 2000.0,
            "failure_reason": "insufficient_funds",
            "retry_count": 0,
            "source_type": "razorpay"
        },
        "score": 0.85,
        "db": day12_db,
        "evidence_events": []
    }

    res = select_action_node(state)
    # payment_link is exhausted -> should automatically fall back to email_reminder
    assert res["selected_action"] == "email_reminder"


def test_langgraph_execution_increments_resource_usage(day12_db):
    merch = Merchant(id="merch_exe", name="Exe Merch", email="exe@merch.io")
    cust = Customer(id="cust_exe", merchant_id="merch_exe")
    opp = RevenueOpportunity(
        id="opp_exe_10",
        merchant_id="merch_exe",
        customer_id="cust_exe",
        source_type="razorpay",
        amount_at_risk=Decimal("1500.00"),
        failure_reason="insufficient_funds",
        status="OPEN"
    )
    score_obj = OpportunityScore(
        id="sc_exe_10",
        opportunity_id=opp.id,
        recoverability_score=Decimal("0.80"),
        expected_recovery=Decimal("1200.00")
    )
    day12_db.add_all([merch, cust, opp, score_obj])
    day12_db.commit()

    limit_before = get_or_create_daily_limit("payment_link", day12_db).current_count

    # Execute recovery graph
    result = run_recovery_graph(opp.id, day12_db)
    assert result["selected_action"] == "payment_link"
    assert result["execution_status"] == "EXECUTED"

    limit_after = get_or_create_daily_limit("payment_link", day12_db).current_count
    assert limit_after == limit_before + 1


def test_resource_usage_api_endpoint(day12_client, day12_db):
    resp = day12_client.get("/api/v1/analytics/resource-usage")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    first = data[0]
    assert "action_type" in first
    assert "max_daily" in first
    assert "current_count" in first
    assert "remaining" in first
    assert "usage_percent" in first
