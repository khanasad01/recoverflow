import os
import yaml
import logging
from typing import Dict, Any, Optional, Union
from decimal import Decimal
from database.models import RevenueOpportunity

logger = logging.getLogger(__name__)

DEFAULT_POLICY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "policies", "default_policy.yaml"
)


class PolicyEngine:
    """Evaluates whether an intervention or action is permitted for a given opportunity."""

    def __init__(self, policy_path: Optional[str] = None):
        self.policy_path = policy_path or DEFAULT_POLICY_PATH
        self.rules = self.load_rules()

    def load_rules(self) -> Dict[str, Any]:
        """Load policy rules from YAML file with safe fallback."""
        default_rules = {
            "max_payment_link_amount": 10000,
            "human_approval_threshold": 50000,
            "allowed_failure_reasons": ["insufficient_funds", "card_declined", "payment_failed", "bad_request_error", "bank_error", "network_issue", "gateway_timeout"],
            "max_retry_attempts": 3,
            "actions": {
                "payment_link": {
                    "max_amount": 10000,
                    "allowed_failure_reasons": ["insufficient_funds", "card_declined", "payment_failed", "bad_request_error"],
                    "max_attempts": 3
                },
                "email_reminder": {
                    "max_amount": 50000,
                    "allowed_failure_reasons": ["card_declined", "card_expired", "expired_card", "insufficient_funds", "payment_failed", "bad_request_error"],
                    "max_attempts": 5
                },
                "smart_retry": {
                    "max_amount": 50000,
                    "allowed_failure_reasons": ["bank_error", "network_issue", "gateway_timeout", "temporary_error"],
                    "max_attempts": 3
                },
                "incentive": {
                    "max_amount": 50000,
                    "allowed_failure_reasons": ["card_declined", "insufficient_funds"],
                    "max_attempts": 2
                },
                "subscription_recovery": {
                    "max_amount": 50000,
                    "allowed_failure_reasons": None,
                    "max_attempts": 4
                },
                "upi_qr": {
                    "max_amount": 10000,
                    "allowed_failure_reasons": ["insufficient_funds", "card_declined", "payment_failed", "bad_request_error", "bank_error", "network_issue"],
                    "max_attempts": 3
                },
                "payment_method_recovery": {
                    "max_amount": 20000,
                    "allowed_failure_reasons": ["insufficient_funds", "card_declined", "payment_failed", "bad_request_error", "bank_error", "network_issue", "expired_card", "card_expired"],
                    "max_attempts": 3
                },
                "stop": {
                    "max_amount": 10000000,
                    "allowed_failure_reasons": None,
                    "max_attempts": 99
                },
                "voice_call": {
                    "max_amount": 5000,
                    "allowed_failure_reasons": ["insufficient_funds", "payment_failed", "bank_error", "card_declined"],
                    "max_attempts": 2
                },
                "human_escalation": {
                    "max_amount": 1000000,
                    "allowed_failure_reasons": None,
                    "max_attempts": 3
                }
            }
        }



        if os.path.exists(self.policy_path):
            try:
                with open(self.policy_path, "r") as f:
                    data = yaml.safe_load(f)
                    if isinstance(data, dict):
                        default_rules.update(data)
            except Exception as e:
                logger.error(f"Error loading policy YAML from {self.policy_path}: {e}")
        else:
            logger.warning(f"Policy file not found at {self.policy_path}, using defaults")

        return default_rules

    def needs_human_approval(self, amount: Union[float, Decimal, int, None]) -> bool:
        """
        Check if the opportunity amount exceeds the human approval threshold.
        """
        if amount is None:
            return False
        threshold = float(self.rules.get("human_approval_threshold", 50000))
        return float(amount) > threshold

    def evaluate(self, opportunity: RevenueOpportunity, action_type: str) -> Dict[str, Any]:
        """
        Evaluate if an action is allowed for an opportunity.
        Returns {'allowed': bool, 'reason': str}
        """
        actions_cfg = self.rules.get("actions", {})
        action_cfg = actions_cfg.get(action_type, {})

        max_retries = action_cfg.get("max_attempts") or self.rules.get("max_retry_attempts", 3)
        max_amount = action_cfg.get("max_amount") or self.rules.get("max_payment_link_amount", 10000)
        allowed_reasons = action_cfg.get("allowed_failure_reasons")
        if allowed_reasons is None and "allowed_failure_reasons" in self.rules and action_type in ("payment_link", "payment_link_create"):
            allowed_reasons = self.rules.get("allowed_failure_reasons", [])

        # 1. Max retry attempts check
        retry_count = opportunity.retry_count or 0
        if retry_count >= max_retries:
            return {"allowed": False, "reason": "Max retries exceeded"}

        # 2. Amount check
        amount = float(opportunity.amount_at_risk or 0.0)
        if amount > max_amount:
            return {"allowed": False, "reason": "Amount exceeds limit"}

        # 3. Failure reason check (if action restricts allowed reasons)
        if allowed_reasons is not None:
            reason = (opportunity.failure_reason or "").lower().strip()
            reason_normalized = reason.replace(" ", "_").replace(".", "_")

            matched = any(allowed in reason_normalized for allowed in allowed_reasons)
            if not matched and opportunity.failure_reason:
                return {"allowed": False, "reason": "Failure reason not allowed"}

        return {"allowed": True, "reason": "Action approved by policy"}
