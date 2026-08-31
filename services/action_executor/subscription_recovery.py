import uuid
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention
from services.action_executor.base import ActionAdapter

logger = logging.getLogger(__name__)


class SubscriptionRecoveryAdapter(ActionAdapter):
    """
    Simulates triggering an automated subscription billing retry cycle
    or dunning sequence with the merchant payment gateway.
    """

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        sub_ref = f"sub_retry_{uuid.uuid4().hex[:10]}"
        logger.info(
            f"[SubscriptionRecoveryAdapter] Triggered subscription dunning cycle for {opportunity.id} "
            f"with ref {sub_ref}"
        )

        return {
            "success": True,
            "external_ref": sub_ref,
            "payload": {
                "opportunity_id": opportunity.id,
                "subscription_dunning_stage": 1,
                "next_retry_in_days": 2,
                "amount_at_risk": float(opportunity.amount_at_risk or 0.0)
            }
        }
