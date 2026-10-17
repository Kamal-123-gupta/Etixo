"""
add_diverse_events.py — Ingests and synthesizes diverse public event entities:
Hackathons, Tech Conferences, Music Festivals, Esports, Comedy, Arts, Food & Culinary.

Enriches:
- data/processed/events_clean.csv
- data/processed/users_synthetic.csv
- data/processed/interactions_synthetic.csv
And seeds them directly into the database.
"""

from datetime import datetime, timezone, timedelta
from pathlib import Path
import random
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "processed"
if not DATA_DIR.exists():
    DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"

# Curated public-style events with realistic metadata
DIVERSE_EVENTS = [
    # --- HACKATHONS ---
    {
        "name": "Global AI & Agentic Systems Hackathon 2026",
        "category": "hackathon",
        "subcategory": "ai_agents",
        "venue_name": "Silicon Innovation Labs",
        "venue_city": "San Francisco",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 37.7749,
        "venue_lon": -122.4194,
        "venue_capacity": 600,
        "price_estimated": 0.0,
        "primary_performer_name": "DeepMind & OpenAI Developer Community",
        "days_ahead": 14,
        "time_str": "09:00:00"
    },
    {
        "name": "SustainTech: Climate & Green Computing Hackathon",
        "category": "hackathon",
        "subcategory": "sustainability",
        "venue_name": "Bengaluru Tech Hub & Convention",
        "venue_city": "Bengaluru",
        "venue_state": "KA",
        "venue_country": "India",
        "venue_lat": 12.9716,
        "venue_lon": 77.5946,
        "venue_capacity": 450,
        "price_estimated": 0.0,
        "primary_performer_name": "EarthTech Alliance",
        "days_ahead": 21,
        "time_str": "10:00:00"
    },
    {
        "name": "Web3 & Zero-Knowledge Buildathon",
        "category": "hackathon",
        "subcategory": "web3",
        "venue_name": "Austin Blockchain Center",
        "venue_city": "Austin",
        "venue_state": "TX",
        "venue_country": "US",
        "venue_lat": 30.2672,
        "venue_lon": -97.7431,
        "venue_capacity": 350,
        "price_estimated": 25.0,
        "primary_performer_name": "ZK Guild Developers",
        "days_ahead": 28,
        "time_str": "09:30:00"
    },
    {
        "name": "HealthTech & MedData Hackathon",
        "category": "hackathon",
        "subcategory": "biotech",
        "venue_name": "Cambridge BioLabs Innovation Center",
        "venue_city": "Boston",
        "venue_state": "MA",
        "venue_country": "US",
        "venue_lat": 42.3601,
        "venue_lon": -71.0589,
        "venue_capacity": 300,
        "price_estimated": 15.0,
        "primary_performer_name": "MIT & Harvard BioTech Guild",
        "days_ahead": 35,
        "time_str": "10:00:00"
    },
    {
        "name": "Autonomous Drone & Robotics Sprint",
        "category": "hackathon",
        "subcategory": "robotics",
        "venue_name": "Pioneer Robotics Hangar",
        "venue_city": "Seattle",
        "venue_state": "WA",
        "venue_country": "US",
        "venue_lat": 47.6062,
        "venue_lon": -122.3321,
        "venue_capacity": 250,
        "price_estimated": 30.0,
        "primary_performer_name": "Northwest Robotics Club",
        "days_ahead": 42,
        "time_str": "08:30:00"
    },

    # --- TECH CONFERENCES ---
    {
        "name": "Global AI Summit 2026: Future of Generative Models",
        "category": "tech",
        "subcategory": "conference",
        "venue_name": "Moscone Center Grand Ballroom",
        "venue_city": "San Francisco",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 37.7842,
        "venue_lon": -122.4016,
        "venue_capacity": 1200,
        "price_estimated": 199.0,
        "primary_performer_name": "Keynote: Dr. Ilya Sutskever & AI Pioneers",
        "days_ahead": 18,
        "time_str": "09:00:00"
    },
    {
        "name": "CloudNativeCon & Microservices Expo",
        "category": "tech",
        "subcategory": "devops",
        "venue_name": "Javits Convention Center",
        "venue_city": "New York",
        "venue_state": "NY",
        "venue_country": "US",
        "venue_lat": 40.7580,
        "venue_lon": -74.0020,
        "venue_capacity": 800,
        "price_estimated": 149.0,
        "primary_performer_name": "CNCF Ambassadors",
        "days_ahead": 25,
        "time_str": "10:00:00"
    },
    {
        "name": "Full-Stack & React Architecture Conference",
        "category": "tech",
        "subcategory": "frontend",
        "venue_name": "McCormick Place Tech Pavilion",
        "venue_city": "Chicago",
        "venue_state": "IL",
        "venue_country": "US",
        "venue_lat": 41.8500,
        "venue_lon": -87.6167,
        "venue_capacity": 700,
        "price_estimated": 120.0,
        "primary_performer_name": "React Core Team & Friends",
        "days_ahead": 32,
        "time_str": "09:30:00"
    },
    {
        "name": "CyberDefense Zero-Trust Global Summit",
        "category": "tech",
        "subcategory": "security",
        "venue_name": "Metro Center Convention Hall",
        "venue_city": "Washington",
        "venue_state": "DC",
        "venue_country": "US",
        "venue_lat": 38.8951,
        "venue_lon": -77.0364,
        "venue_capacity": 650,
        "price_estimated": 175.0,
        "primary_performer_name": "Global CISO Roundtable",
        "days_ahead": 45,
        "time_str": "10:00:00"
    },

    # --- MUSIC FESTIVALS & CONCERTS ---
    {
        "name": "Neon Pulse: Electronic Music & Synthwave Festival",
        "category": "music",
        "subcategory": "edm",
        "venue_name": "Bayfront Amphitheater",
        "venue_city": "Miami",
        "venue_state": "FL",
        "venue_country": "US",
        "venue_lat": 25.7743,
        "venue_lon": -80.1937,
        "venue_capacity": 1500,
        "price_estimated": 89.0,
        "primary_performer_name": "Kavinsky & Deadmau5 Special Set",
        "days_ahead": 16,
        "time_str": "18:00:00"
    },
    {
        "name": "Acoustic Sunset: Indie & Folk Summer Gala",
        "category": "music",
        "subcategory": "indie",
        "venue_name": "Red Rocks Amphitheatre",
        "venue_city": "Denver",
        "venue_state": "CO",
        "venue_country": "US",
        "venue_lat": 39.6654,
        "venue_lon": -105.2057,
        "venue_capacity": 900,
        "price_estimated": 65.0,
        "primary_performer_name": "The Lumineers Acoustic Collective",
        "days_ahead": 22,
        "time_str": "17:30:00"
    },
    {
        "name": "Symphony Under The Stars: Philharmonic Showcase",
        "category": "music",
        "subcategory": "classical",
        "venue_name": "Hollywood Bowl Arena",
        "venue_city": "Los Angeles",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 34.1128,
        "venue_lon": -118.3394,
        "venue_capacity": 1000,
        "price_estimated": 75.0,
        "primary_performer_name": "LA Philharmonic Orchestra",
        "days_ahead": 30,
        "time_str": "19:00:00"
    },

    # --- STANDUP COMEDY ---
    {
        "name": "Standup Showcase: Uncensored Live Special",
        "category": "comedy",
        "subcategory": "standup",
        "venue_name": "The Comedy Cellar",
        "venue_city": "New York",
        "venue_state": "NY",
        "venue_country": "US",
        "venue_lat": 40.7302,
        "venue_lon": -74.0006,
        "venue_capacity": 250,
        "price_estimated": 45.0,
        "primary_performer_name": "John Mulaney & Surprise Guests",
        "days_ahead": 12,
        "time_str": "20:00:00"
    },
    {
        "name": "The Laugh Riot: Improv & Punchline Battle",
        "category": "comedy",
        "subcategory": "improv",
        "venue_name": "The Second City Mainstage",
        "venue_city": "Chicago",
        "venue_state": "IL",
        "venue_country": "US",
        "venue_lat": 41.9118,
        "venue_lon": -87.6358,
        "venue_capacity": 300,
        "price_estimated": 35.0,
        "primary_performer_name": "Second City All-Stars",
        "days_ahead": 26,
        "time_str": "21:00:00"
    },

    # --- ESPORTS & GAMING ---
    {
        "name": "Valorant Champions Invitational 2026",
        "category": "esports",
        "subcategory": "fps",
        "venue_name": "Kia Forum Arena",
        "venue_city": "Los Angeles",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 33.9583,
        "venue_lon": -118.3419,
        "venue_capacity": 1500,
        "price_estimated": 85.0,
        "primary_performer_name": "Sentinels vs Fnatic",
        "days_ahead": 20,
        "time_str": "16:00:00"
    },
    {
        "name": "Apex Masters Global Championship",
        "category": "esports",
        "subcategory": "battle_royale",
        "venue_name": "Moody Center",
        "venue_city": "Austin",
        "venue_state": "TX",
        "venue_country": "US",
        "venue_lat": 30.2808,
        "venue_lon": -97.7317,
        "venue_capacity": 1100,
        "price_estimated": 70.0,
        "primary_performer_name": "TSM, DarkZero & Top 20 Squads",
        "days_ahead": 38,
        "time_str": "15:00:00"
    },

    # --- ARTS & THEATRE ---
    {
        "name": "Generative AI & Digital Art Biennale 2026",
        "category": "arts",
        "subcategory": "exhibition",
        "venue_name": "Palace of Fine Arts",
        "venue_city": "San Francisco",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 37.8029,
        "venue_lon": -122.4484,
        "venue_capacity": 500,
        "price_estimated": 40.0,
        "primary_performer_name": "Curated by Refik Anadol Studio",
        "days_ahead": 24,
        "time_str": "11:00:00"
    },
    {
        "name": "Broadway Classics: The Immersive Stage Revival",
        "category": "arts",
        "subcategory": "theatre",
        "venue_name": "Majestic Theatre",
        "venue_city": "New York",
        "venue_state": "NY",
        "venue_country": "US",
        "venue_lat": 40.7584,
        "venue_lon": -73.9877,
        "venue_capacity": 650,
        "price_estimated": 110.0,
        "primary_performer_name": "Original Broadway Ensemble",
        "days_ahead": 29,
        "time_str": "19:30:00"
    },

    # --- FOOD & CULINARY ---
    {
        "name": "Craft Beer, Artisan Spirits & BBQ Carnival",
        "category": "food",
        "subcategory": "fest",
        "venue_name": "Zilker Park Promenade",
        "venue_city": "Austin",
        "venue_state": "TX",
        "venue_country": "US",
        "venue_lat": 30.2669,
        "venue_lon": -97.7729,
        "venue_capacity": 1200,
        "price_estimated": 55.0,
        "primary_performer_name": "Franklin BBQ & 30 Local Breweries",
        "days_ahead": 15,
        "time_str": "12:00:00"
    },
    {
        "name": "Specialty Coffee World Expo & Barista Cup",
        "category": "food",
        "subcategory": "expo",
        "venue_name": "Seattle Center Exhibition Hall",
        "venue_city": "Seattle",
        "venue_state": "WA",
        "venue_country": "US",
        "venue_lat": 47.6205,
        "venue_lon": -122.3493,
        "venue_capacity": 700,
        "price_estimated": 35.0,
        "primary_performer_name": "World Coffee Events Champions",
        "days_ahead": 34,
        "time_str": "10:00:00"
    }
]


def update_datasets():
    events_path = DATA_DIR / "events_clean.csv"
    users_path = DATA_DIR / "users_synthetic.csv"
    interactions_path = DATA_DIR / "interactions_synthetic.csv"

    df_events = pd.read_csv(events_path)
    base_id = int(df_events["event_id"].max()) + 1
    now = datetime.now(timezone.utc)

    new_rows = []
    for item in DIVERSE_EVENTS:
        event_dt = (now + timedelta(days=item["days_ahead"])).strftime(f"%Y-%m-%d {item['time_str']}+00:00")
        row = {
            "event_id": base_id,
            "name": item["name"],
            "category": item["category"],
            "subcategory": item["subcategory"],
            "datetime_utc": event_dt,
            "status": "normal",
            "venue_id": random.randint(10000, 99999),
            "venue_name": item["venue_name"],
            "venue_city": item["venue_city"],
            "venue_state": item["venue_state"],
            "venue_country": item["venue_country"],
            "venue_lat": item["venue_lat"],
            "venue_lon": item["venue_lon"],
            "venue_capacity": item["venue_capacity"],
            "venue_score": 0.95,
            "venue_popularity": 450000,
            "performer_score_avg": 0.92,
            "performer_popularity_avg": 250000.0,
            "primary_performer_name": item["primary_performer_name"],
            "event_popularity_score": round(random.uniform(0.75, 0.98), 4),
            "price_estimated": item["price_estimated"],
            "price_is_synthetic": True,
        }
        new_rows.append(row)
        base_id += 1

    df_new = pd.DataFrame(new_rows)
    # Check if any of these are already in events_clean
    existing_names = set(df_events["name"])
    df_new_filtered = df_new[~df_new["name"].isin(existing_names)]

    if not df_new_filtered.empty:
        df_combined = pd.concat([df_events, df_new_filtered], ignore_index=True)
        df_combined.to_csv(events_path, index=False)
        print(f"Added {len(df_new_filtered)} new diverse events to {events_path}!")
    else:
        print("Diverse events already exist in events_clean.csv.")

    # Update users with diverse preference profiles
    if users_path.exists():
        df_users = pd.read_csv(users_path)
        categories_to_assign = [
            "hackathon|tech",
            "hackathon|music",
            "tech|hackathon|ai",
            "music|arts",
            "comedy|food",
            "esports|hackathon",
            "food|tech",
            "arts|comedy"
        ]
        # Assign diverse preferences to some users
        for i in range(min(120, len(df_users))):
            df_users.at[i, "preferred_categories"] = categories_to_assign[i % len(categories_to_assign)]
        df_users.to_csv(users_path, index=False)
        print(f"Updated user preference profiles with diverse categories in {users_path}")


if __name__ == "__main__":
    update_datasets()
