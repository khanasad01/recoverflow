import uuid
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session

from database.models import RevenueOpportunity, Intervention, Customer
from services.action_executor.base import ActionAdapter
from services.payments.upi_qr import UPIQRGenerator
from services.notification.email_service import EmailService
from services.notification.whatsapp_service import WhatsAppService

logger = logging.getLogger(__name__)


class UPIQRAdapter(ActionAdapter):
    """
    Action Adapter for generating and delivering NPCI-compliant dynamic UPI QR codes
    directly to customers via Email and WhatsApp for instant one-scan payment recovery.
    """

    def __init__(self):
        self.qr_generator = UPIQRGenerator()
        self.email_service = EmailService()
        self.whatsapp_service = WhatsAppService()

    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        try:
            amount = float(opportunity.amount_at_risk or 0.0)
            currency = (opportunity.currency or "INR").upper()
            note = f"Payment Recovery {opportunity.id}"
            ref_id = f"rf_{intervention.id}"

            # 1. Generate dynamic UPI deep link URI and Base64 QR Image
            upi_uri = self.qr_generator.generate_upi_uri(
                amount=amount,
                currency=currency,
                note=note,
                ref_id=ref_id
            )
            qr_base64 = self.qr_generator.generate_qr_base64(
                amount=amount,
                currency=currency,
                note=note,
                ref_id=ref_id
            )

            # 2. Lookup customer contact information
            customer_email = None
            customer_phone = None
            if opportunity.customer_id:
                customer = db.query(Customer).filter(Customer.id == opportunity.customer_id).first()
                if customer:
                    customer_email = customer.email
                    customer_phone = customer.phone

            dispatched_channels = []

            # 3. Deliver via WhatsApp if phone available
            if customer_phone:
                self.whatsapp_service.send_qr_whatsapp(
                    to_number=customer_phone,
                    amount=amount,
                    upi_uri=upi_uri,
                    note=note
                )
                dispatched_channels.append("whatsapp")

            # 4. Deliver via Email if email available or as primary
            if customer_email:
                self.email_service.send_qr_email(
                    to_email=customer_email,
                    subject=f"⚡ Complete your payment of ₹{amount:,.2f} via UPI QR",
                    amount=amount,
                    qr_base64=qr_base64,
                    note=note
                )
                dispatched_channels.append("email")

            if not dispatched_channels:
                # Simulation default dispatch
                logger.info(f"[UPIQRAdapter] Simulating UPI QR delivery for opportunity {opportunity.id}")
                dispatched_channels.append("simulated_direct")

            external_ref = f"upi_qr_{uuid.uuid4().hex[:12]}"
            logger.info(
                f"[UPIQRAdapter] Successfully generated and dispatched UPI QR for {opportunity.id} "
                f"via {', '.join(dispatched_channels)} (Ref: {external_ref})"
            )

            return {
                "success": True,
                "external_ref": external_ref,
                "payload": {
                    "upi_uri": upi_uri,
                    "amount": amount,
                    "currency": currency,
                    "channels": dispatched_channels,
                    "qr_generated": True
                }
            }
        except Exception as e:
            logger.error(f"[UPIQRAdapter] Error executing UPI QR recovery: {e}")
            return {
                "success": False,
                "external_ref": None,
                "payload": {"error": str(e)}
            }
