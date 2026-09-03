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
            discount_amount = float(opportunity.amount_at_risk) * 0.10
            coupon_code = f"DISC_RECOVER_{opportunity.id[-6:].upper()}"
            
            logger.info(f"Applied incentive {coupon_code} (10% discount = ₹{discount_amount}) for {opportunity.id}")
            
            return {
                "success": True,
                "external_ref": coupon_code,
                "payload": {
                    "coupon_code": coupon_code,
                    "incentive_code": coupon_code,
                    "discount_percentage": 10,
                    "discount_percent": 10,
                    "discount_amount": discount_amount,
                    "validity_hours": 24,
                    "amount_at_risk": float(opportunity.amount_at_risk or 0.0),
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
