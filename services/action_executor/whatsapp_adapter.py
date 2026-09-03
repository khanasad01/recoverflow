import logging
import os
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention, Customer
from services.action_executor.base import ActionAdapter
from requests.auth import HTTPBasicAuth
import requests

logger = logging.getLogger(__name__)


class WhatsAppReminderAdapter(ActionAdapter):
    """Adapter to send real WhatsApp messages via Twilio."""

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        try:
            to_number = "whatsapp:+918092941953"
            if opportunity.customer_id:
                customer = db.query(Customer).filter(Customer.id == opportunity.customer_id).first()
                if customer and customer.phone:
                    to_number = f"whatsapp:+{customer.phone}"

            message_body = (
                f"Dear Customer,\n\n"
                f"We noticed your recent payment of {opportunity.currency} {opportunity.amount_at_risk} did not go through "
                f"(Reason: {opportunity.failure_reason or 'Payment interruption'}).\n"
                f"Please update your payment method or retry your transaction to avoid service interruption.\n\n"
                f"Best regards,\nRecoverFlow Billing Team"
            )

            account_sid = os.getenv("TWILIO_ACCOUNT_SID")
            auth_token = os.getenv("TWILIO_AUTH_TOKEN")
            from_number = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
            
            url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
            data = {
                "From": from_number,
                "To": to_number,
                "Body": message_body
            }
            
            response = requests.post(url, data=data, auth=HTTPBasicAuth(account_sid, auth_token), timeout=10)
            
            if response.status_code == 201:
                logger.info(f"WhatsApp message sent to {to_number}")
                return {
                    "success": True,
                    "external_ref": response.json().get("sid"),
                    "payload": {
                        "recipient": to_number,
                        "status": "sent",
                        "twilio_sid": response.json().get("sid")
                    }
                }
            else:
                logger.error(f"Twilio API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "external_ref": None,
                    "payload": {"error": f"Twilio error: {response.text}"}
                }
        except Exception as e:
            logger.error(f"Error in WhatsAppReminderAdapter: {e}")
            return {
                "success": False,
                "external_ref": None,
                "payload": {"error": str(e)}
            }
