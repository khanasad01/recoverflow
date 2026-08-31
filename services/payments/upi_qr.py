import os
import io
import base64
import urllib.parse
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class UPIQRGenerator:
    """Service to generate NPCI-compliant UPI deep links and dynamic QR code images."""

    def __init__(
        self,
        merchant_upi_id: Optional[str] = None,
        merchant_name: Optional[str] = None,
    ):
        self.merchant_upi_id = merchant_upi_id or os.getenv("MERCHANT_UPI_ID", "recoverflow@icici")
        self.merchant_name = merchant_name or os.getenv("MERCHANT_NAME", "RecoverFlow Merchant")

    def generate_upi_uri(
        self,
        amount: float,
        currency: str = "INR",
        note: str = "Payment Recovery",
        ref_id: Optional[str] = None,
    ) -> str:
        """
        Build an NPCI-standard UPI deep link intent URI.
        Format: upi://pay?pa={upi_id}&pn={name}&am={amount}&cu={currency}&tn={note}&tr={ref}
        """
        params = {
            "pa": self.merchant_upi_id,
            "pn": self.merchant_name,
            "am": f"{float(amount):.2f}",
            "cu": currency.upper(),
            "tn": note,
        }
        if ref_id:
            params["tr"] = ref_id

        query_string = urllib.parse.urlencode(params)
        return f"upi://pay?{query_string}"

    def generate_qr_base64(
        self,
        amount: float,
        currency: str = "INR",
        note: str = "Payment Recovery",
        ref_id: Optional[str] = None,
    ) -> str:
        """
        Generate dynamic QR code PNG image encoded in base64 string format.
        """
        import qrcode

        upi_uri = self.generate_upi_uri(amount=amount, currency=currency, note=note, ref_id=ref_id)

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(upi_uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

        logger.info(
            f"[UPIQRGenerator] Generated dynamic UPI QR for amount INR {amount:.2f} (URI: {upi_uri[:45]}...)"
        )
        return img_str
