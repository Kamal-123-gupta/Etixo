"""
organizer_intelligence_agent.py — Organizer Intelligence Agent.

Direct execution (per the README): computes sales velocity per event and
attaches a rule-based recommendation string, layered on top of the raw
revenue/tickets-sold aggregation already exposed by
GET /organizer/insights. Kept rule-based rather than a trained model, in
line with every other agent in this codebase staying simple/auditable
until there's a real dataset to fit a model against.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.event import Event

RECENT_WINDOW_DAYS = 7


@dataclass
class EventIntelligence:
    velocity_last_7_days: int  # tickets sold in the recent window
    recommendation: str


def analyze_event(db: Session, event: Event) -> EventIntelligence:
    cutoff = datetime.now(timezone.utc) - timedelta(days=RECENT_WINDOW_DAYS)
    recent_qty = (
        db.query(Booking)
        .filter(Booking.event_id == event.id, Booking.created_at >= cutoff)
        .with_entities(Booking.quantity)
        .all()
    )
    velocity = sum(q[0] for q in recent_qty)

    sold_ratio = (event.tickets_sold / event.total_tickets) if event.total_tickets else 0.0

    if sold_ratio >= 0.85:
        recommendation = "Selling fast — consider raising price further or releasing additional inventory."
    elif sold_ratio >= 0.5:
        recommendation = "Healthy sales pace — no action needed, keep monitoring demand tier."
    elif velocity == 0 and sold_ratio < 0.3:
        recommendation = "Sales have stalled — consider launching a marketing campaign to boost visibility."
    else:
        recommendation = "Steady sales pace — a marketing push could accelerate momentum."

    return EventIntelligence(velocity_last_7_days=velocity, recommendation=recommendation)
