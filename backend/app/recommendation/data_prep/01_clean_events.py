
import numpy as np
import pandas as pd
from pathlib import Path

RAW_DIR = Path(r"D:\use_Case2\data\raw")
OUT_DIR = Path(r"D:\use_Case2\data\processed")
OUT_DIR.mkdir(parents=True, exist_ok=True)

RNG = np.random.default_rng(42)  


def load_events() -> pd.DataFrame:
    files = sorted((RAW_DIR / "events" / "data").glob("*.parquet"))
    df = pd.concat([pd.read_parquet(f) for f in files], ignore_index=True)
    df = df.sort_values("_lastSeenAt").drop_duplicates("eventId", keep="last")
    return df


def load_performers() -> pd.DataFrame:
    return pd.read_parquet(RAW_DIR / "performers" / "data.parquet")


def load_venues() -> pd.DataFrame:
    return pd.read_parquet(RAW_DIR / "venues" / "data.parquet")


def performer_agg(performer_ids, performers_by_id: dict) -> tuple[float, float, str]:
    """Average score/popularity across an event's performers, plus a display name."""
    rows = [performers_by_id[pid] for pid in performer_ids if pid in performers_by_id]
    if not rows:
        return np.nan, np.nan, None
    scores = [r["score"] for r in rows if pd.notna(r["score"])]
    pops = [r["popularity"] for r in rows if pd.notna(r["popularity"])]
    name = rows[0]["name"]  # primary/first performer as display name
    return (
        float(np.mean(scores)) if scores else np.nan,
        float(np.mean(pops)) if pops else np.nan,
        name,
    )


def build_events_table() -> pd.DataFrame:
    events = load_events()
    performers = load_performers()
    venues = load_venues()

    performers_by_id = performers.set_index("performerId").to_dict("index")
    venues_by_id = venues.set_index("venueId").to_dict("index")

    perf_scores, perf_pops, perf_names = [], [], []
    for ids in events["performerIds"]:
        s, p, n = performer_agg(list(ids) if ids is not None else [], performers_by_id)
        perf_scores.append(s)
        perf_pops.append(p)
        perf_names.append(n)

    events["performer_score_avg"] = perf_scores
    events["performer_popularity_avg"] = perf_pops
    events["primary_performer_name"] = perf_names

    def venue_field(venue_id, field):
        v = venues_by_id.get(venue_id)
        return v[field] if v is not None else np.nan

    for field in ["name", "addressCity", "addressState", "addressCountry",
                  "latitude", "longitude", "capacity", "score", "popularity"]:
        events[f"venue_{field}"] = events["venueId"].map(lambda v: venue_field(v, field))

    out = pd.DataFrame({
        "event_id": events["eventId"].astype("int64"),
        "name": events["name"],
        # generic, category-agnostic naming (see module docstring)
        "category": events["taxonomySubName"],       # e.g. baseball, basketball, football, hockey
        "subcategory": events["type"],                # e.g. mlb, nba, nhl, nfl, stadium_tours
        "datetime_utc": events["datetimeUtc"],
        "status": events["status"],
        "venue_id": events["venueId"],
        "venue_name": events["venue_name"],
        "venue_city": events["venue_addressCity"],
        "venue_state": events["venue_addressState"],
        "venue_country": events["venue_addressCountry"],
        "venue_lat": events["venue_latitude"],
        "venue_lon": events["venue_longitude"],
        "venue_capacity": events["venue_capacity"],
        "venue_score": events["venue_score"],
        "venue_popularity": events["venue_popularity"],
        "performer_score_avg": events["performer_score_avg"],
        "performer_popularity_avg": events["performer_popularity_avg"],
        "primary_performer_name": events["primary_performer_name"],
    })

    snapshot_now = pd.to_datetime(events["_lastSeenAt"], utc=True).max()
    # ^ the dataset's latest scrape timestamp acts as our reference "today"
    out["datetime_utc"] = pd.to_datetime(out["datetime_utc"], utc=True)
    out = out[(out["status"] == "normal") & (out["datetime_utc"] >= snapshot_now)]
    out = out.reset_index(drop=True)

    return out


def add_derived_popularity(df: pd.DataFrame) -> pd.DataFrame:

    def norm(s: pd.Series) -> pd.Series:
        s = s.astype(float)
        lo, hi = s.min(skipna=True), s.max(skipna=True)
        if pd.isna(lo) or pd.isna(hi) or hi == lo:
            return pd.Series(0.5, index=s.index)
        return (s - lo) / (hi - lo)

    perf_pop_n = norm(df["performer_popularity_avg"])
    perf_score_n = df["performer_score_avg"].fillna(df["performer_score_avg"].median())
    venue_pop_n = norm(df["venue_popularity"])
    venue_score_n = df["venue_score"].fillna(df["venue_score"].median())

    df["event_popularity_score"] = (
        0.35 * perf_pop_n.fillna(perf_pop_n.median())
        + 0.25 * perf_score_n
        + 0.20 * venue_pop_n.fillna(venue_pop_n.median())
        + 0.20 * venue_score_n
    ).clip(0, 1)
    return df


def add_synthetic_price(df: pd.DataFrame) -> pd.DataFrame:
    
    capacity = df["venue_capacity"].replace(0, np.nan)
    cap_n = (capacity - capacity.min()) / (capacity.max() - capacity.min())
    cap_n = cap_n.fillna(cap_n.median())

    base = 40 + 260 * df["event_popularity_score"]           # $40-$300 popularity-driven base
    capacity_adj = 1.4 - 0.8 * cap_n                          # smaller venue -> higher multiplier
    noise = RNG.normal(loc=1.0, scale=0.12, size=len(df))     # +/- ~12% noise

    df["price_estimated"] = (base * capacity_adj * noise).round(2).clip(lower=15)
    df["price_is_synthetic"] = True
    return df


if __name__ == "__main__":
    events = build_events_table()
    events = add_derived_popularity(events)
    events = add_synthetic_price(events)

    out_path = OUT_DIR / "events_clean.csv"
    events.to_csv(out_path, index=False)
    print(f"Wrote {len(events)} events -> {out_path}")
    print(events[["event_id", "name", "category", "subcategory", "venue_city",
                   "event_popularity_score", "price_estimated"]].head(10).to_string(index=False))
