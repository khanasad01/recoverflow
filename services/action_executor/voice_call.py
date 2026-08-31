import uuid
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention, Customer
from services.action_executor.base import ActionAdapter

logger = logging.getLogger(__name__)


class VoiceCallAdapter(ActionAdapter):
    """
    Simulates placing an automated outbound IVR/AI voice call to the customer
    for high-priority payment recovery nudges.
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

        phone = customer.phone if customer and customer.phone else "+919876543210"
        external_ref = f"voice_call_{uuid.uuid4().hex[:12]}"
        amount = float(opportunity.amount_at_risk or 0.0)

        logger.info(
            f"[VoiceCallAdapter] [SIMULATION] Outbound recovery call placed to {phone} "
            f"for amount ₹{amount:.2f} (Opportunity: {opportunity.id}, Ref: {external_ref})"
        )

        return {
            "success": True,
            "external_ref": external_ref,
            "payload": {
                "opportunity_id": opportunity.id,
                "customer_phone": phone,
                "amount": amount,
                "currency": opportunity.currency or "INR",
                "call_status": "COMPLETED",
                "call_duration_seconds": 45,
                "ivr_interaction": "Customer acknowledged payment recovery reminder"
            }
        }
