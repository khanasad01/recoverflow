from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class UnifiedEvent(BaseModel):
    """Unified event schema for all payment gateway and webhook events."""
    event_id: str
    source: str
    event_type: str
    customer_id: Optional[str] = None
    amount: float
    currency: str = "INR"
    failure_reason: Optional[str] = None
    payment_method: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(
        extra="allow",
        from_attributes=True,
        populate_by_name=True
    )
