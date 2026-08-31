import logging
from typing import Dict, Any
from database.models import RevenueOpportunity

logger = logging.getLogger(__name__)

POSITIVE_REASONS = {
    "insufficient_funds",
    "card_declined",
    "payment_failed",
    "bad_request_error",
    "temporary_failure"
}

NEGATIVE_REASONS = {
    "card_expired",
    "invalid_card",
    "account_closed",
    "fraud_detected"
}


class HeuristicScoringService:
    """Heuristic recoverability scoring engine."""

    def calculate_score(self, opportunity: RevenueOpportunity, customer_profile: Dict[str, Any]) -> float:
        """
        Calculate recoverability score (0.0 to 1.0) based on opportunity details and customer profile.
        """
        score = 0.5

        # 1. Failure reason impact
        reason = (opportunity.failure_reason or "").lower().strip()
        reason_normalized = reason.replace(" ", "_").replace(".", "_")

        if any(pos in reason_normalized for pos in POSITIVE_REASONS):
            score += 0.2
        elif any(neg in reason_normalized for neg in NEGATIVE_REASONS):
            score -= 0.2

        # 2. Historical success in last 90 days
        success_90d = customer_profile.get("successful_payment_count_90d", 0)
        if success_90d > 0:
            score += 0.1
        else:
            score -= 0.1

        # 3. Failure frequency in last 90 days
        failed_90d = customer_profile.get("failed_payment_count_90d", 0)
        if failed_90d <= 2:
            score += 0.1
        else:
            score -= 0.1

        # 4. Amount at risk
        amount = float(opportunity.amount_at_risk or 0.0)
        if amount < 1000.0:
            score += 0.1
        else:
            score -= 0.05

        # 5. Retry count
        retry_count = opportunity.retry_count or 0
        if retry_count == 0:
            score += 0.1
        else:
            score -= 0.1

        # Clamp between 0.0 and 1.0
        final_score = max(0.0, min(1.0, score))
        return round(final_score, 4)


def compute_expected_recovery(score: float, amount: float) -> float:
    """Calculate expected recovery value: score * amount."""
    return round(float(score) * float(amount), 2)
