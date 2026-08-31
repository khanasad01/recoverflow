import uuid
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention
from services.action_executor.base import ActionAdapter

logger = logging.getLogger(__name__)


class SmartRetryAdapter(ActionAdapter):
    """
    Simulates scheduling an intelligent, optimal-timing retry for transient
    gateway or bank network errors.
    """

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        retry_ref = f"retry_{uuid.uuid4().hex[:10]}"
        logger.info(
            f"[SmartRetryAdapter] Scheduled intelligent retry for opportunity {opportunity.id} "
            f"with external ref {retry_ref} (Reason: {opportunity.failure_reason})"
        )

        return {
            "success": True,
            "external_ref": retry_ref,
            "payload": {
                "opportunity_id": opportunity.id,
                "retry_delay_seconds": 300,
                "strategy": "exponential_backoff_with_jitter",
                "failure_reason": opportunity.failure_reason
            }
        }
