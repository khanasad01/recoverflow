import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from database.models import Experiment, ExperimentAssignment, RevenueOpportunity
from services.experiment.engine import get_or_create_default_experiment

logger = logging.getLogger(__name__)


def calculate_incremental_recovery(
    experiment_id: str = "default",
    db: Optional[Session] = None
) -> Dict[str, Any]:
    """
    Computes incremental revenue attribution by comparing treatment recovery against
    the control group's baseline recovery rate.
    """
    if db is None:
        return {}

    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        exp = get_or_create_default_experiment(db)
        experiment_id = exp.id

    assignments = db.query(ExperimentAssignment, RevenueOpportunity).join(
        RevenueOpportunity, ExperimentAssignment.opportunity_id == RevenueOpportunity.id
    ).filter(ExperimentAssignment.experiment_id == experiment_id).all()

    control_count = 0
    control_recovered_count = 0
    control_total_amount = 0.0
    control_recovered_amount = 0.0

    treatment_count = 0
    treatment_recovered_count = 0
    treatment_total_amount = 0.0
    treatment_recovered_amount = 0.0

    for assignment, opp in assignments:
        is_recovered = opp.status == "RECOVERED"
        amt = float(opp.amount_at_risk or 0.0)

        if assignment.variant == "control":
            control_count += 1
            control_total_amount += amt
            if is_recovered:
                control_recovered_count += 1
                control_recovered_amount += amt
        else:
            treatment_count += 1
            treatment_total_amount += amt
            if is_recovered:
                treatment_recovered_count += 1
                treatment_recovered_amount += amt

    # Baseline recovery rate from control group
    if control_total_amount > 0:
        baseline_rate = control_recovered_amount / control_total_amount
    elif control_count > 0:
        baseline_rate = control_recovered_count / control_count
    else:
        baseline_rate = 0.0

    expected_baseline_recovery = round(treatment_total_amount * baseline_rate, 2)
    gross_treatment_recovery = round(treatment_recovered_amount, 2)
    incremental_recovery = round(gross_treatment_recovery - expected_baseline_recovery, 2)

    incremental_lift_percent = round(
        ((gross_treatment_recovery - expected_baseline_recovery) / expected_baseline_recovery * 100), 2
    ) if expected_baseline_recovery > 0 else 0.0

    return {
        "experiment_id": experiment_id,
        "experiment_name": exp.name,
        "control": {
            "total_count": control_count,
            "recovered_count": control_recovered_count,
            "total_amount_at_risk": round(control_total_amount, 2),
            "recovered_amount": round(control_recovered_amount, 2),
            "baseline_recovery_rate": round(baseline_rate, 4)
        },
        "treatment": {
            "total_count": treatment_count,
            "recovered_count": treatment_recovered_count,
            "total_amount_at_risk": round(treatment_total_amount, 2),
            "gross_recovered_amount": gross_treatment_recovery
        },
        "attribution": {
            "gross_recovery": gross_treatment_recovery,
            "baseline_expected_recovery": expected_baseline_recovery,
            "incremental_recovery": incremental_recovery,
            "incremental_lift_percent": incremental_lift_percent,
            "is_statistically_incremental": incremental_recovery > 0
        }
    }
