import uuid
import logging
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention
from services.action_executor.base import ActionAdapter

logger = logging.getLogger(__name__)


class StopAdapter(ActionAdapter):
    """
    Explicitly halts recovery interventions for an opportunity.
    Transitions opportunity status to STOPPED to prevent further customer fatigue or resource usage.
    """

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        external_ref = f"stop_{uuid.uuid4().hex[:12]}"

        # Mark opportunity as STOPPED
        opportunity.status = "STOPPED"
        opportunity.updated_at = datetime.utcnow()

        logger.info(
            f"[StopAdapter] Explicit STOP executed for opportunity {opportunity.id}. "
            f"Recovery workflow terminated (Ref: {external_ref})"
        )

        return {
            "success": True,
            "external_ref": external_ref,
            "payload": {
                "opportunity_id": opportunity.id,
                "previous_status": "OPEN",
                "current_status": "STOPPED",
                "reason": intervention.decision_reason or "Recovery halted by policy or resource constraint"
            }
        }
