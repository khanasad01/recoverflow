import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from database.models import EvidenceEvent

logger = logging.getLogger(__name__)


def add_evidence(
    opportunity_id: str,
    event_type: str,
    actor: str,
    reason: Optional[str] = None,
    before_state: Optional[Dict[str, Any]] = None,
    after_state: Optional[Dict[str, Any]] = None,
    payload: Optional[Dict[str, Any]] = None,
    intervention_id: Optional[str] = None,
    db: Optional[Session] = None
) -> Optional[EvidenceEvent]:
    """
    Creates and records an immutable EvidenceEvent audit trail in the database.
    """
    if db is None:
        return None

    try:
        evidence = EvidenceEvent(
            id=f"ev_{uuid.uuid4().hex[:12]}",
            opportunity_id=opportunity_id,
            intervention_id=intervention_id,
            event_type=event_type,
            actor=actor,
            reason=reason,
            before_state=before_state,
            after_state=after_state,
            payload=payload,
            created_at=datetime.utcnow()
        )
        db.add(evidence)
        db.flush()
        logger.info(f"Recorded EvidenceEvent: {evidence.id} ({event_type}) for opportunity {opportunity_id}")
        return evidence
    except Exception as e:
        logger.error(f"Failed to record evidence event for opportunity {opportunity_id}: {e}")
        return None
