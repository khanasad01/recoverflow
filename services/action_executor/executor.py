import uuid
import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict

from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention, Outcome
from services.action_executor.base import ActionAdapter
from services.action_executor.razorpay_adapter import RazorpayPaymentLinkAdapter
from services.action_executor.email_adapter import EmailReminderAdapter
from services.action_executor.whatsapp_adapter import WhatsAppReminderAdapter
from services.action_executor.human_escalation import HumanEscalationAdapter
from services.action_executor.smart_retry import SmartRetryAdapter
from services.action_executor.incentive import IncentiveAdapter
from services.action_executor.subscription_recovery import SubscriptionRecoveryAdapter
from services.action_executor.upi_qr_adapter import UPIQRAdapter
from services.action_executor.payment_method_recovery import PaymentMethodRecoveryAdapter
from services.action_executor.stop import StopAdapter
from services.action_executor.voice_call import VoiceCallAdapter
from services.evidence.service import add_evidence

logger = logging.getLogger(__name__)


class ActionExecutor:
    """Orchestrates adapter execution, tracks interventions, and records outcomes."""

    def __init__(self):
        self._adapters: Dict[str, ActionAdapter] = {
            "payment_link": RazorpayPaymentLinkAdapter(),
            "payment_link_create": RazorpayPaymentLinkAdapter(),
            "email_reminder": EmailReminderAdapter(),
            "whatsapp": WhatsAppReminderAdapter(),
            "whatsapp_reminder": WhatsAppReminderAdapter(),
            "email": EmailReminderAdapter(),
            "human_escalation": HumanEscalationAdapter(),
            "escalate": HumanEscalationAdapter(),
            "smart_retry": SmartRetryAdapter(),
            "retry": SmartRetryAdapter(),
            "incentive": IncentiveAdapter(),
            "discount": IncentiveAdapter(),
            "subscription_recovery": SubscriptionRecoveryAdapter(),
            "subscription": SubscriptionRecoveryAdapter(),
            "upi_qr": UPIQRAdapter(),
            "upi": UPIQRAdapter(),
            "payment_method_recovery": PaymentMethodRecoveryAdapter(),
            "pm_recovery": PaymentMethodRecoveryAdapter(),
            "stop": StopAdapter(),
            "stop_recovery": StopAdapter(),
            "voice_call": VoiceCallAdapter(),
            "voice": VoiceCallAdapter(),
        }




    def get_adapter(self, action_type: str) -> ActionAdapter:
        """Resolve adapter instance for action type, default to EmailReminderAdapter."""
        key = action_type.lower().strip()
        if key in self._adapters:
            return self._adapters[key]
        logger.warning(f"Unknown action_type '{action_type}', defaulting to EmailReminderAdapter")
        return self._adapters["email_reminder"]

    def execute(
        self,
        opportunity: RevenueOpportunity,
        action_type: str,
        decision_reason: str = "",
        confidence: Optional[float] = None,
        db: Session = None
    ) -> Intervention:
        """
        Executes the specified action on the opportunity, recording the intervention in DB.
        """
        adapter = self.get_adapter(action_type)

        intervention = Intervention(
            id=f"intv_{uuid.uuid4().hex[:12]}",
            opportunity_id=opportunity.id,
            action_type=action_type,
            decision_reason=decision_reason,
            confidence=Decimal(str(round(confidence, 4))) if confidence is not None else None,
            policy_status="APPROVED",
            status="PENDING",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(intervention)
        db.flush()

        # Capture state before adapter execution
        before_status = opportunity.status

        # Execute adapter
        result = adapter.execute(opportunity, intervention, db)

        if result.get("success"):
            intervention.status = "EXECUTED"
            intervention.external_ref = result.get("external_ref")
            logger.info(f"Intervention {intervention.id} ({action_type}) EXECUTED successfully")
        else:
            intervention.status = "FAILED"
            logger.error(f"Intervention {intervention.id} ({action_type}) FAILED to execute")

        # Update opportunity state if not explicitly stopped
        if opportunity.status == "OPEN":
            opportunity.status = "ACTIONED"
        opportunity.retry_count = (opportunity.retry_count or 0) + 1
        opportunity.updated_at = datetime.utcnow()


        # Record action execution evidence
        add_evidence(
            opportunity_id=opportunity.id,
            intervention_id=intervention.id,
            event_type="ACTION_EXECUTED",
            actor="action_executor",
            reason=decision_reason or f"Executed action {action_type}",
            before_state={"status": before_status},
            after_state={"status": opportunity.status},
            payload={"action_type": action_type, "status": intervention.status, "external_ref": intervention.external_ref},
            db=db
        )

        db.commit()
        db.refresh(intervention)
        return intervention

    def record_outcome(
        self,
        intervention: Intervention,
        payment_status: str,
        recovered_amount: float,
        event_id: Optional[str] = None,
        db: Session = None
    ) -> Outcome:
        """
        Records an outcome for an intervention and marks opportunity as RECOVERED if paid.
        """
        outcome = Outcome(
            id=f"out_{uuid.uuid4().hex[:12]}",
            intervention_id=intervention.id,
            opportunity_id=intervention.opportunity_id,
            payment_status=payment_status,
            recovered_amount=Decimal(str(round(recovered_amount, 2))),
            event_id=event_id,
            observed_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(outcome)

        # If payment succeeded, transition opportunity to RECOVERED
        if payment_status.lower() in ("captured", "paid", "recovered", "success"):
            opp = db.query(RevenueOpportunity).filter(
                RevenueOpportunity.id == intervention.opportunity_id
            ).first()
            if opp:
                before_status = opp.status
                opp.status = "RECOVERED"
                opp.updated_at = datetime.utcnow()
                logger.info(f"Opportunity {opp.id} marked as RECOVERED via Outcome {outcome.id}")

                add_evidence(
                    opportunity_id=opp.id,
                    intervention_id=intervention.id,
                    event_type="OUTCOME_RECORDED",
                    actor="action_executor",
                    reason=f"Payment {payment_status} with recovered amount {recovered_amount}",
                    before_state={"status": before_status},
                    after_state={"status": "RECOVERED"},
                    payload={"payment_status": payment_status, "recovered_amount": recovered_amount, "event_id": event_id},
                    db=db
                )

        db.commit()
        db.refresh(outcome)
        return outcome
