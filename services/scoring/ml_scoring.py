import os
import joblib
import numpy as np
import logging
from typing import Dict, Any, Optional
from sklearn.linear_model import LogisticRegression

logger = logging.getLogger(__name__)

DEFAULT_MODEL_DIR = "ml/models"
DEFAULT_MODEL_PATH = os.path.join(DEFAULT_MODEL_DIR, "recoverability_model.pkl")


class MLScoringService:
    """
    Supervised Machine Learning model (Logistic Regression) predicting
    payment failure recoverability probability based on customer profiles
    and transaction features.
    """

    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.model_path = model_path
        self.model: Optional[LogisticRegression] = None
        self._load_or_train_model()

    def _extract_feature_vector(
        self,
        amount_at_risk: float,
        profile: Dict[str, Any],
        failure_reason: Optional[str]
    ) -> np.ndarray:
        """Extract a standardized 8-dimensional feature vector."""
        # 1. Normalized amount
        norm_amt = min(float(amount_at_risk) / 10000.0, 5.0)

        # 2. Recency (days since last payment)
        recency_days = float(profile.get("days_since_last_payment") or 30.0)
        norm_recency = min(recency_days / 90.0, 2.0)

        # 3. Prior success & fail counts
        success_30d = float(profile.get("successful_payments_30d") or 0)
        fail_30d = float(profile.get("failed_payments_30d") or 0)

        # 4. Historical recovery rate
        hist_rate = float(profile.get("historical_recovery_rate") or 0.5)

        # 5. Failure reason one-hot encodings
        reason_str = (failure_reason or "").lower()
        is_insufficient = 1.0 if "insufficient" in reason_str else 0.0
        is_declined = 1.0 if "declined" in reason_str else 0.0
        is_timeout = 1.0 if "timeout" in reason_str or "gateway" in reason_str else 0.0

        return np.array([[
            norm_amt,
            norm_recency,
            success_30d,
            fail_30d,
            hist_rate,
            is_insufficient,
            is_declined,
            is_timeout
        ]])

    def train_and_save_model(self, n_samples: int = 1000) -> LogisticRegression:
        """Generate synthetic training dataset and train logistic regression estimator."""
        np.random.seed(42)

        # Generate realistic synthetic training distributions
        norm_amt = np.random.exponential(scale=0.5, size=n_samples)
        norm_recency = np.random.uniform(0.0, 1.5, size=n_samples)
        success_30d = np.random.poisson(lam=2.5, size=n_samples)
        fail_30d = np.random.poisson(lam=0.8, size=n_samples)
        hist_rate = np.random.beta(a=4, b=2, size=n_samples)
        is_insufficient = np.random.binomial(n=1, p=0.4, size=n_samples)
        is_declined = np.random.binomial(n=1, p=0.3, size=n_samples)
        is_timeout = np.random.binomial(n=1, p=0.2, size=n_samples)

        X = np.column_stack([
            norm_amt,
            norm_recency,
            success_30d,
            fail_30d,
            hist_rate,
            is_insufficient,
            is_declined,
            is_timeout
        ])

        # Underlying linear probability logit
        logits = (
            -0.5
            - 0.3 * norm_amt
            - 0.4 * norm_recency
            + 0.5 * success_30d
            - 0.6 * fail_30d
            + 1.8 * hist_rate
            + 0.7 * is_insufficient
            - 0.5 * is_declined
            + 0.6 * is_timeout
        )
        probabilities = 1.0 / (1.0 + np.exp(-logits))
        y = (np.random.rand(n_samples) < probabilities).astype(int)

        model = LogisticRegression(max_iter=500, random_state=42)
        model.fit(X, y)

        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(model, self.model_path)
        logger.info(f"ML Model trained and saved to {self.model_path}")
        self.model = model
        return model

    def _load_or_train_model(self):
        """Load serialized model or train on startup."""
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                logger.info(f"Loaded ML model from {self.model_path}")
            except Exception as e:
                logger.warning(f"Failed to load model from {self.model_path}: {e}. Retraining...")
                self.train_and_save_model()
        else:
            self.train_and_save_model()

    def calculate_score(
        self,
        amount_at_risk: float,
        customer_profile: Dict[str, Any],
        failure_reason: Optional[str]
    ) -> float:
        """Predict recoverability probability using trained ML model."""
        if self.model is None:
            self._load_or_train_model()

        X_input = self._extract_feature_vector(amount_at_risk, customer_profile, failure_reason)
        # Probabilities: [P(class 0), P(class 1)]
        proba = self.model.predict_proba(X_input)[0][1]
        return float(np.clip(round(proba, 4), 0.01, 0.99))
