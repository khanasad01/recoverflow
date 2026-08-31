from datetime import datetime, timezone
from typing import Any, Dict, Optional
import logging

from services.normalizer.unified_schema import UnifiedEvent

logger = logging.getLogger(__name__)

STRIPE_EVENT_MAPPING = {
    "payment_intent.payment_failed": "payment_failed",
    "payment_intent.failed": "payment_failed",
    "invoice.payment_failed": "invoice_failed",
    "checkout.session.abandoned": "checkout_abandoned",
    "checkout.session.expired": "checkout_abandoned",
    "payment_intent.succeeded": "payment_captured",
    "invoice.paid": "payment_captured",
    "charge.succeeded": "payment_captured",
}


class StripeNormalizer:
    """Normalizes raw Stripe webhook payloads into the UnifiedEvent schema."""

    def normalize(self, raw_event: Dict[str, Any]) -> UnifiedEvent:
        """
        Convert a raw Stripe webhook event dictionary into a standardized UnifiedEvent.
        """
        raw_event_type = raw_event.get("type") or raw_event.get("event", "unknown")
        event_type = STRIPE_EVENT_MAPPING.get(raw_event_type, raw_event_type.replace(".", "_"))

        # Extract data object
        data_wrapper = raw_event.get("data", {})
        data_obj: Dict[str, Any] = data_wrapper.get("object", {}) if isinstance(data_wrapper, dict) else {}
        if not data_obj and "object" in raw_event and isinstance(raw_event["object"], dict):
            data_obj = raw_event["object"]
        elif not data_obj:
            data_obj = raw_event

        # Extract event ID
        event_id = raw_event.get("id") or data_obj.get("id") or "stripe_evt_unknown"

        # Amount extraction (Stripe amounts are in cents / paise -> divide by 100.0)
        raw_amount = (
            data_obj.get("amount")
            or data_obj.get("amount_due")
            or data_obj.get("amount_total")
            or data_obj.get("amount_paid")
            or 0
        )
        try:
            amount = float(raw_amount) / 100.0
        except (ValueError, TypeError):
            amount = 0.0

        # Currency
        currency = (data_obj.get("currency") or "USD").upper()

        # Customer ID extraction
        customer_id: Optional[str] = (
            data_obj.get("customer")
            or data_obj.get("customer_id")
        )
        if isinstance(customer_id, dict):
            customer_id = customer_id.get("id")

        if not customer_id and "customer_details" in data_obj and isinstance(data_obj["customer_details"], dict):
            customer_id = data_obj["customer_details"].get("email") or data_obj["customer_details"].get("name")

        if not customer_id:
            customer_id = data_obj.get("receipt_email") or data_obj.get("billing_details", {}).get("email") if isinstance(data_obj.get("billing_details"), dict) else None

        # Failure reason extraction
        failure_reason = None
        last_error = data_obj.get("last_payment_error")
        if isinstance(last_error, dict):
            failure_reason = last_error.get("code") or last_error.get("message")
        if not failure_reason:
            failure_reason = data_obj.get("failure_message") or data_obj.get("failure_code") or data_obj.get("cancel_reason")

        # Payment method
        payment_method = None
        if data_obj.get("payment_method_types") and isinstance(data_obj["payment_method_types"], list) and len(data_obj["payment_method_types"]) > 0:
            payment_method = data_obj["payment_method_types"][0]
        elif isinstance(data_obj.get("payment_method_details"), dict):
            payment_method = data_obj["payment_method_details"].get("type")

        # Timestamp
        created_at_epoch = raw_event.get("created") or data_obj.get("created")
        if created_at_epoch and isinstance(created_at_epoch, (int, float)):
            event_timestamp = datetime.fromtimestamp(created_at_epoch, tz=timezone.utc).replace(tzinfo=None)
        else:
            event_timestamp = datetime.utcnow()

        # Metadata
        metadata = {
            "stripe_event_id": raw_event.get("id"),
            "object_id": data_obj.get("id"),
            "object_type": data_obj.get("object"),
            "raw_event_type": raw_event_type,
            "status": data_obj.get("status"),
            "livemode": raw_event.get("livemode", False),
            "customer_email": data_obj.get("receipt_email"),
            "client_secret": data_obj.get("client_secret"),
            "stripe_metadata": data_obj.get("metadata", {})
        }

        # Merchant ID extraction from metadata if present
        if isinstance(data_obj.get("metadata"), dict) and data_obj["metadata"].get("merchant_id"):
            metadata["merchant_id"] = data_obj["metadata"]["merchant_id"]
        elif raw_event.get("account"):
            metadata["merchant_id"] = raw_event["account"]

        return UnifiedEvent(
            event_id=str(event_id),
            source="stripe",
            event_type=event_type,
            customer_id=str(customer_id) if customer_id else None,
            amount=amount,
            currency=currency,
            failure_reason=str(failure_reason) if failure_reason else None,
            payment_method=str(payment_method) if payment_method else None,
            timestamp=event_timestamp,
            metadata=metadata
        )
