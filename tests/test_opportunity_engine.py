import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.session import Base
from database.models import Merchant, Customer, RevenueOpportunity, Outcome
from services.normalizer.unified_schema import UnifiedEvent
from services.opportunity_engine.engine import process_unified_event


@pytest.fixture
def db_session():
    """Create an isolated in-memory SQLite database session for unit tests."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_process_failed_payment_creates_opportunity(db_session):
    failed_event = UnifiedEvent(
        event_id="evt_fail_101",
        source="razorpay",
        event_type="payment_failed",
        customer_id="cust_001",
        amount=799.00,
        currency="INR",
        failure_reason="CARD_EXPIRED",
        payment_method="card",
        timestamp=datetime.utcnow(),
        metadata={"merchant_id": "merch_alpha"}
    )

    opp = process_unified_event(failed_event, db_session)

    assert opp is not None
    assert opp.status == "OPEN"
    assert float(opp.amount_at_risk) == 799.00
    assert opp.source_id == "evt_fail_101"
    assert opp.failure_reason == "CARD_EXPIRED"
    assert opp.merchant_id == "merch_alpha"
    assert opp.customer_id == "cust_001"

    # Verify persisted in DB
    db_opp = db_session.query(RevenueOpportunity).filter(RevenueOpportunity.id == opp.id).first()
    assert db_opp is not None
    assert db_opp.status == "OPEN"


def test_process_captured_payment_recovers_opportunity(db_session):
    # Step 1: Create an open opportunity first
    failed_event = UnifiedEvent(
        event_id="evt_fail_202",
        source="razorpay",
        event_type="payment_failed",
        customer_id="cust_002",
        amount=1200.00,
        currency="INR",
        failure_reason="NETWORK_TIMEOUT",
        metadata={"merchant_id": "merch_alpha"}
    )
    initial_opp = process_unified_event(failed_event, db_session)
    assert initial_opp.status == "OPEN"

    # Step 2: Receive successful captured payment for the same customer and amount
    captured_event = UnifiedEvent(
        event_id="evt_cap_202",
        source="razorpay",
        event_type="payment_captured",
        customer_id="cust_002",
        amount=1200.00,
        currency="INR",
        payment_method="upi",
        timestamp=datetime.utcnow(),
        metadata={"merchant_id": "merch_alpha"}
    )
    recovered_opp = process_unified_event(captured_event, db_session)

    assert recovered_opp is not None
    assert recovered_opp.id == initial_opp.id
    assert recovered_opp.status == "RECOVERED"

    # Verify Outcome record created
    outcome = db_session.query(Outcome).filter(Outcome.opportunity_id == initial_opp.id).first()
    assert outcome is not None
    assert outcome.payment_status in ("recovered", "captured")
    assert float(outcome.recovered_amount) == 1200.00
    assert outcome.event_id == "evt_cap_202"
