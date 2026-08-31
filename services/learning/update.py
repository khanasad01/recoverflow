import uuid
import logging
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Tuple, Any
from sqlalchemy.orm import Session
from database.models import (
    Intervention,
    RevenueOpportunity,
    Outcome,
    StrategyPerformance,
    StrategyWeight,
)

logger = logging.getLogger(__name__)


def update_strategy_performance(db: Session) -> List[StrategyPerformance]:
    """
    Aggregates historical recovery attempts by action_type and failure_reason,
    calculates success rates and lift, and upserts into strategy_performance table.
    """
    interventions = db.query(Intervention, RevenueOpportunity).join(
        RevenueOpportunity, Intervention.opportunity_id == RevenueOpportunity.id
    ).all()

    # Aggregate stats key: (action_type, failure_type)
    stats: Dict[Tuple[str, str], Dict[str, int]] = {}

    for intv, opp in interventions:
        action_type = intv.action_type or "unknown"
        failure_type = (opp.failure_reason or "unknown").lower().strip().replace(" ", "_")
        key = (action_type, failure_type)

        if key not in stats:
            stats[key] = {"total": 0, "success": 0}

        stats[key]["total"] += 1

        # Check if intervention had successful outcome or opportunity got recovered
        has_success = False
        if intv.outcomes:
            for out in intv.outcomes:
                if out.payment_status.lower() in ("captured", "paid", "recovered", "success"):
                    has_success = True
                    break
        elif opp.status == "RECOVERED":
            has_success = True

        if has_success:
            stats[key]["success"] += 1

    updated_records: List[StrategyPerformance] = []

    for (action_type, failure_type), data in stats.items():
        total = data["total"]
        success = data["success"]
        lift = round(success / total, 4) if total > 0 else 0.0

        existing = db.query(StrategyPerformance).filter(
            StrategyPerformance.action_type == action_type,
            StrategyPerformance.failure_type == failure_type
        ).first()

        if existing:
            existing.total_attempts = total
            existing.success_count = success
            existing.success_rate = Decimal(str(lift))
            existing.avg_lift = Decimal(str(lift))
            existing.updated_at = datetime.utcnow()
            updated_records.append(existing)
        else:
            new_record = StrategyPerformance(
                id=f"strat_{uuid.uuid4().hex[:12]}",
                segment_id="default_segment",
                failure_type=failure_type,
                action_type=action_type,
                total_attempts=total,
                success_count=success,
                success_rate=Decimal(str(lift)),
                avg_lift=Decimal(str(lift)),
                updated_at=datetime.utcnow()
            )
            db.add(new_record)
            updated_records.append(new_record)

    db.commit()
    for rec in updated_records:
        db.refresh(rec)

    logger.info(f"Updated {len(updated_records)} StrategyPerformance records")
    return updated_records


def auto_update_policy_weights(db: Session) -> List[StrategyWeight]:
    """
    Self-Learning Policy Update:
    Reads strategy_performance table, computes empirical win rate per action_type + failure_reason,
    and upserts into strategy_weights table.
    """
    # 1. First ensure strategy_performance is up to date
    perf_records = db.query(StrategyPerformance).all()
    if not perf_records:
        perf_records = update_strategy_performance(db)

    updated_weights: List[StrategyWeight] = []

    for perf in perf_records:
        action_type = perf.action_type
        failure_reason = perf.failure_type or "unknown"
        success_rate = float(perf.success_rate or perf.avg_lift or 0.5)
        total_attempts = perf.total_attempts or 0

        # Compute smoothed weight: Bayesian smoothing with base 0.5 prior
        # weight = (success_count + 1) / (total_attempts + 2)
        success_count = perf.success_count or 0
        smoothed_weight = round((success_count + 1) / (total_attempts + 2), 4)

        existing = db.query(StrategyWeight).filter(
            StrategyWeight.action_type == action_type,
            StrategyWeight.failure_reason == failure_reason
        ).first()

        if existing:
            existing.weight = Decimal(str(smoothed_weight))
            existing.sample_size = total_attempts
            existing.updated_at = datetime.utcnow()
            updated_weights.append(existing)
        else:
            new_weight = StrategyWeight(
                id=f"weight_{uuid.uuid4().hex[:12]}",
                action_type=action_type,
                failure_reason=failure_reason,
                weight=Decimal(str(smoothed_weight)),
                sample_size=total_attempts,
                updated_at=datetime.utcnow()
            )
            db.add(new_weight)
            updated_weights.append(new_weight)

    db.commit()
    for w in updated_weights:
        db.refresh(w)

    logger.info(f"[SelfLearningPolicy] Auto-updated {len(updated_weights)} strategy weights in DB")
    return updated_weights
