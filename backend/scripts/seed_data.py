"""
seed_data.py — Loads data/processed/{events_clean,users_synthetic,
interactions_synthetic}.csv into the real DB tables, so the platform has
realistic volume to demo against instead of starting empty.

What gets loaded:
  - events_clean.csv        -> Event rows (organizer_id=None: "system"-owned
                                catalog events, external_id keeps the
                                original Kaggle event_id for reference)
  - users_synthetic.csv     -> User + Preference rows (synthetic accounts,
                                all sharing one dev-only password so they're
                                usable for demo logins if needed)
  - interactions_synthetic.csv -> only the "booking"-typed rows become real
                                Booking rows (there's no `view`-event table
                                yet -- see app/services/agent_bridge.py for
                                why that's intentionally left for later)

Usage:
    cd backend
    python scripts/seed_data.py                 # full dataset
    python scripts/seed_data.py --max-events 200 --max-users 100
    python scripts/seed_data.py --reset          # drop & recreate tables first
"""

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models.booking import Booking
from app.models.enums import UserRole
from app.models.event import Event
from app.models.operations import OperationsChecklist
from app.models.user import Preference, User
from app.utils.ids import generate_qr_code

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "processed"
DEV_PASSWORD_HASH = hash_password("demo1234")  # shared across all seeded demo users


def load_events(db, max_events: int | None) -> dict[int, int]:
    df = pd.read_csv(DATA_DIR / "events_clean.csv")
    if max_events:
        df = df.head(max_events)

    external_to_internal: dict[int, int] = {}
    for _, row in df.iterrows():
        capacity = row.get("venue_capacity")
        total_tickets = int(capacity) if pd.notna(capacity) and capacity > 0 else 500
        # Cap inventory to something a demo can plausibly sell through --
        # a real 80,000-seat stadium capacity isn't a useful "tickets
        # remaining" number for a UI progress bar.
        total_tickets = min(total_tickets, 500)

        event_datetime = pd.to_datetime(row.get("datetime_utc"), errors="coerce", utc=True)
        price = float(row["price_estimated"]) if pd.notna(row.get("price_estimated")) else 0.0

        event = Event(
            external_id=int(row["event_id"]),
            organizer_id=None,
            title=str(row["name"]),
            category=str(row["category"]),
            subcategory=str(row["subcategory"]) if pd.notna(row.get("subcategory")) else None,
            event_datetime=event_datetime.to_pydatetime() if pd.notna(event_datetime) else None,
            venue_name=str(row.get("venue_name")) if pd.notna(row.get("venue_name")) else None,
            venue_city=str(row.get("venue_city")) if pd.notna(row.get("venue_city")) else None,
            venue_state=str(row.get("venue_state")) if pd.notna(row.get("venue_state")) else None,
            venue_country=str(row.get("venue_country")) if pd.notna(row.get("venue_country")) else None,
            venue_lat=float(row["venue_lat"]) if pd.notna(row.get("venue_lat")) else None,
            venue_lon=float(row["venue_lon"]) if pd.notna(row.get("venue_lon")) else None,
            venue_capacity=int(capacity) if pd.notna(capacity) else None,
            base_price=price,
            current_price=price,
            total_tickets=total_tickets,
            tickets_sold=0,
            popularity_score=float(row["event_popularity_score"]) if pd.notna(row.get("event_popularity_score")) else None,
            primary_performer_name=str(row.get("primary_performer_name")) if pd.notna(row.get("primary_performer_name")) else None,
        )
        db.add(event)
        db.flush()  # need event.id now to map external_id -> internal id
        db.add(OperationsChecklist(event_id=event.id))
        external_to_internal[int(row["event_id"])] = event.id

    db.commit()
    print(f"Loaded {len(external_to_internal)} events")
    return external_to_internal


def load_users(db, max_users: int | None) -> dict[int, int]:
    df = pd.read_csv(DATA_DIR / "users_synthetic.csv")
    if max_users:
        df = df.head(max_users)

    external_to_internal: dict[int, int] = {}
    for _, row in df.iterrows():
        external_uid = int(row["user_id"])
        user = User(
            name=str(row["name"]),
            email=f"seed-user-{external_uid}@demo.ticketbooking.local",
            password_hash=DEV_PASSWORD_HASH,
            role=UserRole.attendee,
            home_city=str(row.get("home_city")) if pd.notna(row.get("home_city")) else None,
            home_state=str(row.get("home_state")) if pd.notna(row.get("home_state")) else None,
            home_country=str(row.get("home_country")) if pd.notna(row.get("home_country")) else None,
        )
        db.add(user)
        db.flush()

        categories = str(row.get("preferred_categories", "")).replace("|", ",")
        budget_max = float(row["budget_max"]) if pd.notna(row.get("budget_max")) else None
        db.add(Preference(user_id=user.id, categories=categories, budget_max=budget_max))

        external_to_internal[external_uid] = user.id

    db.commit()
    print(f"Loaded {len(external_to_internal)} users (shared dev password: demo1234)")
    return external_to_internal


def load_bookings(db, event_map: dict[int, int], user_map: dict[int, int]) -> int:
    df = pd.read_csv(DATA_DIR / "interactions_synthetic.csv")
    bookings_df = df[df["interaction_type"] == "booking"]

    now = datetime.now(timezone.utc)
    count = 0
    for _, row in bookings_df.iterrows():
        ext_event_id, ext_user_id = int(row["event_id"]), int(row["user_id"])
        event_id = event_map.get(ext_event_id)
        user_id = user_map.get(ext_user_id)
        if event_id is None or user_id is None:
            continue  # event/user was excluded by --max-events / --max-users

        event = db.get(Event, event_id)
        quantity = int(row["quantity"]) if pd.notna(row.get("quantity")) else 1
        day_offset = int(row["day_offset"]) if pd.notna(row.get("day_offset")) else 0
        created_at = now - timedelta(days=day_offset)

        remaining = event.total_tickets - event.tickets_sold
        if remaining < quantity:
            continue  # capped inventory from load_events() -- skip once sold out

        booking = Booking(
            event_id=event_id,
            user_id=user_id,
            quantity=quantity,
            price_paid=event.current_price * quantity,
            qr_code=generate_qr_code(event_id, user_id),
            created_at=created_at,
        )
        event.tickets_sold += quantity
        db.add(booking)
        count += 1

    db.commit()
    print(f"Loaded {count} bookings (from {len(bookings_df)} booking-type interactions)")
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--max-events", type=int, default=None)
    parser.add_argument("--max-users", type=int, default=None)
    parser.add_argument("--reset", action="store_true", help="Drop and recreate all tables first")
    args = parser.parse_args()

    if args.reset:
        print("Dropping and recreating all tables...")
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(Event).count() > 0:
            print("Events table is not empty -- re-run with --reset to wipe and reseed. Aborting.")
            return
        event_map = load_events(db, args.max_events)
        user_map = load_users(db, args.max_users)
        load_bookings(db, event_map, user_map)
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
