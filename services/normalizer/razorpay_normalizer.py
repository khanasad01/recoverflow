from datetime import datetime, timezone
from typing import Any, Dict, Optional
import logging

from services.normalizer.unified_schema import UnifiedEvent

logger = logging.getLogger(__name__)

EVENT_TYPE_MAPPING = {
    "payment.failed": "payment_failed",
    "payment.captured": "payment_captured",
    "payment_link.paid": "payment_link_paid",
    "payment.authorized": "payment_authorized",
    "subscription.charged": "subscription_charged",
    "subscription.halted": "subscription_halted",
}


class RazorpayNormalizer:
    """Normalizes raw Razorpay webhook payloads into UnifiedEvent schema."""

    def normalize(self, raw_event: Dict[str, Any]) -> UnifiedEvent:
        """
        Convert a raw Razorpay webhook event into a UnifiedEvent.
        """
        raw_event_type = raw_event.get("event", "unknown")
        event_type = EVENT_TYPE_MAPPING.get(raw_event_type, raw_event_type.replace(".", "_"))

        payload = raw_event.get("payload", {})
        
        # Determine entity based on event payload structure
        entity: Dict[str, Any] = {}
        if "payment" in payload and isinstance(payload["payment"], dict):
            entity = payload["payment"].get("entity", {})
        elif "payment_link" in payload and isinstance(payload["payment_link"], dict):
            entity = payload["payment_link"].get("entity", {})
        elif "subscription" in payload and isinstance(payload["subscription"], dict):
            entity = payload["subscription"].get("entity", {})
        elif "order" in payload and isinstance(payload["order"], dict):
            entity = payload["order"].get("entity", {})
        elif "entity" in raw_event and isinstance(raw_event["entity"], dict):
            entity = raw_event["entity"]

        # Extract event ID
        event_id = raw_event.get("event_id") or entity.get("id") or raw_event.get("id", "unknown_event")

        # Extract amount (Razorpay amounts are in paise -> convert to rupees / base currency)
        raw_amount = entity.get("amount") or entity.get("amount_paid") or 0
        try:
            amount = float(raw_amount) / 100.0
        except (ValueError, TypeError):
            amount = 0.0

        # Currency
        currency = entity.get("currency", "INR")

        # Failure reason extraction
        failure_reason: Optional[str] = (
            entity.get("error_description")
            or entity.get("error_reason")
            or entity.get("error_code")
        )

        # Payment method
        payment_method: Optional[str] = entity.get("method")

        # Customer ID extraction
        customer_id: Optional[str] = entity.get("customer_id")
        if not customer_id and "customer" in entity and isinstance(entity["customer"], dict):
            customer_id = entity["customer"].get("id")
        if not customer_id:
            customer_id = entity.get("email") or entity.get("contact")

        # Timestamp
        created_at_epoch = entity.get("created_at") or raw_event.get("created_at")
        if created_at_epoch and isinstance(created_at_epoch, (int, float)):
            event_timestamp = datetime.fromtimestamp(created_at_epoch, tz=timezone.utc).replace(tzinfo=None)
        else:
            event_timestamp = datetime.utcnow()

        # Metadata
        metadata = {
            "account_id": raw_event.get("account_id"),
            "entity_id": entity.get("id"),
            "order_id": entity.get("order_id"),
            "notes": entity.get("notes", {}),
            "error_code": entity.get("error_code"),
            "error_source": entity.get("error_source"),
            "error_step": entity.get("error_step"),
            "raw_event_type": raw_event_type,
        }

        # Include merchant_id if passed in notes or account_id
        if isinstance(entity.get("notes"), dict) and entity["notes"].get("merchant_id"):
            metadata["merchant_id"] = entity["notes"]["merchant_id"]
        elif raw_event.get("account_id"):
            metadata["merchant_id"] = raw_event["account_id"]

        return UnifiedEvent(
            event_id=str(event_id),
            source="razorpay",
            event_type=event_type,
            customer_id=str(customer_id) if customer_id else None,
            amount=amount,
            currency=currency,
            failure_reason=failure_reason,
            payment_method=payment_method,
            timestamp=event_timestamp,
            metadata=metadata
        )
