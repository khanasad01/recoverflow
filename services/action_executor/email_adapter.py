import logging
import os
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention, Customer
from services.action_executor.base import ActionAdapter
import requests

logger = logging.getLogger(__name__)


class EmailReminderAdapter(ActionAdapter):
    """Adapter to send real email recovery reminders via SendGrid."""

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        try:
            recipient_email = "khanasad1240@gmail.com"
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

            sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
            from_email = os.getenv("SENDGRID_FROM_EMAIL", "khanasad1240@gmail.com")
            
            url = "https://api.sendgrid.com/v3/mail/send"
            payload = {
                "personalizations": [{"to": [{"email": recipient_email}]}],
                "from": {"email": from_email},
                "subject": subject,
                "content": [{"type": "text/plain", "value": body}]
            }
            headers = {
                "Authorization": f"Bearer {sendgrid_api_key}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 202:
                logger.info(f"Email sent successfully to {recipient_email}")
                return {
                    "success": True,
                    "external_ref": None,
                    "payload": {
                        "recipient": recipient_email,
                        "status": "sent",
                        "sendgrid_status": response.status_code
                    }
                }
            else:
                logger.error(f"SendGrid API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "external_ref": None,
                    "payload": {"error": f"SendGrid error: {response.text}"}
                }
        except Exception as e:
            logger.error(f"Error in EmailReminderAdapter: {e}")
            return {
                "success": False,
                "external_ref": None,
                "payload": {"error": str(e)}
            }
