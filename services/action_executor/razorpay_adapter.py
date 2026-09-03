import logging
import os
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention
from services.action_executor.base import ActionAdapter
import requests

logger = logging.getLogger(__name__)


class RazorpayPaymentLinkAdapter(ActionAdapter):
    """Adapter to create real Razorpay payment link."""

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        try:
            api_key = os.getenv("RAZORPAY_KEY_ID")
            api_secret = os.getenv("RAZORPAY_KEY_SECRET")
            
            # Amount in paise
            amount_paise = int(float(opportunity.amount_at_risk) * 100)
            
            url = "https://api.razorpay.com/v1/payment_links"
            data = {
                "amount": amount_paise,
                "currency": "INR",
                "description": f"Recovery payment for {opportunity.id}",
                "customer": {
                    "name": opportunity.customer_id or "Customer",
                    "contact": "+918092941953"
                },
                "notes": {
                    "opportunity_id": opportunity.id
                }
            }
            
            response = requests.post(
                url,
                json=data,
                auth=(api_key, api_secret),
                timeout=10
            )
            
            if response.status_code == 200:
                link_data = response.json()
                logger.info(f"Created Razorpay payment link {link_data.get('id')} for {opportunity.id}")
                return {
                    "success": True,
                    "external_ref": link_data.get("id"),
                    "payload": {
                        "payment_link": link_data.get("short_url"),
                        "status": "created"
                    }
                }
            else:
                logger.error(f"Razorpay API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "external_ref": None,
                    "payload": {"error": f"Razorpay error: {response.text}"}
                }
        except Exception as e:
            logger.error(f"Error in RazorpayPaymentLinkAdapter: {e}")
            return {
                "success": False,
                "external_ref": None,
                "payload": {"error": str(e)}
            }
