
import json
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd

from app.recommendation.features import FeatureSpace, build_event_vectors

LEARNING_RATE = {"view": 0.05, "booking": 0.25}
DECLARED_PREF_UPDATE_WEIGHT = 0.4


class PersonalizationAgent:
    def __init__(self, events: pd.DataFrame, space: FeatureSpace | None = None):
        self.events = events
        self.space = space or FeatureSpace.fit(events)
        self.event_vectors = build_event_vectors(events, self.space)
        self.profiles: dict[int, np.ndarray] = {}
        self.declared_prefs: dict[int, list[str]] = {}

    def bootstrap_from_history(self, users: pd.DataFrame, interactions: pd.DataFrame) -> None:
        from app.recommendation.features import build_user_profiles
        profiles = build_user_profiles(users, self.events, interactions, self.space)
        self.profiles.update(profiles)
        for _, u in users.iterrows():
            self.declared_prefs[u["user_id"]] = str(u["preferred_categories"]).split("|")

    def _declared_vector(self, user_id: int) -> np.ndarray:
        cats = self.declared_prefs.get(user_id, [])
        vec = np.zeros(len(self.space.categories))
        for c in cats:
            if c in self.space.categories:
                vec[self.space.categories.index(c)] = 1.0 / max(len(cats), 1)
        return np.concatenate([vec, [0.5, 0.5]])

    def _ensure_profile(self, user_id: int) -> np.ndarray:
        """Cold start for a brand-new user with no bootstrap history at all."""
        if user_id not in self.profiles:
            self.profiles[user_id] = self._declared_vector(user_id)
        return self.profiles[user_id]

 
    def _nudge(self, user_id: int, event_id: int, interaction_type: str) -> None:
        event_vec = self.event_vectors.get(event_id)
        if event_vec is None:
            return  # unknown event -- nothing to learn from
        profile = self._ensure_profile(user_id)
        lr = LEARNING_RATE[interaction_type]
        self.profiles[user_id] = (1 - lr) * profile + lr * event_vec

    def record_view(self, user_id: int, event_id: int) -> None:
        self._nudge(user_id, event_id, "view")

    def record_booking(self, user_id: int, event_id: int, quantity: int = 1) -> None:
        # a booking of more tickets is a slightly stronger signal, but capped
        # so a single large group booking doesn't overwhelm the profile
        lr = min(LEARNING_RATE["booking"] * (1 + 0.1 * (quantity - 1)), 0.5)
        event_vec = self.event_vectors.get(event_id)
        if event_vec is None:
            return
        profile = self._ensure_profile(user_id)
        self.profiles[user_id] = (1 - lr) * profile + lr * event_vec

    def update_declared_preferences(self, user_id: int, categories: list[str]) -> None:
        """User explicitly changes their preference toggles in the UI."""
        self.declared_prefs[user_id] = categories
        declared_vec = self._declared_vector(user_id)
        current = self._ensure_profile(user_id)
        self.profiles[user_id] = (
            (1 - DECLARED_PREF_UPDATE_WEIGHT) * current
            + DECLARED_PREF_UPDATE_WEIGHT * declared_vec
        )

    # ------------------------------------------------------------------ #
    # Read access
    # ------------------------------------------------------------------ #
    def get_profile(self, user_id: int) -> np.ndarray:
        return self._ensure_profile(user_id)

    def top_categories(self, user_id: int, n: int = 3) -> list[tuple[str, float]]:
        profile = self.get_profile(user_id)
        cat_weights = list(zip(self.space.categories, profile[: len(self.space.categories)]))
        return sorted(cat_weights, key=lambda x: x[1], reverse=True)[:n]

   
    # Persistence -- stands in for the real `preferences` DB table until
    # the backend/DB layer exists. Swap these two methods for real DB
    # reads/writes later; every other method above stays unchanged.
 
    def save(self, path: Path) -> None:
        payload = {
            "profiles": {str(uid): vec.tolist() for uid, vec in self.profiles.items()},
            "declared_prefs": {str(uid): prefs for uid, prefs in self.declared_prefs.items()},
            "categories": self.space.categories,
        }
        path.write_text(json.dumps(payload))

    def load(self, path: Path) -> None:
        payload = json.loads(path.read_text())
        self.profiles = {int(uid): np.array(vec) for uid, vec in payload["profiles"].items()}
        self.declared_prefs = {int(uid): prefs for uid, prefs in payload["declared_prefs"].items()}


if __name__ == "__main__":
    DATA_DIR = Path(r"D:\use_Case2\data\processed")
    events = pd.read_csv(DATA_DIR / "events_clean.csv")
    users = pd.read_csv(DATA_DIR / "users_synthetic.csv")
    interactions = pd.read_csv(DATA_DIR / "interactions_synthetic.csv")

    agent = PersonalizationAgent(events=events)
    agent.bootstrap_from_history(users, interactions)

  
    football_fans = users[users["preferred_categories"].str.contains("football")]
    test_user = int(football_fans.iloc[0]["user_id"])
    print(f"User {test_user} declared prefs: {agent.declared_prefs[test_user]}")
    print(f"Initial top categories: {agent.top_categories(test_user)}")

    hockey_events = events[events["category"] == "hockey"]["event_id"].tolist()[:6]
    for i, eid in enumerate(hockey_events):
        agent.record_view(test_user, eid)
        if i % 2 == 0:
            agent.record_booking(test_user, eid, quantity=2)
        print(f"After interaction {i+1} (hockey event {eid}): "
              f"top categories = {agent.top_categories(test_user)}")

    print("\nNow simulating an explicit preference-toggle change to basketball...")
    agent.update_declared_preferences(test_user, ["basketball"])
    print(f"Top categories after declared-preference change: {agent.top_categories(test_user)}")

    out_path = DATA_DIR / "personalization_state_demo.json"
    agent.save(out_path)
    print(f"\nPersisted profile state -> {out_path}")
