"""
fraud_agent.py — Fraud Detection Agent.

Combines rule-based checks with an unsupervised Isolation Forest
Machine Learning anomaly detection model:
1. Rule-based guards: bulk ticket threshold, flagged cardholder names,
   and known test-card fingerprints.
2. Machine Learning Anomaly Detection: Scikit-Learn IsolationForest model
   evaluating multi-dimensional features (velocity, amount, quantity,
   name entropy, and card risk score) to generate continuous risk scores.
"""

from dataclasses import dataclass
from pathlib import Path
import numpy as np
import joblib

from app.models.enums import FraudSeverity

BULK_QUANTITY_THRESHOLD = 10
FLAGGED_NAME_SUBSTRINGS = {"test", "fraud", "scam", "hacker", "fake"}

KNOWN_TEST_CARD_NUMBERS = {
    "4111111111111111",
    "4242424242424242",
    "4000000000000002",
    "5555555555554444",
    "378282246310005",
}

# Load serialized Isolation Forest model if present
_MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "fraud_model.joblib"
_ML_MODEL_BUNDLE = None

try:
    if _MODEL_PATH.exists():
        _ML_MODEL_BUNDLE = joblib.load(_MODEL_PATH)
except Exception:
    _ML_MODEL_BUNDLE = None


@dataclass
class FraudScreeningResult:
    allowed: bool
    reason: str | None = None
    severity: FraudSeverity | None = None
    fraud_type: str | None = None
    ml_risk_score: float = 0.0
    is_ml_anomaly: bool = False


def _compute_ml_anomaly_score(
    quantity: int,
    unit_price: float,
    purchase_velocity: int,
    name_risk: float,
    card_risk: float
) -> tuple[float, bool]:
    """Score transaction through IsolationForest model. Returns (risk_score_0_to_1, is_anomaly)."""
    if _ML_MODEL_BUNDLE is None:
        # Fallback estimation if model artifact is not loaded
        heuristic_score = min(1.0, (quantity / 15.0) * 0.4 + (purchase_velocity / 5.0) * 0.3 + name_risk * 0.3)
        return round(heuristic_score, 3), heuristic_score > 0.75

    try:
        model = _ML_MODEL_BUNDLE["model"]
        features = _ML_MODEL_BUNDLE.get("features", ["quantity", "unit_price", "total_amount", "purchase_velocity", "name_risk_score", "card_risk_score"])
        total_amount = quantity * unit_price
        import pandas as pd
        df_x = pd.DataFrame([[quantity, unit_price, total_amount, purchase_velocity, name_risk, card_risk]], columns=features)
        decision_score = float(model.decision_function(df_x)[0])  # negative is anomaly
        is_anomaly = bool(decision_score < 0.0)
        # Normalize decision score to [0.0, 1.0] risk probability
        normalized_risk = float(np.clip(0.5 - (decision_score * 2.0), 0.0, 1.0))
        return round(normalized_risk, 3), is_anomaly
    except Exception:
        return 0.1, False


def screen_booking(
    quantity: int,
    cardholder_name: str | None,
    card_number: str | None,
    unit_price: float = 50.0,
    purchase_velocity: int = 1
) -> FraudScreeningResult:
    # Feature calculations for ML scoring
    name_risk = 0.0
    if cardholder_name:
        lowered = cardholder_name.lower()
        if any(term in lowered for term in FLAGGED_NAME_SUBSTRINGS):
            name_risk = 1.0

    card_risk = 0.0
    digits_only = ""
    if card_number:
        digits_only = "".join(c for c in card_number if c.isdigit())
        if digits_only in KNOWN_TEST_CARD_NUMBERS:
            card_risk = 1.0

    ml_score, is_anomaly = _compute_ml_anomaly_score(
        quantity=quantity,
        unit_price=unit_price,
        purchase_velocity=purchase_velocity,
        name_risk=name_risk,
        card_risk=card_risk
    )

    # 1. Deterministic Rule Check: Bulk ticket quantity
    if quantity > BULK_QUANTITY_THRESHOLD:
        return FraudScreeningResult(
            allowed=False,
            reason=f"Bulk purchase of {quantity} tickets exceeds the {BULK_QUANTITY_THRESHOLD}-ticket threshold.",
            severity=FraudSeverity.medium,
            fraud_type="bulk_quantity",
            ml_risk_score=ml_score,
            is_ml_anomaly=True,
        )

    # 2. Deterministic Rule Check: Flagged cardholder names
    if cardholder_name and name_risk == 1.0:
        return FraudScreeningResult(
            allowed=False,
            reason=f"Cardholder name {cardholder_name!r} matches a flagged pattern.",
            severity=FraudSeverity.high,
            fraud_type="flagged_cardholder_name",
            ml_risk_score=ml_score,
            is_ml_anomaly=True,
        )

    # 3. Deterministic Rule Check: Known test card fingerprint
    if card_number and card_risk == 1.0:
        return FraudScreeningResult(
            allowed=False,
            reason="Card number matches a known test-card fingerprint.",
            severity=FraudSeverity.high,
            fraud_type="test_card_fingerprint",
            ml_risk_score=ml_score,
            is_ml_anomaly=True,
        )

    # 4. ML Anomaly Check: High anomaly confidence from Isolation Forest
    if is_anomaly and ml_score > 0.85:
        return FraudScreeningResult(
            allowed=False,
            reason=f"Transaction blocked by ML Anomaly Detection model (Risk Score: {ml_score:.2f}).",
            severity=FraudSeverity.high,
            fraud_type="ml_anomaly_detection",
            ml_risk_score=ml_score,
            is_ml_anomaly=True,
        )

    return FraudScreeningResult(
        allowed=True,
        ml_risk_score=ml_score,
        is_ml_anomaly=False
    )
