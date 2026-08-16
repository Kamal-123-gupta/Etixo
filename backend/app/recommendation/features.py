"""
features.py — Feature engineering for the content-based recommendation engine.

Builds two things:
1. Event feature vectors: a numeric representation of each event (category
   one-hot, normalized price, normalized popularity) used as the "item
   profile" in content-based filtering.
2. User profile vectors: built from each user's interaction history
   (bookings weighted more than views, recent interactions weighted more
   than old ones) so the profile reflects revealed behavior, not just the
   user's self-declared preferred_categories. Declared preferences are
   used as a cold-start fallback for users with no history yet.

This module has no side effects (no file I/O) so it can be imported by
both the offline training/eval script and the online recommendation
service without duplicating logic.
"""

from dataclasses import dataclass

import numpy as np
import pandas as pd

# Interaction-type weights: a booking says a lot more about taste than a view
INTERACTION_WEIGHT = {"view": 1.0, "booking": 4.0}
RECENCY_HALF_LIFE_DAYS = 30.0  # interactions older than this count for ~half


@dataclass
class FeatureSpace:
    """Holds the fitted vocab/scaling needed to turn raw events into vectors."""
    categories: list[str]
    price_min: float
    price_max: float
    popularity_min: float
    popularity_max: float

    @classmethod
    def fit(cls, events: pd.DataFrame) -> "FeatureSpace":
        return cls(
            categories=sorted(events["category"].dropna().unique().tolist()),
            price_min=float(events["price_estimated"].min()),
            price_max=float(events["price_estimated"].max()),
            popularity_min=float(events["event_popularity_score"].min()),
            popularity_max=float(events["event_popularity_score"].max()),
        )

    def _norm(self, value: float, lo: float, hi: float) -> float:
        if hi == lo:
            return 0.5
        return float(np.clip((value - lo) / (hi - lo), 0.0, 1.0))

    def event_vector(self, event: pd.Series) -> np.ndarray:
        """[one-hot category] + [normalized price] + [normalized popularity]"""
        cat_vec = np.zeros(len(self.categories))
        if event["category"] in self.categories:
            cat_vec[self.categories.index(event["category"])] = 1.0
        price_n = self._norm(event["price_estimated"], self.price_min, self.price_max)
        pop_n = self._norm(event["event_popularity_score"], self.popularity_min, self.popularity_max)
        return np.concatenate([cat_vec, [price_n, pop_n]])

    def event_matrix(self, events: pd.DataFrame) -> np.ndarray:
        return np.vstack([self.event_vector(row) for _, row in events.iterrows()])

    @property
    def vector_dim(self) -> int:
        return len(self.categories) + 2


def build_event_vectors(events: pd.DataFrame, space: FeatureSpace) -> dict[int, np.ndarray]:
    return {row["event_id"]: space.event_vector(row) for _, row in events.iterrows()}


def build_user_profiles(
    users: pd.DataFrame,
    events: pd.DataFrame,
    interactions: pd.DataFrame,
    space: FeatureSpace,
) -> dict[int, np.ndarray]:
    """
    One profile vector per user, in the SAME feature space as events, so a
    user profile can be compared directly to any event vector via cosine
    similarity.

    Profile = recency- and interaction-type-weighted average of the event
    vectors the user has interacted with. Falls back to a synthetic vector
    built from declared `preferred_categories` + median price/popularity
    for users with no interaction history (cold start).
    """
    event_vectors = build_event_vectors(events, space)
    profiles: dict[int, np.ndarray] = {}

    interactions = interactions.copy()
    interactions["weight"] = (
        interactions["interaction_type"].map(INTERACTION_WEIGHT)
        * np.exp(-interactions["day_offset"] / RECENCY_HALF_LIFE_DAYS)
    )

    grouped = interactions.groupby("user_id")

    for _, user in users.iterrows():
        uid = user["user_id"]

        # declared-preference vector -- always computed, used as either the
        # cold-start profile OR blended into the behavioral profile below
        declared_vec = np.zeros(len(space.categories))
        prefs = str(user["preferred_categories"]).split("|")
        for c in prefs:
            if c in space.categories:
                declared_vec[space.categories.index(c)] = 1.0 / len(prefs)
        declared_vec = np.concatenate([declared_vec, [0.5, 0.5]])

        if uid in grouped.groups:
            rows = grouped.get_group(uid)
            vecs, weights = [], []
            for _, r in rows.iterrows():
                vec = event_vectors.get(r["event_id"])
                if vec is not None:
                    vecs.append(vec)
                    weights.append(r["weight"])
            if vecs:
                behavioral_vec = np.average(np.vstack(vecs), axis=0, weights=weights)
                # Blend rather than fully trust behavior: declared preference
                # acts as a prior/regularizer. Ramps up slowly -- a handful
                # of interactions (some of which may be off-preference noise,
                # e.g. a niche-category user who simply hasn't had many
                # niche-category events shown to them yet) shouldn't be
                # enough to override a clearly stated declared preference.
                n_obs = len(vecs)
                behavior_weight = min(0.7, 0.15 + 0.03 * n_obs)  # ramps slowly, caps at 0.7
                profiles[uid] = (
                    behavior_weight * behavioral_vec + (1 - behavior_weight) * declared_vec
                )
                continue

        # cold-start fallback: no history at all -> declared preferences only
        profiles[uid] = declared_vec

    return profiles
