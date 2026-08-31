import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention, Customer
from integrations.razorpay_client import create_payment_link
from services.action_executor.base import ActionAdapter

logger = logging.getLogger(__name__)


class RazorpayPaymentLinkAdapter(ActionAdapter):
    """Adapter to create Razorpay Payment Links for recovery."""

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        try:
            amount_paise = int(round(float(opportunity.amount_at_risk) * 100))
            currency = opportunity.currency or "INR"

            customer_email = None
            customer_contact = None
            customer_name = None

            if opportunity.customer_id:
                customer = db.query(Customer).filter(Customer.id == opportunity.customer_id).first()
                if customer:
                    customer_email = customer.email
                    customer_contact = customer.phone
                    customer_name = customer.external_id or customer.id

            description = f"RecoverFlow recovery payment for opportunity {opportunity.id}"
            notes = {
                "opportunity_id": opportunity.id,
                "intervention_id": intervention.id,
                "merchant_id": opportunity.merchant_id,
            }

            resp = create_payment_link(
                amount_paise=amount_paise,
                currency=currency,
                customer_id=opportunity.customer_id,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_contact=customer_contact,
                description=description,
                notes=notes
            )

            link_id = resp.get("id") or resp.get("short_url")
            logger.info(f"Created Razorpay payment link {link_id} for opportunity {opportunity.id}")

            return {
                "success": True,
                "external_ref": link_id,
                "payload": resp
            }
        except Exception as e:
            logger.error(f"Error in RazorpayPaymentLinkAdapter: {e}")
            return {
                "success": False,
                "external_ref": None,
                "payload": {"error": str(e)}
            }
