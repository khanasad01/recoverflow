import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention, Customer
from services.action_executor.base import ActionAdapter

logger = logging.getLogger(__name__)


class EmailReminderAdapter(ActionAdapter):
    """Adapter to send email recovery reminders (simulated with logging)."""

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        try:
            recipient_email = "customer@example.com"
            if opportunity.customer_id:
                customer = db.query(Customer).filter(Customer.id == opportunity.customer_id).first()
                if customer and customer.email:
                    recipient_email = customer.email

            subject = f"Friendly Reminder: Complete your payment of {opportunity.currency} {opportunity.amount_at_risk}"
            body = (
                f"Dear Customer,\n\n"
                f"We noticed your recent payment of {opportunity.currency} {opportunity.amount_at_risk} did not go through "
                f"(Reason: {opportunity.failure_reason or 'Payment interruption'}).\n"
                f"Please update your payment method or retry your transaction to avoid service interruption.\n\n"
                f"Best regards,\nRecoverFlow Billing Team"
            )

            logger.info(f"Simulating Email Reminder to {recipient_email} for opportunity {opportunity.id}")

            return {
                "success": True,
                "external_ref": None,
                "payload": {
                    "recipient": recipient_email,
                    "subject": subject,
                    "status": "sent",
                    "preview": body[:120] + "..."
                }
            }
        except Exception as e:
            logger.error(f"Error in EmailReminderAdapter: {e}")
            return {
                "success": False,
                "external_ref": None,
                "payload": {"error": str(e)}
            }
