import uuid
import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Merchant, Customer, Outcome
from services.normalizer.unified_schema import UnifiedEvent
from services.experiment.engine import assign_variant
from services.evidence.service import add_evidence

logger = logging.getLogger(__name__)


def get_or_create_default_merchant(db_session: Session, merchant_id: Optional[str] = None) -> Merchant:
    """Ensure a merchant exists to satisfy foreign key constraints."""
    target_id = merchant_id or "merchant_default"
    merchant = db_session.query(Merchant).filter(Merchant.id == target_id).first()
    if not merchant:
        # Check if any merchant exists
        first_merchant = db_session.query(Merchant).first()
        if first_merchant and not merchant_id:
            return first_merchant
        
        merchant = Merchant(
            id=target_id,
            name="Default Merchant",
            email=f"{target_id}@recoverflow.io"
        )
        db_session.add(merchant)
        db_session.flush()
    return merchant


def get_or_create_customer(db_session: Session, customer_id: str, merchant_id: str) -> Customer:
    """Ensure customer exists in the database."""
    customer = db_session.query(Customer).filter(
        (Customer.id == customer_id) | (Customer.external_id == customer_id)
    ).first()
    if not customer:
        customer = Customer(
            id=customer_id,
            merchant_id=merchant_id,
            external_id=customer_id
        )
        db_session.add(customer)
        db_session.flush()
    return customer


def process_unified_event(unified_event: UnifiedEvent, db_session: Session) -> Optional[RevenueOpportunity]:
    """
    Processes a unified event to create or update a RevenueOpportunity.
    - If event_type is payment_failed: Creates a new RevenueOpportunity with status='OPEN' and assigns an experiment group.
    - If event_type is payment_captured or payment_link_paid: Marks matching open/actioned opportunity as 'RECOVERED'.
    """
    event_type = unified_event.event_type.lower()
    
    # 1. Handle Failed Payment / Invoice / Checkout Abandonment -> Create OPEN Opportunity
    if event_type in (
        "payment_failed", "payment.failed",
        "invoice_failed", "invoice.payment_failed",
        "checkout_abandoned", "checkout.session.abandoned",
        "subscription_halted", "subscription.halted"
    ):
        merchant_id = unified_event.metadata.get("merchant_id")
        merchant = get_or_create_default_merchant(db_session, merchant_id)
        
        assigned_customer_id = None
        if unified_event.customer_id:
            customer = get_or_create_customer(db_session, unified_event.customer_id, merchant.id)
            assigned_customer_id = customer.id

        # Check for related existing opportunity (e.g. invoice failure for same customer and amount)
        related_opp_id = None
        if assigned_customer_id:
            existing_opp = db_session.query(RevenueOpportunity).filter(
                RevenueOpportunity.customer_id == assigned_customer_id,
                RevenueOpportunity.amount_at_risk == Decimal(str(round(unified_event.amount, 2))),
                RevenueOpportunity.status.in_(["OPEN", "ACTIONED", "HUMAN_REVIEW", "PENDING_APPROVAL"])
            ).order_by(RevenueOpportunity.created_at.desc()).first()
            if existing_opp:
                related_opp_id = existing_opp.id
                logger.info(f"Linking new opportunity to existing related opportunity: {related_opp_id}")
            
        opp_id = f"opp_{uuid.uuid4().hex[:12]}"
        opportunity = RevenueOpportunity(
            id=opp_id,
            merchant_id=merchant.id,
            customer_id=assigned_customer_id,
            source_type=unified_event.source,
            source_id=unified_event.event_id,
            amount_at_risk=Decimal(str(round(unified_event.amount, 2))),
            currency=unified_event.currency,
            failure_reason=unified_event.failure_reason,
            status="OPEN",
            retry_count=0,
            related_opportunity_id=related_opp_id,
            created_at=unified_event.timestamp or datetime.utcnow(),
            updated_at=unified_event.timestamp or datetime.utcnow()
        )
        
        db_session.add(opportunity)
        db_session.flush()

        # Assign A/B experiment variant
        assign_variant(opportunity.id, db_session)

        # Log evidence
        add_evidence(
            opportunity_id=opportunity.id,
            event_type="OPPORTUNITY_CREATED",
            actor="opportunity_engine",
            reason=f"Failed payment/invoice event {unified_event.event_id} ({unified_event.source}): {unified_event.failure_reason}",
            after_state={"status": "OPEN", "amount_at_risk": float(opportunity.amount_at_risk), "group": opportunity.group, "related_opportunity_id": related_opp_id},
            payload={**unified_event.metadata, "related_opportunity_id": related_opp_id},
            db=db_session
        )
        
        db_session.commit()
        db_session.refresh(opportunity)
        logger.info(f"Created RevenueOpportunity: {opportunity.id} (source: {opportunity.source_type}, related: {opportunity.related_opportunity_id})")
        return opportunity


    # 2. Handle Successful Payment -> Mark as RECOVERED
    elif event_type in ("payment_captured", "payment.captured", "payment_link_paid", "payment_link.paid"):
        query = db_session.query(RevenueOpportunity).filter(
            RevenueOpportunity.status.in_(["OPEN", "ACTIONED", "WAITING_OUTCOME"])
        )
        
        # Match by customer if available
        matched_opp = None
        if unified_event.customer_id:
            customer = db_session.query(Customer).filter(
                (Customer.id == unified_event.customer_id) | (Customer.external_id == unified_event.customer_id)
            ).first()
            if customer:
                matched_opp = query.filter(
                    RevenueOpportunity.customer_id == customer.id,
                    RevenueOpportunity.amount_at_risk == Decimal(str(round(unified_event.amount, 2)))
                ).order_by(RevenueOpportunity.created_at.desc()).first()
        
        # Fallback: match by source_id or amount_at_risk
        if not matched_opp:
            matched_opp = query.filter(
                (RevenueOpportunity.source_id == unified_event.event_id) |
                (RevenueOpportunity.amount_at_risk == Decimal(str(round(unified_event.amount, 2))))
            ).order_by(RevenueOpportunity.created_at.desc()).first()

        if matched_opp:
            before_status = matched_opp.status
            matched_opp.status = "RECOVERED"
            matched_opp.updated_at = datetime.utcnow()

            # Record outcome
            outcome = Outcome(
                id=f"out_{uuid.uuid4().hex[:12]}",
                opportunity_id=matched_opp.id,
                payment_status="captured",
                recovered_amount=Decimal(str(round(unified_event.amount, 2))),
                event_id=unified_event.event_id,
                observed_at=datetime.utcnow()
            )
            db_session.add(outcome)

            # Record evidence
            add_evidence(
                opportunity_id=matched_opp.id,
                event_type="OPPORTUNITY_RECOVERED",
                actor="opportunity_engine",
                reason=f"Payment captured via event {unified_event.event_id}",
                before_state={"status": before_status},
                after_state={"status": "RECOVERED"},
                payload={"recovered_amount": float(unified_event.amount), "event_id": unified_event.event_id},
                db=db_session
            )
            
            db_session.commit()
            db_session.refresh(matched_opp)
            logger.info(f"Updated RevenueOpportunity to RECOVERED: {matched_opp.id}")
            return matched_opp
        else:
            logger.info(f"No matching open/actioned RevenueOpportunity found for {unified_event.event_id}; creating resolved opportunity")
            merchant_id = unified_event.metadata.get("merchant_id")
            merchant = get_or_create_default_merchant(db_session, merchant_id)

            assigned_customer_id = None
            if unified_event.customer_id:
                customer = get_or_create_customer(db_session, unified_event.customer_id, merchant.id)
                assigned_customer_id = customer.id

            new_opp = RevenueOpportunity(
                id=f"opp_{uuid.uuid4().hex[:12]}",
                merchant_id=merchant.id,
                customer_id=assigned_customer_id,
                source_type=unified_event.source,
                source_id=unified_event.event_id,
                amount_at_risk=Decimal(str(round(unified_event.amount, 2))),
                currency=unified_event.currency,
                failure_reason=None,
                status="RECOVERED",
                retry_count=0,
                created_at=unified_event.timestamp or datetime.utcnow(),
                updated_at=unified_event.timestamp or datetime.utcnow()
            )
            db_session.add(new_opp)
            db_session.flush()

            assign_variant(new_opp.id, db_session)

            outcome = Outcome(
                id=f"out_{uuid.uuid4().hex[:12]}",
                opportunity_id=new_opp.id,
                payment_status="captured",
                recovered_amount=Decimal(str(round(unified_event.amount, 2))),
                event_id=unified_event.event_id,
                observed_at=datetime.utcnow()
            )
            db_session.add(outcome)

            add_evidence(
                opportunity_id=new_opp.id,
                event_type="OPPORTUNITY_RECOVERED",
                actor="opportunity_engine",
                reason=f"Standalone recovered event {unified_event.event_id}",
                after_state={"status": "RECOVERED"},
                payload={"recovered_amount": float(unified_event.amount)},
                db=db_session
            )

            db_session.commit()
            db_session.refresh(new_opp)
            return new_opp

    else:
        logger.info(f"Event type {event_type} ignored by OpportunityEngine")
        return None
