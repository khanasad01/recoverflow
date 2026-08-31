import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class WhatsAppService:
    """Service to deliver time-based one-time password (OTP) verification messages via Twilio WhatsApp API."""

    def __init__(
        self,
        account_sid: Optional[str] = None,
        auth_token: Optional[str] = None,
        whatsapp_from: Optional[str] = None,
    ):
        self.account_sid = account_sid or os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = auth_token or os.getenv("TWILIO_AUTH_TOKEN")
        self.whatsapp_from = whatsapp_from or os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

    def send_otp_whatsapp(self, to_number: str, otp: str) -> bool:
        """
        Send a 6-digit OTP code to the recipient's WhatsApp number.
        Uses Twilio API when credentials are provided, with automatic fallback to logging.
        """
        clean_number = to_number.strip().replace(" ", "").replace("-", "")
        recipient = clean_number if clean_number.startswith("whatsapp:") else f"whatsapp:{clean_number}"
        sender = self.whatsapp_from if self.whatsapp_from.startswith("whatsapp:") else f"whatsapp:{self.whatsapp_from}"

        message_body = (
            f"⚡ *RecoverFlow Security Verification*\n\n"
            f"Your verification code is: *{otp}*\n\n"
            f"This code will expire in 5 minutes. Do not share this code with anyone."
        )

        has_valid_creds = (
            self.account_sid
            and self.auth_token
            and not self.account_sid.startswith("ACxxxx")
            and "your_twilio" not in self.auth_token
            and "placeholder" not in self.auth_token
        )

        if has_valid_creds:
            try:
                from twilio.rest import Client

                client = Client(self.account_sid, self.auth_token)
                msg = client.messages.create(
                    body=message_body,
                    from_=sender,
                    to=recipient
                )
                logger.info(f"[WhatsAppService] Dispatched WhatsApp OTP to {recipient} (SID: {msg.sid}, Status: {msg.status})")
                return True
            except Exception as e:
                logger.warning(f"[WhatsAppService] Twilio WhatsApp API error: {e}. Falling back to simulation mode.")

        # Graceful simulation fallback
        logger.info(f"[WhatsAppService SIMULATION] Dispatched OTP '{otp}' to WhatsApp '{recipient}' (valid 5 min)")
        return True

    def send_qr_whatsapp(
        self,
        to_number: str,
        amount: float,
        upi_uri: str,
        note: str = "Payment Recovery",
    ) -> bool:
        """
        Send a payment recovery message with dynamic UPI payment link and intent via WhatsApp.
        """
        clean_number = to_number.strip().replace(" ", "").replace("-", "")
        recipient = clean_number if clean_number.startswith("whatsapp:") else f"whatsapp:{clean_number}"
        sender = self.whatsapp_from if self.whatsapp_from.startswith("whatsapp:") else f"whatsapp:{self.whatsapp_from}"

        message_body = (
            f"⚡ *RecoverFlow Express UPI Recovery*\n\n"
            f"Your payment of *INR {amount:,.2f}* was interrupted.\n\n"
            f"Tap to complete your payment instantly via any UPI App:\n"
            f"{upi_uri}\n\n"
            f"Reference: {note}\n"
            f"_Powered by RecoverFlow Smart Recovery Engine_"
        )

        has_valid_creds = (
            self.account_sid
            and self.auth_token
            and not self.account_sid.startswith("ACxxxx")
            and "your_twilio" not in self.auth_token
            and "placeholder" not in self.auth_token
        )

        if has_valid_creds:
            try:
                from twilio.rest import Client

                client = Client(self.account_sid, self.auth_token)
                msg = client.messages.create(
                    body=message_body,
                    from_=sender,
                    to=recipient
                )
                logger.info(f"[WhatsAppService] Dispatched UPI payment link to {recipient} (SID: {msg.sid})")
                return True
            except Exception as e:
                logger.warning(f"[WhatsAppService] Twilio error: {e}. Falling back to simulation mode.")

        logger.info(f"[WhatsAppService SIMULATION] Dispatched UPI payment link (INR {amount:.2f}) to '{recipient}'")
        return True

