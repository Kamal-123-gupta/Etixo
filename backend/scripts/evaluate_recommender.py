"""
evaluate_recommender.py — Offline Evaluation Benchmark for Recommender Engine.

Calculates industry-standard information retrieval metrics on user-event interactions:
- NDCG@5, NDCG@10 (Normalized Discounted Cumulative Gain)
- Precision@5, Precision@10
- Recall@5, Recall@10
- Mean Reciprocal Rank (MRR)
- Catalog Coverage (% of catalog surfaced)
"""

import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

import numpy as np
import pandas as pd

from app.recommendation.model import ContentBasedRecommender


DATA_DIR = Path(__file__).resolve().parent.parent / ".." / "data" / "processed"
if not DATA_DIR.exists():
    DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "processed"


def compute_dcg(hits: list[int], k: int) -> float:
    """Discounted Cumulative Gain at rank k."""
    dcg = 0.0
    for i, rel in enumerate(hits[:k]):
        if rel:
            dcg += 1.0 / np.log2(i + 2)  # i=0 -> log2(2) = 1.0
    return dcg


def compute_ndcg(hits: list[int], total_relevant: int, k: int) -> float:
    """Normalized Discounted Cumulative Gain at rank k."""
    if total_relevant == 0:
        return 0.0
    dcg = compute_dcg(hits, k)
    ideal_hits = [1] * min(k, total_relevant)
    idcg = compute_dcg(ideal_hits, k)
    return dcg / idcg if idcg > 0 else 0.0


def evaluate() -> dict:
    events_path = DATA_DIR / "events_clean.csv"
    users_path = DATA_DIR / "users_synthetic.csv"
    interactions_path = DATA_DIR / "interactions_synthetic.csv"

    if not (events_path.exists() and users_path.exists() and interactions_path.exists()):
        print("Data files not found in", DATA_DIR)
        return {}

    events = pd.read_csv(events_path)
    users = pd.read_csv(users_path)
    interactions = pd.read_csv(interactions_path)

    print(f"Loaded {len(events)} events, {len(users)} users, {len(interactions)} interactions.")

    # 80/20 Train/Test Holdout Split for proper offline evaluation
    bookings = interactions[interactions["interaction_type"] == "booking"].copy()
    user_counts = bookings.groupby("user_id")["event_id"].count()
    eval_users = user_counts[user_counts >= 3].index.tolist()
    print(f"Evaluating {len(eval_users)} active users with booking history using 80/20 holdout...")

    train_rows = []
    test_rows = []
    rng = np.random.default_rng(42)

    # Build holdout test set of (user_id, event_id) pairs
    test_user_events = set()
    for u in eval_users:
        u_bks = bookings[bookings["user_id"] == u]
        n_test = max(1, int(len(u_bks) * 0.25))
        test_eids = rng.choice(u_bks["event_id"].unique(), size=n_test, replace=False)
        for eid in test_eids:
            test_user_events.add((u, eid))

    # Mask interactions so test items are strictly unseen in training
    is_test_interaction = interactions.apply(lambda r: (r["user_id"], r["event_id"]) in test_user_events, axis=1)
    train_interactions = interactions[~is_test_interaction].copy()

    recommender = ContentBasedRecommender(events=events, users=users, interactions=train_interactions)
    user_test_truth = {}
    for u, eid in test_user_events:
        user_test_truth.setdefault(u, set()).add(eid)



    p_5, p_10 = [], []
    r_5, r_10 = [], []
    ndcg_5, ndcg_10 = [], []
    mrr_list = []
    all_recommended_events = set()

    k_max = 10
    for u in eval_users:
        relevant = user_test_truth.get(u, set())
        if not relevant:
            continue
        rec_df = recommender.recommend(user_id=u, top_n=k_max)

        if rec_df.empty:
            continue

        rec_ids = rec_df["event_id"].tolist()
        all_recommended_events.update(rec_ids)

        hits = [1 if eid in relevant else 0 for eid in rec_ids]

        # Precision & Recall @ 5
        hits_5 = sum(hits[:5])
        p_5.append(hits_5 / 5.0)
        r_5.append(hits_5 / len(relevant))
        ndcg_5.append(compute_ndcg(hits, len(relevant), k=5))

        # Precision & Recall @ 10
        hits_10 = sum(hits[:10])
        p_10.append(hits_10 / 10.0)
        r_10.append(hits_10 / len(relevant))
        ndcg_10.append(compute_ndcg(hits, len(relevant), k=10))

        # MRR
        rr = 0.0
        for rank, h in enumerate(hits, start=1):
            if h:
                rr = 1.0 / rank
                break
        mrr_list.append(rr)

    catalog_coverage = len(all_recommended_events) / len(events) if len(events) > 0 else 0.0

    metrics = {
        "evaluated_users": len(eval_users),
        "catalog_size": len(events),
        "ndcg@5": round(float(np.mean(ndcg_5)), 4),
        "ndcg@10": round(float(np.mean(ndcg_10)), 4),
        "precision@5": round(float(np.mean(p_5)), 4),
        "precision@10": round(float(np.mean(p_10)), 4),
        "recall@5": round(float(np.mean(r_5)), 4),
        "recall@10": round(float(np.mean(r_10)), 4),
        "mean_reciprocal_rank": round(float(np.mean(mrr_list)), 4),
        "catalog_coverage": round(float(catalog_coverage), 4),
    }

    out_file = DATA_DIR / "recommendation_metrics.json"
    with open(out_file, "w") as f:
        json.dump(metrics, f, indent=2)

    print("\n" + "=" * 50)
    print("      RECOMMENDER OFFLINE BENCHMARK RESULTS")
    print("=" * 50)
    print(f"  NDCG@10               : {metrics['ndcg@10']:.4f}")
    print(f"  NDCG@5                : {metrics['ndcg@5']:.4f}")
    print(f"  Precision@5           : {metrics['precision@5']:.4f}")
    print(f"  Precision@10          : {metrics['precision@10']:.4f}")
    print(f"  Recall@5              : {metrics['recall@5']:.4f}")
    print(f"  Recall@10             : {metrics['recall@10']:.4f}")
    print(f"  MRR (Mean Recip Rank) : {metrics['mean_reciprocal_rank']:.4f}")
    print(f"  Catalog Coverage      : {metrics['catalog_coverage']:.2%}")
    print("=" * 50)
    print(f"Metrics saved to: {out_file}")

    return metrics


if __name__ == "__main__":
    evaluate()
