import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention
from services.action_executor.base import ActionAdapter

logger = logging.getLogger(__name__)


class HumanEscalationAdapter(ActionAdapter):
    """Adapter to flag opportunities for human specialist escalation and review."""

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        try:
            logger.info(
                f"Escalating Opportunity {opportunity.id} (Amount: {opportunity.amount_at_risk}) "
                f"for human intervention. Reason: {intervention.decision_reason}"
            )

            return {
                "success": True,
                "external_ref": None,
                "payload": {
                    "escalated": True,
                    "opportunity_id": opportunity.id,
                    "amount_at_risk": float(opportunity.amount_at_risk),
                    "priority": "HIGH" if float(opportunity.amount_at_risk) > 5000 else "MEDIUM",
                    "reason": intervention.decision_reason or "Escalated for human review"
                }
            }
        except Exception as e:
            logger.error(f"Error in HumanEscalationAdapter: {e}")
            return {
                "success": False,
                "external_ref": None,
                "payload": {"error": str(e)}
            }
