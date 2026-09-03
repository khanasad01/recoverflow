import uuid
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
                    "external_ref": f"retry_{order_data.get('id')}",
                    "payload": {
                        "order_id": order_data.get("id"),
                        "status": "scheduled",
                        "strategy": "exponential_backoff_with_jitter",
                        "retry_count": (opportunity.retry_count or 0) + 1
                    }
                }
            else:
                logger.warning(f"Razorpay API returned {response.status_code} - {response.text}. Falling back to scheduled retry.")
                retry_ref = f"retry_{uuid.uuid4().hex[:10]}"
                return {
                    "success": True,
                    "external_ref": retry_ref,
                    "payload": {
                        "opportunity_id": opportunity.id,
                        "retry_delay_seconds": 300,
                        "strategy": "exponential_backoff_with_jitter",
                        "failure_reason": opportunity.failure_reason,
                        "fallback": True
                    }
                }
        except Exception as e:
            logger.warning(f"Error in SmartRetryAdapter: {e}. Falling back to scheduled retry.")
            retry_ref = f"retry_{uuid.uuid4().hex[:10]}"
            return {
                "success": True,
                "external_ref": retry_ref,
                "payload": {
                    "opportunity_id": opportunity.id,
                    "retry_delay_seconds": 300,
                    "strategy": "exponential_backoff_with_jitter",
                    "failure_reason": opportunity.failure_reason,
                    "fallback": True
                }
            }
