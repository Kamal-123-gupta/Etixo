"""
Phase 1 — Step 3: Generate synthetic interactions (views + bookings).

This is the most important synthetic table: it's the "ground truth" the
recommender will be trained/evaluated against. Interactions are NOT random —
each user's likelihood of viewing/booking an event is biased by:
  - category match (preferred_categories)
  - price fit (event price vs. user's budget_max)
  - location proximity (same city > same state > other)
  - event popularity (popular events get more organic traffic regardless
    of personal fit, same as real platforms)

This gives the baseline content-based model something real to learn and be
evaluated against, instead of pure noise.
"""

import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path("/home/claude/work/recsys/data")
RNG = np.random.default_rng(99)

VIEWS_PER_USER = (3, 15)      # min, max candidate events "shown" per user
BOOKING_CONVERSION_SCALE = 4.0  # higher -> fewer, more decisive bookings


def affinity_score(user, event) -> float:
    """0-1ish raw affinity of a user toward one event. Higher = more likely
    to view AND, if viewed, to book."""
    prefs = set(user["preferred_categories"].split("|"))
    category_match = 1.0 if event["category"] in prefs else 0.15

    price = event["price_estimated"]
    budget = user["budget_max"]
    if price <= budget:
        price_fit = 1.0
    else:
        # soft falloff above budget rather than a hard cutoff
        price_fit = max(0.05, 1.0 - (price - budget) / budget)

    same_city = event["venue_city"] == user["home_city"]
    same_state = event["venue_state"] == user["home_state"]
    location_fit = 1.0 if same_city else (0.55 if same_state else 0.20)

    popularity = event["event_popularity_score"]  # already 0-1

    score = (
        0.40 * category_match
        + 0.25 * price_fit
        + 0.20 * location_fit
        + 0.15 * popularity
    )
    return score


def generate_interactions(users: pd.DataFrame, events: pd.DataFrame) -> pd.DataFrame:
    rows = []
    interaction_id = 1

    for _, user in users.iterrows():
        n_candidates = int(RNG.integers(*VIEWS_PER_USER))
        # candidate pool: weighted sample so higher-affinity events are more
        # likely to be "shown", mirroring a recs surface feeding the user
        # events it thinks they'll like -- plus a little exploration noise
        sample_pool = events.sample(min(len(events), n_candidates * 4), random_state=int(RNG.integers(1e9)))
        scores = sample_pool.apply(lambda ev: affinity_score(user, ev), axis=1)
        probs = (scores + 0.05) / (scores + 0.05).sum()
        chosen = sample_pool.sample(
            n=min(n_candidates, len(sample_pool)),
            weights=probs,
            random_state=int(RNG.integers(1e9)),
        )

        for _, event in chosen.iterrows():
            aff = affinity_score(user, event)
            rows.append({
                "interaction_id": interaction_id,
                "user_id": user["user_id"],
                "event_id": event["event_id"],
                "interaction_type": "view",
                "day_offset": int(RNG.integers(0, 60)),  # days before "today"
            })
            interaction_id += 1

            # conversion to booking: sigmoid-ish, driven by affinity
            book_prob = 1 / (1 + np.exp(-BOOKING_CONVERSION_SCALE * (aff - 0.55)))
            if RNG.random() < book_prob:
                rows.append({
                    "interaction_id": interaction_id,
                    "user_id": user["user_id"],
                    "event_id": event["event_id"],
                    "interaction_type": "booking",
                    "day_offset": int(RNG.integers(0, 60)),
                    "quantity": int(RNG.choice([1, 2, 2, 3, 4], p=[0.35, 0.30, 0.0, 0.20, 0.15])),
                })
                interaction_id += 1

    df = pd.DataFrame(rows)
    return df


if __name__ == "__main__":
    users = pd.read_csv(DATA_DIR / "users_synthetic.csv")
    events = pd.read_csv(DATA_DIR / "events_clean.csv")

    interactions = generate_interactions(users, events)
    out_path = DATA_DIR / "interactions_synthetic.csv"
    interactions.to_csv(out_path, index=False)

    print(f"Wrote {len(interactions)} interactions -> {out_path}")
    print(interactions["interaction_type"].value_counts())
    print(f"\nAvg views/user: {len(interactions[interactions.interaction_type=='view']) / len(users):.1f}")
    print(f"Avg bookings/user: {len(interactions[interactions.interaction_type=='booking']) / len(users):.1f}")

    # sanity check: do booked events skew toward the user's preferred category?
    merged = interactions.merge(users[["user_id", "preferred_categories"]], on="user_id")
    merged = merged.merge(events[["event_id", "category"]], on="event_id")
    merged["is_preferred"] = merged.apply(
        lambda r: r["category"] in r["preferred_categories"].split("|"), axis=1
    )
    print("\nShare of interactions matching user's preferred category, by type:")
    print(merged.groupby("interaction_type")["is_preferred"].mean().round(3))
