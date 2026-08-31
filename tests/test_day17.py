import pytest
from decimal import Decimal
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import (
    RevenueOpportunity,
    Intervention,
    Customer,
    Merchant,
    StrategyPerformance,
    StrategyWeight,
    Outcome,
)
from services.action_executor.payment_method_recovery import PaymentMethodRecoveryAdapter
from services.action_executor.stop import StopAdapter
from services.action_executor.voice_call import VoiceCallAdapter
from services.action_executor.executor import ActionExecutor
from services.policy.engine import PolicyEngine
from services.learning.update import update_strategy_performance, auto_update_policy_weights
from services.resource_manager import check_limit, increment_usage, get_all_usage
from agents.orchestrator.graph import run_recovery_graph


@pytest.fixture
def day17_db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()

    merch = Merchant(
        id="merch_day17",
        name="RecoverFlow Day17 Merchant",
        email="merchant.d17@recoverflow.dev"
    )
    db.add(merch)

    cust = Customer(
        id="cust_d17_1",
        merchant_id="merch_day17",
        external_id="ext_cust_d17",
        email="vikram.sharma@example.com",
        phone="+919876543210"
    )
    db.add(cust)

    opp = RevenueOpportunity(
        id="opp_d17_expired",
        merchant_id="merch_day17",
        customer_id="cust_d17_1",
        amount_at_risk=Decimal("3500.00"),
        currency="INR",
        failure_reason="expired_card",
        status="OPEN",
        retry_count=0,
        source_type="card"
    )
    db.add(opp)
    db.commit()

    yield db
    db.close()


def test_payment_method_recovery_adapter(day17_db):
    adapter = PaymentMethodRecoveryAdapter()
    opp = day17_db.query(RevenueOpportunity).filter_by(id="opp_d17_expired").first()
    intv = Intervention(id="intv_d17_pm", opportunity_id=opp.id, action_type="payment_method_recovery")
    
    result = adapter.execute(opp, intv, day17_db)
    assert result["success"] is True
    assert result["external_ref"].startswith("pm_recovery_")
    assert "UPI" in result["payload"]["suggested_payment_methods"]


def test_stop_adapter_marks_opportunity_stopped(day17_db):
    adapter = StopAdapter()
    opp = day17_db.query(RevenueOpportunity).filter_by(id="opp_d17_expired").first()
    intv = Intervention(id="intv_d17_stop", opportunity_id=opp.id, action_type="stop")

    result = adapter.execute(opp, intv, day17_db)
    assert result["success"] is True
    assert result["external_ref"].startswith("stop_")
    assert opp.status == "STOPPED"


def test_voice_call_adapter(day17_db):
    adapter = VoiceCallAdapter()
    opp = day17_db.query(RevenueOpportunity).filter_by(id="opp_d17_expired").first()
    intv = Intervention(id="intv_d17_vc", opportunity_id=opp.id, action_type="voice_call")

    result = adapter.execute(opp, intv, day17_db)
    assert result["success"] is True
    assert result["external_ref"].startswith("voice_call_")
    assert result["payload"]["call_status"] == "COMPLETED"


def test_action_executor_with_new_adapters(day17_db):
    executor = ActionExecutor()
    opp = day17_db.query(RevenueOpportunity).filter_by(id="opp_d17_expired").first()

    intv_pm = executor.execute(opp, "payment_method_recovery", "Test PM recovery", 0.85, db=day17_db)
    assert intv_pm.status == "EXECUTED"
    assert intv_pm.external_ref.startswith("pm_recovery_")

    intv_vc = executor.execute(opp, "voice_call", "Test Voice Call", 0.90, db=day17_db)
    assert intv_vc.status == "EXECUTED"
    assert intv_vc.external_ref.startswith("voice_call_")


def test_policy_engine_evaluates_day17_actions(day17_db):
    engine = PolicyEngine()
    opp = day17_db.query(RevenueOpportunity).filter_by(id="opp_d17_expired").first()

    # PM recovery allowed for expired_card under 20,000
    res1 = engine.evaluate(opp, "payment_method_recovery")
    assert res1["allowed"] is True

    # Stop is always allowed
    res2 = engine.evaluate(opp, "stop")
    assert res2["allowed"] is True

    # Voice call allowed under 5,000 for allowed failure reason
    opp.failure_reason = "insufficient_funds"
    opp.amount_at_risk = Decimal("3500.00")
    res3 = engine.evaluate(opp, "voice_call")
    assert res3["allowed"] is True

    # Voice call denied if over 5,000
    opp.amount_at_risk = Decimal("6000.00")
    res4 = engine.evaluate(opp, "voice_call")
    assert res4["allowed"] is False



def test_auto_update_policy_weights(day17_db):
    # Insert strategy performance row
    sp = StrategyPerformance(
        id="sp_test_1",
        action_type="payment_method_recovery",
        failure_type="expired_card",
        total_attempts=10,
        success_count=8,
        success_rate=Decimal("0.8000"),
        avg_lift=Decimal("0.8000")
    )
    day17_db.add(sp)
    day17_db.commit()

    # Auto update policy weights
    weights = auto_update_policy_weights(day17_db)
    assert len(weights) >= 1
    
    saved_weight = day17_db.query(StrategyWeight).filter_by(action_type="payment_method_recovery").first()
    assert saved_weight is not None
    assert float(saved_weight.weight) > 0.6


def test_langgraph_selects_payment_method_recovery_for_expired_card(day17_db):
    res = run_recovery_graph("opp_d17_expired", db=day17_db)
    assert res.get("selected_action") == "payment_method_recovery"
    assert res.get("policy_allowed") is True
    assert res.get("execution_status") == "EXECUTED"


def test_resource_manager_tracks_voice_call_limits(day17_db):
    # Voice call limit is 10
    allowed = check_limit("voice_call", day17_db)
    assert allowed is True

    # Exhaust limit
    for _ in range(10):
        increment_usage("voice_call", day17_db)

    # 11th should be denied
    assert check_limit("voice_call", day17_db) is False
