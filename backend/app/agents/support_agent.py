"""
support_agent.py — Customer Support Agent.

Rule-based intent classification (refunds/cancellations, ticket/QR
questions, dynamic-pricing explanations, fraud-block explanations,
escalation) with context pulled from the user's actual bookings where
relevant. Anything that doesn't match a known intent falls back to the
pluggable LLM client (app/llm/client.py), matching the README's stated
"Rule-based -> LLM (planned)" approach -- brought forward here since the
LLM client already exists for the other GenAI agents, with a template
fallback if no LLM provider is configured.
"""

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.llm.client import LLMUnavailable, generate
from app.models.booking import Booking
from app.models.user import User

ESCALATION_TRIGGERS = {"escalate", "human", "operator", "speak to a person", "speak to someone"}
REFUND_TRIGGERS = {"refund", "cancel", "cancellation", "money back"}
QR_TRIGGERS = {"qr", "ticket", "check in", "check-in", "scan"}
PRICING_TRIGGERS = {"price", "pricing", "cost", "expensive", "surge", "went up"}
FRAUD_TRIGGERS = {"fraud", "blocked", "denied", "declined", "flagged"}

SYSTEM_PROMPT = (
    "You are a friendly customer support agent for a live-events ticket "
    "booking platform. Answer the user's question in 2-4 sentences. If you "
    "don't have enough information, ask them to share their booking "
    "reference or suggest they type 'escalate' to reach a human agent."
)


@dataclass
class SupportReply:
    reply: str
    escalated: bool
    intent: str


def _matches(text: str, triggers: set[str]) -> bool:
    lowered = text.lower()
    return any(t in lowered for t in triggers)


def handle_message(db: Session, user: User, text: str) -> SupportReply:
    if _matches(text, ESCALATION_TRIGGERS):
        return SupportReply(
            reply="Connecting you with a human support agent — someone will follow up shortly.",
            escalated=True,
            intent="escalation",
        )

    if _matches(text, REFUND_TRIGGERS):
        booking_count = db.query(Booking).filter(Booking.user_id == user.id).count()
        reply = (
            f"You have {booking_count} booking(s) on file. Refunds are available up to 48 hours "
            "before an event — reply with your booking reference and I can start that for you, "
            "or type 'escalate' to speak with a human agent."
        )
        return SupportReply(reply=reply, escalated=False, intent="refund")

    if _matches(text, QR_TRIGGERS):
        reply = (
            "Your QR ticket is generated automatically right after checkout and is available on "
            "your bookings page. It activates for scanning at the venue on the day of the event."
        )
        return SupportReply(reply=reply, escalated=False, intent="qr")

    if _matches(text, PRICING_TRIGGERS):
        reply = (
            "Ticket prices adjust automatically as demand rises, similar to airline pricing — "
            "the more of an event sells out, the higher the price tier. Locking in a price early "
            "avoids paying the surge rate later."
        )
        return SupportReply(reply=reply, escalated=False, intent="pricing_explanation")

    if _matches(text, FRAUD_TRIGGERS):
        reply = (
            "Bookings can be automatically blocked by our fraud detection system if they look "
            "like bulk resale activity or use flagged payment details. If you believe this was a "
            "mistake, type 'escalate' and a human agent will review it."
        )
        return SupportReply(reply=reply, escalated=False, intent="fraud_explanation")

    try:
        reply = generate(SYSTEM_PROMPT, text, max_tokens=300)
        return SupportReply(reply=reply, escalated=False, intent="llm_general")
    except LLMUnavailable:
        reply = (
            "Thanks for reaching out — I can help with refunds, ticket/QR questions, pricing "
            "changes, or fraud-block explanations. Could you tell me a bit more, or type "
            "'escalate' to reach a human agent?"
        )
        return SupportReply(reply=reply, escalated=False, intent="fallback")
