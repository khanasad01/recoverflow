import uuid
import hashlib
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from database.models import Experiment, ExperimentAssignment, RevenueOpportunity

logger = logging.getLogger(__name__)


def get_or_create_default_experiment(db: Session) -> Experiment:
    """Ensure a default experiment exists in the database."""
    exp = db.query(Experiment).filter(Experiment.id == "default").first()
    if not exp:
        exp = Experiment(
            id="default",
            name="Default 50/50 Recovery Experiment",
            treatment_percent=50,
            metric="recovery_rate",
            status="ACTIVE",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(exp)
        db.flush()
    return exp


def assign_variant(
    opportunity_id: str,
    db: Session,
    experiment_id: str = "default"
) -> str:
    """
    Deterministically assigns a RevenueOpportunity to either 'control' or 'treatment' group.
    Stores assignment in experiment_assignments and updates opportunity.group.
    """
    # Check if already assigned
    existing = db.query(ExperimentAssignment).filter(
        ExperimentAssignment.experiment_id == experiment_id,
        ExperimentAssignment.opportunity_id == opportunity_id
    ).first()

    if existing:
        return existing.variant

    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        if experiment_id == "default":
            exp = get_or_create_default_experiment(db)
        else:
            logger.warning(f"Experiment {experiment_id} not found, falling back to default")
            exp = get_or_create_default_experiment(db)
            experiment_id = "default"

    # Deterministic hash assignment based on experiment_id and opportunity_id
    hash_int = int(hashlib.sha256(f"{experiment_id}:{opportunity_id}".encode()).hexdigest(), 16)
    percent_bucket = hash_int % 100
    variant = "treatment" if percent_bucket < (exp.treatment_percent or 50) else "control"

    assignment = ExperimentAssignment(
        id=f"asgn_{uuid.uuid4().hex[:12]}",
        experiment_id=experiment_id,
        opportunity_id=opportunity_id,
        variant=variant,
        assigned_at=datetime.utcnow()
    )
    db.add(assignment)

    # Update opportunity record
    opp = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opportunity_id).first()
    if opp:
        opp.group = variant
        opp.updated_at = datetime.utcnow()

    db.flush()
    logger.info(f"Assigned opportunity {opportunity_id} to variant '{variant}' for experiment '{experiment_id}'")
    return variant


def compute_lift(experiment_id: str, db: Session) -> Dict[str, Any]:
    """
    Calculates the recovery rate and statistical lift between treatment and control groups.
    """
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        exp = get_or_create_default_experiment(db)
        experiment_id = exp.id

    assignments = db.query(ExperimentAssignment, RevenueOpportunity).join(
        RevenueOpportunity, ExperimentAssignment.opportunity_id == RevenueOpportunity.id
    ).filter(ExperimentAssignment.experiment_id == experiment_id).all()

    control_total = 0
    control_recovered = 0
    control_amount_recovered = 0.0

    treatment_total = 0
    treatment_recovered = 0
    treatment_amount_recovered = 0.0

    for assignment, opp in assignments:
        is_recovered = opp.status == "RECOVERED"
        amt = float(opp.amount_at_risk or 0.0)

        if assignment.variant == "control":
            control_total += 1
            if is_recovered:
                control_recovered += 1
                control_amount_recovered += amt
        else:
            treatment_total += 1
            if is_recovered:
                treatment_recovered += 1
                treatment_amount_recovered += amt

    control_rate = round(control_recovered / control_total, 4) if control_total > 0 else 0.0
    treatment_rate = round(treatment_recovered / treatment_total, 4) if treatment_total > 0 else 0.0
    absolute_lift = round(treatment_rate - control_rate, 4)
    relative_lift_percent = round(((treatment_rate - control_rate) / control_rate * 100), 2) if control_rate > 0 else 0.0

    return {
        "experiment_id": experiment_id,
        "experiment_name": exp.name,
        "metric": exp.metric,
        "status": exp.status,
        "control": {
            "total_opportunities": control_total,
            "recovered_opportunities": control_recovered,
            "recovery_rate": control_rate,
            "recovered_amount": round(control_amount_recovered, 2)
        },
        "treatment": {
            "total_opportunities": treatment_total,
            "recovered_opportunities": treatment_recovered,
            "recovery_rate": treatment_rate,
            "recovered_amount": round(treatment_amount_recovered, 2)
        },
        "lift": {
            "absolute_lift": absolute_lift,
            "relative_lift_percent": relative_lift_percent,
            "is_positive": absolute_lift > 0
        }
    }
