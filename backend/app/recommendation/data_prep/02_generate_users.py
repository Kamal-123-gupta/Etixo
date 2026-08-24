"""
Phase 1 — Step 2: Generate synthetic users.

There is no user data anywhere in the source dataset (it's 100% supply-side:
events/listings/performers/venues), so users are fully synthetic. They are
built FROM the real events table so their preferences/locations/budgets are
grounded in what's actually in the catalog (real categories, real cities,
real price range) rather than made up in a vacuum.
"""

import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path("/home/claude/work/recsys/data")
RNG = np.random.default_rng(7)

N_USERS = 500

FIRST_NAMES = ["Aarav", "Vivaan", "Diya", "Ananya", "Rohan", "Kabir", "Meera",
               "Ishaan", "Priya", "Arjun", "Sara", "Neel", "Zoya", "Kunal",
               "Alex", "Jordan", "Taylor", "Sam", "Riley", "Morgan"]
LAST_NAMES = ["Sharma", "Verma", "Gupta", "Iyer", "Khan", "Patel", "Nair",
              "Reddy", "Chopra", "Smith", "Johnson", "Brown", "Garcia", "Lee"]


def load_events() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "events_clean.csv")


def generate_users(events: pd.DataFrame, n_users: int = N_USERS) -> pd.DataFrame:
    categories = events["category"].dropna().unique().tolist()
    # weight city choice by how many events are actually near that city,
    # so "home city" distribution roughly mirrors catalog density
    city_state = (events[["venue_city", "venue_state", "venue_country"]]
                  .dropna().drop_duplicates())
    city_weights = (events.groupby(["venue_city", "venue_state"])
                     .size().rename("n_events").reset_index())
    city_weights = city_weights.merge(city_state, on=["venue_city", "venue_state"], how="left")
    city_weights["w"] = city_weights["n_events"] / city_weights["n_events"].sum()

    price_lo, price_hi = events["price_estimated"].quantile([0.05, 0.95])

    rows = []
    for uid in range(1, n_users + 1):
        # 1-3 preferred categories per user, weighted so single-category
        # "superfans" are more common than broad generalists (realistic)
        n_pref = RNG.choice([1, 2, 3], p=[0.55, 0.35, 0.10])
        prefs = RNG.choice(categories, size=min(n_pref, len(categories)), replace=False)

        city_row = city_weights.sample(1, weights=city_weights["w"], random_state=int(RNG.integers(1e9))).iloc[0]

        # budget ceiling: log-normal-ish spread around the catalog's real price range
        budget = float(np.clip(RNG.normal(loc=(price_lo + price_hi) / 2, scale=(price_hi - price_lo) / 3),
                                price_lo * 0.6, price_hi * 1.8))

        rows.append({
            "user_id": uid,
            "name": f"{RNG.choice(FIRST_NAMES)} {RNG.choice(LAST_NAMES)}",
            "home_city": city_row["venue_city"],
            "home_state": city_row["venue_state"],
            "home_country": city_row["venue_country"],
            "preferred_categories": "|".join(prefs),
            "budget_max": round(budget, 2),
            "signup_days_ago": int(RNG.integers(1, 365)),
        })

    return pd.DataFrame(rows)


if __name__ == "__main__":
    events = load_events()
    users = generate_users(events)
    out_path = DATA_DIR / "users_synthetic.csv"
    users.to_csv(out_path, index=False)
    print(f"Wrote {len(users)} users -> {out_path}")
    print(users.head(8).to_string(index=False))
    print("\nPreferred-category distribution (first choice):")
    print(users["preferred_categories"].str.split("|").str[0].value_counts())
