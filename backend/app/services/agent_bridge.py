"""
agent_bridge.py — Adapts DB-backed data into the pandas DataFrame shapes
that app/agents/discovery_agent.py, app/agents/personalization_agent.py,
and app/recommendation/{features,model}.py already expect.

Those modules were built and tested against the Kaggle CSV exports
(events_clean.csv / users_synthetic.csv / interactions_synthetic.csv) and
deliberately were NOT rewritten here — this bridge exists so the *same*,
already-tested agent code can run against the live `events`/`users`/
`bookings` tables instead, with the column-renaming/reshaping isolated to
one place.

Booking rows are used to synthesize an "interactions" DataFrame (all typed
"booking"). A separate `view`-event interaction log doesn't exist yet — that
is intentionally left for the Personalization Agent's future work, when the
frontend starts sending view events to the API rather than only tracking
them client-side in AppContext.
"""

from datetime import datetime, timezone

import pandas as pd
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.event import Event
from app.models.user import Preference, User


def events_dataframe(db: Session) -> pd.DataFrame:
    # Only upcoming (or undated) events are candidates for search/
    # recommendation results -- there's no legitimate reason to surface a
    # past event for someone trying to find something to book. Past events
    # are never deleted (see Event.status), so this is purely a filter on
    # what these two agents consider, not a statement about what exists.
    now = datetime.now(timezone.utc)
    rows = (
        db.query(Event)
        .filter((Event.event_datetime.is_(None)) | (Event.event_datetime >= now))
        .all()
    )
    if not rows:
        return pd.DataFrame(
            columns=[
                "event_id", "name", "category", "venue_city", "venue_state",
                "price_estimated", "event_popularity_score", "primary_performer_name",
            ]
        )
    return pd.DataFrame(
        [
            {
                "event_id": e.id,
                "name": e.title,
                "category": e.category,
                "venue_city": e.venue_city or "",
                "venue_state": e.venue_state or "",
                "price_estimated": e.current_price or e.base_price or 0.0,
                "event_popularity_score": e.popularity_score if e.popularity_score is not None else 0.0,
                "primary_performer_name": e.primary_performer_name or "",
            }
            for e in rows
        ]
    )


def users_dataframe(db: Session) -> pd.DataFrame:
    rows = db.query(User).join(Preference, isouter=True).all()
    return pd.DataFrame(
        [
            {
                "user_id": u.id,
                "name": u.name,
                "home_city": u.home_city or "",
                "home_state": u.home_state or "",
                "preferred_categories": "|".join(u.preference.category_list) if u.preference else "",
                "budget_max": (u.preference.budget_max if u.preference and u.preference.budget_max else 99999.0),
            }
            for u in rows
        ]
    )


def interactions_dataframe(db: Session) -> pd.DataFrame:
    rows = db.query(Booking).all()
    now = datetime.now(timezone.utc)
    records = []
    for b in rows:
        created = b.created_at if b.created_at.tzinfo else b.created_at.replace(tzinfo=timezone.utc)
        day_offset = max((now - created).days, 0)
        records.append(
            {
                "user_id": b.user_id,
                "event_id": b.event_id,
                "interaction_type": "booking",
                "day_offset": day_offset,
                "quantity": b.quantity,
            }
        )
    return pd.DataFrame(records, columns=["user_id", "event_id", "interaction_type", "day_offset", "quantity"])