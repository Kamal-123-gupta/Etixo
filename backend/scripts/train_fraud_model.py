"""
train_fraud_model.py — Train an unsupervised Isolation Forest model
for the Fraud Detection Agent.

Extracts tabular booking features from synthetic/historical transaction records:
- quantity: number of tickets purchased
- unit_price: price per ticket
- total_amount: quantity * unit_price
- purchase_velocity: transaction attempts within time window
- name_risk_score: heuristic score based on cardholder name patterns
- card_risk_score: card test fingerprint indicator

Trained model is serialized to `app/models/fraud_model.joblib`.
"""

import os
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib

MODEL_DIR = Path(__file__).resolve().parent.parent / "app" / "models"
MODEL_PATH = MODEL_DIR / "fraud_model.joblib"


def generate_training_data(n_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    """Generate realistic transaction feature vectors representing legitimate
    and fraudulent booking attempts."""
    rng = np.random.default_rng(seed)

    # 96% legitimate transactions
    n_legit = int(n_samples * 0.96)
    legit_quantity = rng.choice([1, 2, 3, 4, 5, 6], size=n_legit, p=[0.45, 0.35, 0.10, 0.05, 0.03, 0.02])
    legit_price = rng.uniform(25.0, 350.0, size=n_legit)
    legit_total = legit_quantity * legit_price
    legit_velocity = rng.choice([1, 2, 3], size=n_legit, p=[0.85, 0.12, 0.03])
    legit_name_risk = rng.choice([0.0, 0.05], size=n_legit, p=[0.95, 0.05])
    legit_card_risk = np.zeros(n_legit)

    legit_df = pd.DataFrame({
        "quantity": legit_quantity,
        "unit_price": legit_price,
        "total_amount": legit_total,
        "purchase_velocity": legit_velocity,
        "name_risk_score": legit_name_risk,
        "card_risk_score": legit_card_risk,
        "is_fraud": 0
    })

    # 4% fraudulent / anomalous transactions
    n_fraud = n_samples - n_legit
    fraud_quantity = rng.choice([10, 15, 20, 25, 30], size=n_fraud)
    fraud_price = rng.uniform(50.0, 500.0, size=n_fraud)
    fraud_total = fraud_quantity * fraud_price
    fraud_velocity = rng.choice([4, 6, 8, 12], size=n_fraud)
    fraud_name_risk = rng.choice([0.5, 0.9, 1.0], size=n_fraud)
    fraud_card_risk = rng.choice([0.0, 1.0], size=n_fraud, p=[0.4, 0.6])

    fraud_df = pd.DataFrame({
        "quantity": fraud_quantity,
        "unit_price": fraud_price,
        "total_amount": fraud_total,
        "purchase_velocity": fraud_velocity,
        "name_risk_score": fraud_name_risk,
        "card_risk_score": fraud_card_risk,
        "is_fraud": 1
    })

    df = pd.concat([legit_df, fraud_df], ignore_index=True)
    return df.sample(frac=1.0, random_state=seed).reset_index(drop=True)


def train_and_save_model() -> Path:
    df = generate_training_data(n_samples=5000)
    features = ["quantity", "unit_price", "total_amount", "purchase_velocity", "name_risk_score", "card_risk_score"]
    X = df[features]

    # Contamination set to roughly match expected anomaly fraction (~4%)
    iso_forest = IsolationForest(
        n_estimators=100,
        max_samples="auto",
        contamination=0.04,
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X)

    # Evaluate anomaly scores
    scores = iso_forest.decision_function(X)
    preds = iso_forest.predict(X)  # -1 is anomaly, 1 is normal
    anomalies_detected = (preds == -1).sum()

    print(f"Model trained successfully on {len(X)} transaction records.")
    print(f"Features: {features}")
    print(f"Anomalies flagged: {anomalies_detected} ({anomalies_detected / len(X):.2%})")
    print(f"Mean decision score: {scores.mean():.4f} (min={scores.min():.4f}, max={scores.max():.4f})")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({
        "model": iso_forest,
        "features": features,
        "threshold": 0.0  # decision_function < 0 indicates anomaly
    }, MODEL_PATH)

    print(f"Saved model artifact to: {MODEL_PATH}")
    return MODEL_PATH


if __name__ == "__main__":
    train_and_save_model()
