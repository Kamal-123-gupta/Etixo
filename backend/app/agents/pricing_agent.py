"""
pricing_agent.py — Dynamic Pricing & Promotion Agent.

Rule-based (per the README): reclassifies demand tier and adjusts price
from the fraction of tickets sold. Deliberately simple and auditable
rather than ML-driven, per the README's stated approach for this agent.

Invoked from two places:
  - Immediately after every successful booking (app/api/routers/bookings.py)
  - A manual/admin "reevaluate all" sweep (app/api/routers/agents.py),
    standing in for the frontend's setInterval tick, now moved server-side

Price locking (`lock_price`/`get_locked_price`) is kept in-process for this
prototype -- fine for a single dev/demo server, but NOT safe across
multiple worker processes or restarts. A production deployment should move
this to Redis (or a `price_locks` DB table) instead.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.models.enums import DemandTier

# Sold-fraction thresholds -> demand tier, checked highest-first.
_TIER_THRESHOLDS: list[tuple[float, DemandTier]] = [
    (0.85, DemandTier.surge),
    (0.60, DemandTier.high),
    (0.30, DemandTier.medium),
    (0.0, DemandTier.low),
]

# Price multiplier applied to base_price at each tier.
TIER_PRICE_MULTIPLIER: dict[DemandTier, float] = {
    DemandTier.low: 1.0,
    DemandTier.medium: 1.08,
    DemandTier.high: 1.18,
    DemandTier.surge: 1.35,
}

PRICE_LOCK_SECONDS = 600  # 10 minutes -- matches the price-lock countdown already simulated in the frontend


@dataclass
class PricingDecision:
    demand_tier: DemandTier
    new_price: float


def classify_demand(sold: int, total: int) -> DemandTier:
    if total <= 0:
        return DemandTier.low
    ratio = sold / total
    for threshold, tier in _TIER_THRESHOLDS:
        if ratio >= threshold:
            return tier
    return DemandTier.low


def evaluate_price(base_price: float, sold: int, total: int) -> PricingDecision:
    tier = classify_demand(sold, total)
    new_price = round(base_price * TIER_PRICE_MULTIPLIER[tier], 2)
    return PricingDecision(demand_tier=tier, new_price=new_price)


# --- Price locking (in-process; see module docstring for the production caveat) ---

_price_locks: dict[tuple[int, int], tuple[float, datetime]] = {}


def lock_price(event_id: int, user_id: int, price: float) -> datetime:
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=PRICE_LOCK_SECONDS)
    _price_locks[(event_id, user_id)] = (price, expires_at)
    return expires_at


def get_locked_price(event_id: int, user_id: int) -> float | None:
    entry = _price_locks.get((event_id, user_id))
    if entry is None:
        return None
    price, expires_at = entry
    if datetime.now(timezone.utc) > expires_at:
        del _price_locks[(event_id, user_id)]
        return None
    return price


def clear_price_lock(event_id: int, user_id: int) -> None:
    """Invalidates a lock after it's been used for a booking. Without this,
    a lock is reusable for unlimited separate bookings until it naturally
    expires (up to 10 minutes) -- confirmed via testing: a user could lock
    a price, buy tickets, have the price legitimately rise from their own
    purchase, then buy MORE tickets at the same stale locked price. A lock
    should cover one checkout, not a standing discount for the whole window."""
    _price_locks.pop((event_id, user_id), None)