import uuid
import logging
from datetime import datetime, date as dt_date
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from database.models import ResourceLimit

logger = logging.getLogger(__name__)

DEFAULT_ACTION_LIMITS: Dict[str, int] = {
    "payment_link": 500,
    "smart_retry": 1000,
    "incentive": 200,
    "subscription_recovery": 500,
    "email_reminder": 2000,
    "upi_qr": 500,
    "payment_method_recovery": 300,
    "voice_call": 10,
    "stop": 10000,
    "human_escalation": 50,
}




def get_or_create_daily_limit(action_type: str, db: Session) -> ResourceLimit:
    """Retrieve or initialize today's ResourceLimit counter for an action type."""
    today = dt_date.today()
    clean_action = (action_type or "unknown").lower().strip()

    record = db.query(ResourceLimit).filter(
        ResourceLimit.action_type == clean_action,
        ResourceLimit.date == today
    ).first()

    if not record:
        max_limit = DEFAULT_ACTION_LIMITS.get(clean_action, 1000)
        record = ResourceLimit(
            id=f"res_{clean_action}_{today.isoformat().replace('-', '')}",
            action_type=clean_action,
            max_daily=max_limit,
            current_count=0,
            date=today,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    return record


def check_limit(action_type: str, db: Session) -> bool:
    """
    Check if the daily execution quota for the specified action type is available.
    Returns True if current_count < max_daily, else False.
    """
    try:
        record = get_or_create_daily_limit(action_type, db)
        allowed = record.current_count < record.max_daily
        if not allowed:
            logger.warning(
                f"[ResourceManager] Daily resource limit reached for '{action_type}': "
                f"{record.current_count}/{record.max_daily} executions used today ({record.date})"
            )
        return allowed
    except Exception as e:
        logger.error(f"[ResourceManager] Error checking limit for {action_type}: {e}")
        return True  # Fail open if error


def increment_usage(action_type: str, db: Session) -> int:
    """Increment the daily execution count for an action type."""
    try:
        record = get_or_create_daily_limit(action_type, db)
        record.current_count += 1
        record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(record)
        logger.info(
            f"[ResourceManager] Incremented usage for '{action_type}': "
            f"{record.current_count}/{record.max_daily}"
        )
        return record.current_count
    except Exception as e:
        db.rollback()
        logger.error(f"[ResourceManager] Error incrementing usage for {action_type}: {e}")
        return 0


def reset_daily_counters(db: Session) -> int:
    """Reset daily counters at midnight or for testing."""
    try:
        today = dt_date.today()
        records = db.query(ResourceLimit).filter(ResourceLimit.date == today).all()
        count = 0
        for r in records:
            r.current_count = 0
            r.updated_at = datetime.utcnow()
            count += 1
        db.commit()
        logger.info(f"[ResourceManager] Reset {count} daily resource counters for {today}")
        return count
    except Exception as e:
        db.rollback()
        logger.error(f"[ResourceManager] Error resetting counters: {e}")
        return 0


def get_all_usage(db: Session) -> List[Dict[str, Any]]:
    """Retrieve current day's usage statistics across all defined recovery actions."""
    today = dt_date.today()
    # Ensure default action records exist
    for action in DEFAULT_ACTION_LIMITS.keys():
        get_or_create_daily_limit(action, db)

    records = db.query(ResourceLimit).filter(ResourceLimit.date == today).all()
    results = []
    for r in records:
        remaining = max(0, r.max_daily - r.current_count)
        usage_pct = round((r.current_count / r.max_daily) * 100.0, 2) if r.max_daily > 0 else 0.0
        results.append({
            "id": r.id,
            "action_type": r.action_type,
            "max_daily": r.max_daily,
            "current_count": r.current_count,
            "remaining": remaining,
            "usage_percent": usage_pct,
            "date": r.date.isoformat() if hasattr(r.date, "isoformat") else str(r.date),
            "updated_at": r.updated_at
        })

    return sorted(results, key=lambda x: x["action_type"])
