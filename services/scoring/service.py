import os
import uuid
import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, OpportunityScore
from services.customer_profile.builder import CustomerProfileBuilder
from services.scoring.heuristic import HeuristicScoringService, compute_expected_recovery
from services.scoring.ml_scoring import MLScoringService
from services.evidence.service import add_evidence

logger = logging.getLogger(__name__)


def score_opportunity(opportunity_id: str, db: Session) -> Optional[OpportunityScore]:
    """
    Retrieves opportunity from DB, builds customer profile, calculates score using
    either ML Logistic Regression model or Heuristic rules (controlled via SCORING_MODEL),
    stores OpportunityScore, and logs immutable evidence.
    """
    opportunity = db.query(RevenueOpportunity).filter(RevenueOpportunity.id == opportunity_id).first()
    if not opportunity:
        logger.warning(f"Opportunity not found for scoring: {opportunity_id}")
        return None

    profile_builder = CustomerProfileBuilder()
    customer_profile = profile_builder.build_profile(opportunity.customer_id, db)

    scoring_mode = os.getenv("SCORING_MODEL", "heuristic").lower().strip()
    model_version = "heuristic_v1"
    score = 0.5

    if scoring_mode == "ml":
        try:
            ml_service = MLScoringService()
            score = ml_service.calculate_score(
                float(opportunity.amount_at_risk or 0.0),
                customer_profile,
                opportunity.failure_reason
            )
            model_version = "ml_v1"
            logger.info(f"Opportunity {opportunity_id} scored via ML LogisticRegression: {score}")
        except Exception as e:
            logger.warning(f"ML scoring failed ({e}), falling back to HeuristicScoringService")
            heuristic_service = HeuristicScoringService()
            score = heuristic_service.calculate_score(opportunity, customer_profile)
            model_version = "heuristic_v1"
    else:
        heuristic_service = HeuristicScoringService()
        score = heuristic_service.calculate_score(opportunity, customer_profile)
        model_version = "heuristic_v1"

    expected_recovery = compute_expected_recovery(score, float(opportunity.amount_at_risk))

    # Priority score incorporates both recoverability score and amount weight
    priority_score = round(score * (float(opportunity.amount_at_risk) / 1000.0), 4)

    score_record = OpportunityScore(
        id=f"score_{uuid.uuid4().hex[:12]}",
        opportunity_id=opportunity.id,
        model_version=model_version,
        recoverability_score=Decimal(str(score)),
        expected_recovery=Decimal(str(expected_recovery)),
        priority_score=Decimal(str(priority_score)),
        features_json=customer_profile,
        created_at=datetime.utcnow()
    )

    db.add(score_record)

    # Log scoring evidence
    add_evidence(
        opportunity_id=opportunity.id,
        event_type="OPPORTUNITY_SCORED",
        actor="scoring_service",
        reason=f"Calculated {model_version} recoverability score {score:.4f}",
        payload={
            "score": score,
            "expected_recovery": expected_recovery,
            "priority_score": priority_score,
            "model_version": model_version
        },
        db=db
    )

    db.commit()
    db.refresh(score_record)
    logger.info(f"Opportunity {opportunity_id} scored: {score} ({model_version}) (expected recovery: {expected_recovery})")
    return score_record
