import pytest
from datetime import datetime
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database.session import Base
from database.models import (
    Merchant,
    Customer,
    RevenueOpportunity,
    Intervention,
    Outcome,
    EvidenceEvent,
    Experiment,
    ExperimentAssignment,
    StrategyPerformance,
)
from services.normalizer.unified_schema import UnifiedEvent
from services.opportunity_engine.engine import process_unified_event
from services.evidence.service import add_evidence
from services.experiment.engine import assign_variant, compute_lift, get_or_create_default_experiment
from services.learning.update import update_strategy_performance
from services.attribution.attribution import calculate_incremental_recovery
from apps.api.main import app, get_db


@pytest.fixture
def memory_db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    yield session
    session.close()


def test_outcome_tracking_and_evidence(memory_db):
    merchant = Merchant(id="merch_out", name="Outcome Merch", email="out@merch.io")
    memory_db.add(merchant)
    memory_db.flush()

    # 1. Simulate failed payment -> creates OPEN opportunity with experiment group
    failed_event = UnifiedEvent(
        event_id="evt_fail_d5",
        source="razorpay",
        event_type="payment_failed",
        customer_id="cust_d5",
        amount=1500.0,
        currency="INR",
        failure_reason="insufficient_funds",
        metadata={"merchant_id": "merch_out"}
    )
    opp = process_unified_event(failed_event, memory_db)
    assert opp is not None
    assert opp.status == "OPEN"
    assert opp.group in ("control", "treatment")

    # 2. Simulate captured payment -> transitions to RECOVERED and creates Outcome
    captured_event = UnifiedEvent(
        event_id="evt_cap_d5",
        source="razorpay",
        event_type="payment_captured",
        customer_id="cust_d5",
        amount=1500.0,
        currency="INR",
        metadata={"merchant_id": "merch_out"}
    )
    recovered_opp = process_unified_event(captured_event, memory_db)
    assert recovered_opp is not None
    assert recovered_opp.id == opp.id
    assert recovered_opp.status == "RECOVERED"

    # Verify Outcome record created
    outcome = memory_db.query(Outcome).filter(Outcome.opportunity_id == opp.id).first()
    assert outcome is not None
    assert outcome.payment_status == "captured"
    assert float(outcome.recovered_amount) == 1500.0

    # Verify EvidenceEvents logged
    evidence_events = memory_db.query(EvidenceEvent).filter(EvidenceEvent.opportunity_id == opp.id).all()
    assert len(evidence_events) >= 2


def test_experiment_engine_and_lift(memory_db):
    exp = get_or_create_default_experiment(memory_db)
    assert exp.id == "default"

    # Create test opportunities
    merchant = Merchant(id="merch_exp", name="Exp Merch", email="exp@merch.io")
    memory_db.add(merchant)
    memory_db.flush()

    opp_ctrl = RevenueOpportunity(
        id="opp_ctrl_1",
        merchant_id="merch_exp",
        source_type="razorpay",
        amount_at_risk=Decimal("1000.00"),
        status="OPEN"
    )
    opp_treat = RevenueOpportunity(
        id="opp_treat_1",
        merchant_id="merch_exp",
        source_type="razorpay",
        amount_at_risk=Decimal("1000.00"),
        status="RECOVERED"
    )
    memory_db.add_all([opp_ctrl, opp_treat])
    memory_db.flush()

    asgn1 = ExperimentAssignment(id="asgn_1", experiment_id="default", opportunity_id="opp_ctrl_1", variant="control")
    asgn2 = ExperimentAssignment(id="asgn_2", experiment_id="default", opportunity_id="opp_treat_1", variant="treatment")
    memory_db.add_all([asgn1, asgn2])
    memory_db.commit()

    lift_data = compute_lift("default", memory_db)
    assert lift_data["control"]["total_opportunities"] == 1
    assert lift_data["control"]["recovery_rate"] == 0.0
    assert lift_data["treatment"]["total_opportunities"] == 1
    assert lift_data["treatment"]["recovery_rate"] == 1.0
    assert lift_data["lift"]["absolute_lift"] == 1.0


def test_learning_loop_strategy_performance(memory_db):
    merchant = Merchant(id="merch_learn", name="Learn Merch", email="learn@merch.io")
    opp = RevenueOpportunity(
        id="opp_learn_1",
        merchant_id="merch_learn",
        source_type="razorpay",
        amount_at_risk=Decimal("750.00"),
        failure_reason="insufficient_funds",
        status="RECOVERED"
    )
    intv = Intervention(
        id="intv_learn_1",
        opportunity_id="opp_learn_1",
        action_type="payment_link",
        status="EXECUTED"
    )
    out = Outcome(
        id="out_learn_1",
        intervention_id="intv_learn_1",
        opportunity_id="opp_learn_1",
        payment_status="captured",
        recovered_amount=Decimal("750.00")
    )
    memory_db.add_all([merchant, opp, intv, out])
    memory_db.commit()

    records = update_strategy_performance(memory_db)
    assert len(records) >= 1
    rec = [r for r in records if r.action_type == "payment_link"][0]
    assert rec.total_attempts >= 1
    assert rec.success_count >= 1
    assert float(rec.avg_lift) == 1.0


def test_attribution_incremental_recovery(memory_db):
    merchant = Merchant(id="merch_attr", name="Attr Merch", email="attr@merch.io")
    memory_db.add(merchant)
    memory_db.flush()

    # Control: 1 opp of 1000, 0 recovered -> baseline = 0%
    opp_c = RevenueOpportunity(id="opp_c", merchant_id="merch_attr", source_type="razorpay", amount_at_risk=Decimal("1000.00"), status="OPEN")
    # Treatment: 1 opp of 2000, 2000 recovered -> gross = 2000, baseline expected = 0, incremental = 2000
    opp_t = RevenueOpportunity(id="opp_t", merchant_id="merch_attr", source_type="razorpay", amount_at_risk=Decimal("2000.00"), status="RECOVERED")
    memory_db.add_all([opp_c, opp_t])
    memory_db.flush()

    asgn_c = ExperimentAssignment(id="as_c", experiment_id="default", opportunity_id="opp_c", variant="control")
    asgn_t = ExperimentAssignment(id="as_t", experiment_id="default", opportunity_id="opp_t", variant="treatment")
    memory_db.add_all([asgn_c, asgn_t])
    memory_db.commit()

    attr = calculate_incremental_recovery("default", memory_db)
    assert attr["attribution"]["gross_recovery"] == 2000.0
    assert attr["attribution"]["baseline_expected_recovery"] == 0.0
    assert attr["attribution"]["incremental_recovery"] == 2000.0


def test_day5_api_endpoints():
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
    merchant = Merchant(id="merch_api5", name="API5 Merch", email="api5@merch.io")
    db.add(merchant)
    db.flush()

    opp = RevenueOpportunity(
        id="opp_api5_1",
        merchant_id=merchant.id,
        source_type="razorpay",
        amount_at_risk=Decimal("1200.00"),
        status="RECOVERED"
    )
    db.add(opp)
    db.flush()

    # Evidence
    ev = EvidenceEvent(
        id="ev_api5_1",
        opportunity_id="opp_api5_1",
        event_type="TEST_EVIDENCE",
        actor="unit_tester",
        reason="Testing evidence api",
        created_at=datetime.utcnow()
    )
    # Outcome
    out = Outcome(
        id="out_api5_1",
        opportunity_id="opp_api5_1",
        payment_status="captured",
        recovered_amount=Decimal("1200.00")
    )
    # Experiment
    exp = Experiment(id="exp_api5", name="API5 Exp", treatment_percent=50, metric="recovery_rate", status="ACTIVE")
    asgn = ExperimentAssignment(id="asgn_api5", experiment_id="exp_api5", opportunity_id="opp_api5_1", variant="treatment")

    # Strategy
    strat = StrategyPerformance(
        id="strat_api5",
        action_type="payment_link",
        failure_type="insufficient_funds",
        total_attempts=5,
        success_count=4,
        avg_lift=Decimal("0.8000")
    )

    db.add_all([ev, out, exp, asgn, strat])
    db.commit()
    db.close()

    client = TestClient(app)

    # 1. Outcomes API
    r_out = client.get("/api/v1/outcomes?opportunity_id=opp_api5_1")
    assert r_out.status_code == 200
    assert len(r_out.json()) == 1

    # 2. Evidence API
    r_ev = client.get("/api/v1/opportunities/opp_api5_1/evidence")
    assert r_ev.status_code == 200
    assert len(r_ev.json()) == 1
    assert r_ev.json()[0]["event_type"] == "TEST_EVIDENCE"

    # 3. Experiments API
    r_exp = client.get("/api/v1/experiments")
    assert r_exp.status_code == 200

    r_create_exp = client.post("/api/v1/experiments", json={"name": "New Pilot Exp", "treatment_percent": 60})
    assert r_create_exp.status_code == 200
    assert r_create_exp.json()["treatment_percent"] == 60

    # 4. Lift API
    r_lift = client.get("/api/v1/experiments/exp_api5/lift")
    assert r_lift.status_code == 200
    assert "lift" in r_lift.json()

    # 5. Incremental Analytics API
    r_inc = client.get("/api/v1/analytics/incremental?experiment_id=exp_api5")
    assert r_inc.status_code == 200
    assert "attribution" in r_inc.json()

    # 6. Strategy Performance API
    r_perf = client.get("/api/v1/learning/performance")
    assert r_perf.status_code == 200
    assert len(r_perf.json()) >= 1

    app.dependency_overrides.clear()
