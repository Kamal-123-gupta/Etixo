"""
fraud_agent.py — Fraud Detection Agent.

Rule-based (per the README): screens every booking attempt before it's
confirmed. Three checks, in the order named in the root README's Agent
Workflow section -- bulk ticket quantity, flagged/test cardholder names,
and known test-card fingerprints. A production version would layer a
trained anomaly-detection model on top of these rules (see the README's
Future Improvements); this stays intentionally simple and auditable.
"""

from dataclasses import dataclass

from app.models.enums import FraudSeverity

BULK_QUANTITY_THRESHOLD = 10

FLAGGED_NAME_SUBSTRINGS = {"test", "fraud", "scam", "hacker", "fake"}

# Well-known PUBLIC test-card numbers (Stripe/industry-standard test
# fixtures, never real cardholder data) -- used as a denylist fingerprint,
# matching the README's "known test-card fingerprints" rule.
KNOWN_TEST_CARD_NUMBERS = {
    "4111111111111111",
    "4242424242424242",
    "4000000000000002",
    "5555555555554444",
    "378282246310005",
}


@dataclass
class FraudScreeningResult:
    allowed: bool
    reason: str | None = None
    severity: FraudSeverity | None = None
    fraud_type: str | None = None


def screen_booking(
    quantity: int, cardholder_name: str | None, card_number: str | None
) -> FraudScreeningResult:
    if quantity > BULK_QUANTITY_THRESHOLD:
        return FraudScreeningResult(
            allowed=False,
            reason=f"Bulk purchase of {quantity} tickets exceeds the {BULK_QUANTITY_THRESHOLD}-ticket threshold.",
            severity=FraudSeverity.medium,
            fraud_type="bulk_quantity",
        )

    if cardholder_name:
        lowered = cardholder_name.lower()
        if any(term in lowered for term in FLAGGED_NAME_SUBSTRINGS):
            return FraudScreeningResult(
                allowed=False,
                reason=f"Cardholder name {cardholder_name!r} matches a flagged pattern.",
                severity=FraudSeverity.high,
                fraud_type="flagged_cardholder_name",
            )

    if card_number:
        digits_only = "".join(c for c in card_number if c.isdigit())
        if digits_only in KNOWN_TEST_CARD_NUMBERS:
            return FraudScreeningResult(
                allowed=False,
                reason="Card number matches a known test-card fingerprint.",
                severity=FraudSeverity.high,
                fraud_type="test_card_fingerprint",
            )

    return FraudScreeningResult(allowed=True)
