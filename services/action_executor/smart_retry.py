import logging
import os
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention
from services.action_executor.base import ActionAdapter
import requests

logger = logging.getLogger(__name__)


class SmartRetryAdapter(ActionAdapter):
    """Adapter to trigger real smart retry via Razorpay."""

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        try:
            api_key = os.getenv("RAZORPAY_KEY_ID")
            api_secret = os.getenv("RAZORPAY_KEY_SECRET")
            
            # Create a retry order in Razorpay
            amount_paise = int(float(opportunity.amount_at_risk) * 100)
            url = "https://api.razorpay.com/v1/orders"
            data = {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"retry_{opportunity.id}",
                "notes": {
                    "opportunity_id": opportunity.id,
                    "retry_count": opportunity.retry_count + 1
                }
            }
            
            response = requests.post(
                url,
                json=data,
                auth=(api_key, api_secret),
                timeout=10
            )
            
            if response.status_code == 200:
                order_data = response.json()
                logger.info(f"Created Razorpay retry order {order_data.get('id')} for {opportunity.id}")
                return {
                    "success": True,
                    "external_ref": order_data.get("id"),
                    "payload": {
                        "order_id": order_data.get("id"),
                        "status": "scheduled",
                        "retry_count": opportunity.retry_count + 1
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
            logger.error(f"Error in SmartRetryAdapter: {e}")
            return {
                "success": False,
                "external_ref": None,
                "payload": {"error": str(e)}
            }
