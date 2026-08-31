import uuid
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention, Customer
from services.action_executor.base import ActionAdapter

logger = logging.getLogger(__name__)


class PaymentMethodRecoveryAdapter(ActionAdapter):
    """
    Suggests alternative payment instruments (e.g. UPI, alternate debit/credit card, NetBanking)
    when a primary payment method fails due to card decline, expired card, or invalid payment instrument.
    """

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        customer = None
        if opportunity.customer_id:
            customer = db.query(Customer).filter(Customer.id == opportunity.customer_id).first()

        external_ref = f"pm_recovery_{uuid.uuid4().hex[:12]}"
        suggested_methods = ["UPI", "Credit/Debit Card", "NetBanking", "Wallet"]

        logger.info(
            f"[PaymentMethodRecoveryAdapter] Dispatched alternate payment method recommendation "
            f"for opportunity {opportunity.id} (Customer: {customer.email if customer else 'unknown'}, Ref: {external_ref})"
        )

        return {
            "success": True,
            "external_ref": external_ref,
            "payload": {
                "opportunity_id": opportunity.id,
                "amount": float(opportunity.amount_at_risk or 0.0),
                "currency": opportunity.currency or "INR",
                "failure_reason": opportunity.failure_reason,
                "suggested_payment_methods": suggested_methods,
                "customer_email": customer.email if customer else None,
                "customer_phone": customer.phone if customer else None,
                "status": "DISPATCHED"
            }
        }
