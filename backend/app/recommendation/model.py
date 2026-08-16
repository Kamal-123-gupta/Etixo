"""
model.py — Baseline content-based recommender.

Ranks candidate events for a user by cosine similarity between the user's
profile vector (see features.py) and each event's feature vector, then
applies a hard budget filter and an optional location boost.

This is deliberately the SIMPLE baseline called out in the 6-week plan
("baseline content-based recommendation model" — Week 2), not the richer
behavioral model planned for Week 3. Keep this class's public interface
(`recommend`) stable — the Week 3 upgrade should be a drop-in replacement
or subclass, not a breaking change to the API contract the backend/frontend
will integrate against.
"""

from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from app.recommendation.features import FeatureSpace, build_event_vectors, build_user_profiles

BUDGET_SLACK = 1.15          # allow events up to 15% over budget_max before excluding
LOCATION_BOOST = {"city": 1.15, "state": 1.05, "other": 1.0}


def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


@dataclass
class ContentBasedRecommender:
    events: pd.DataFrame
    users: pd.DataFrame
    interactions: pd.DataFrame
    space: FeatureSpace = field(init=False)
    event_vectors: dict = field(init=False)
    user_profiles: dict = field(init=False)
    seen_by_user: dict = field(init=False)

    def __post_init__(self):
        self.space = FeatureSpace.fit(self.events)
        self.event_vectors = build_event_vectors(self.events, self.space)
        self.user_profiles = build_user_profiles(
            self.users, self.events, self.interactions, self.space
        )
        self.seen_by_user = (
            self.interactions.groupby("user_id")["event_id"].apply(set).to_dict()
        )

    def _location_multiplier(self, user_row: pd.Series, event_row: pd.Series) -> float:
        if event_row["venue_city"] == user_row["home_city"]:
            return LOCATION_BOOST["city"]
        if event_row["venue_state"] == user_row["home_state"]:
            return LOCATION_BOOST["state"]
        return LOCATION_BOOST["other"]

    def recommend(self, user_id: int, top_n: int = 10, exclude_seen: bool = True) -> pd.DataFrame:
        if user_id not in self.user_profiles:
            raise ValueError(f"Unknown user_id: {user_id}")

        user_row = self.users.loc[self.users["user_id"] == user_id].iloc[0]
        profile = self.user_profiles[user_id]
        seen = self.seen_by_user.get(user_id, set()) if exclude_seen else set()

        candidates = self.events[~self.events["event_id"].isin(seen)].copy()
        # hard budget filter -- don't recommend things well outside what the user can pay
        candidates = candidates[
            candidates["price_estimated"] <= user_row["budget_max"] * BUDGET_SLACK
        ]

        scores = []
        for _, ev in candidates.iterrows():
            sim = cosine_sim(profile, self.event_vectors[ev["event_id"]])
            sim *= self._location_multiplier(user_row, ev)
            scores.append(sim)

        candidates = candidates.assign(score=scores)
        return (
            candidates.sort_values("score", ascending=False)
            .head(top_n)[["event_id", "name", "category", "venue_city",
                           "price_estimated", "event_popularity_score", "score"]]
            .reset_index(drop=True)
        )


if __name__ == "__main__":
    from pathlib import Path

    DATA_DIR = Path("/home/claude/work/recsys/data")
    events = pd.read_csv(DATA_DIR / "events_clean.csv")
    users = pd.read_csv(DATA_DIR / "users_synthetic.csv")
    interactions = pd.read_csv(DATA_DIR / "interactions_synthetic.csv")

    rec = ContentBasedRecommender(events=events, users=users, interactions=interactions)

    sample_user = users.iloc[0]
    print(f"Recommendations for user {sample_user['user_id']} "
          f"({sample_user['name']}, prefers {sample_user['preferred_categories']}, "
          f"budget ${sample_user['budget_max']:.0f}, home {sample_user['home_city']}, {sample_user['home_state']}):\n")
    print(rec.recommend(sample_user["user_id"], top_n=10).to_string(index=False))
