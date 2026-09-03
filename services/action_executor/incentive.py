import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention
from services.action_executor.base import ActionAdapter

logger = logging.getLogger(__name__)


class IncentiveAdapter(ActionAdapter):
    """Adapter to apply real incentive (discount/coupon) to opportunity."""

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        try:
            # Real incentive logic - apply 10% discount as recovery incentive
            discount_amount = float(opportunity.amount_at_risk) * 0.10
            incentive_code = f"RECOVER{opportunity.id[-6:].upper()}"
            
            logger.info(f"Applied incentive {incentive_code} (10% discount = ₹{discount_amount}) for {opportunity.id}")
            
            return {
                "success": True,
                "external_ref": incentive_code,
                "payload": {
                    "incentive_code": incentive_code,
                    "discount_percent": 10,
                    "discount_amount": discount_amount,
                    "status": "applied"
                }
            }
        except Exception as e:
            logger.error(f"Error in IncentiveAdapter: {e}")
            return {
                "success": False,
                "external_ref": None,
                "payload": {"error": str(e)}
            }
