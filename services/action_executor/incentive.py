import uuid
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention
from services.action_executor.base import ActionAdapter

logger = logging.getLogger(__name__)


class IncentiveAdapter(ActionAdapter):
    """
    Simulates generating a personalized discount or incentive coupon
    for high-value transactions to encourage immediate customer retry.
    """

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        coupon_code = f"DISC_{uuid.uuid4().hex[:6].upper()}"
        logger.info(
            f"[IncentiveAdapter] Generated discount incentive coupon {coupon_code} "
            f"for opportunity {opportunity.id} (Amount: INR {opportunity.amount_at_risk})"
        )

        return {
            "success": True,
            "external_ref": coupon_code,
            "payload": {
                "opportunity_id": opportunity.id,
                "coupon_code": coupon_code,
                "discount_percentage": 10,
                "validity_hours": 24,
                "amount_at_risk": float(opportunity.amount_at_risk or 0.0)
            }
        }
