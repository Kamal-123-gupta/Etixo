"""
populate_all_categories.py
Seeds rich, realistic events for ALL predefined categories into:
- SQLite ticket_booking.db
- data/processed/events_clean.csv
"""

from datetime import datetime, timezone, timedelta
from pathlib import Path
import random
import sys
import pandas as pd

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal
from app.models.event import Event, EventFAQ, EventTerm
from app.models.operations import OperationsChecklist
from app.models.enums import DemandTier

DATA_DIR = BACKEND_DIR.parent / "data" / "processed"

NEW_CATEGORY_EVENTS = [
    # --- stadium_tours ---
    {
        "title": "VIP Access: Santiago Bernabéu Stadium & Trophy Tour",
        "category": "stadium_tours",
        "subcategory": "stadium",
        "venue_name": "Santiago Bernabéu Stadium",
        "venue_city": "Madrid",
        "venue_state": "MD",
        "venue_country": "Spain",
        "venue_lat": 40.4530,
        "venue_lon": -3.6883,
        "venue_capacity": 500,
        "price": 45.0,
        "performer": "Real Madrid Foundation Guides",
        "days_ahead": 6,
        "time_str": "10:30:00",
        "demand": DemandTier.high,
        "description": "Exclusive behind-the-scenes walkthrough of the iconic stadium, presidential box, locker rooms, press room, and the legendary 15-time Champions League trophy pavilion."
    },
    {
        "title": "Camp Nou Historic Pitch & Locker Room VIP Tour",
        "category": "stadium_tours",
        "subcategory": "stadium",
        "venue_name": "Camp Nou Experience Arena",
        "venue_city": "Barcelona",
        "venue_state": "CT",
        "venue_country": "Spain",
        "venue_lat": 41.3809,
        "venue_lon": 2.1228,
        "venue_capacity": 450,
        "price": 40.0,
        "performer": "FC Barcelona Heritage Team",
        "days_ahead": 12,
        "time_str": "11:00:00",
        "demand": DemandTier.medium,
        "description": "Walk through the tunnel onto the pitch, explore the Barça Museum, Messi Space, and experience the stadium through immersive virtual reality."
    },
    {
        "title": "Wembley Grand Arena & Royal Box Architectural Tour",
        "category": "stadium_tours",
        "subcategory": "stadium",
        "venue_name": "Wembley Stadium",
        "venue_city": "London",
        "venue_state": "LDN",
        "venue_country": "United Kingdom",
        "venue_lat": 51.5560,
        "venue_lon": -0.2795,
        "venue_capacity": 600,
        "price": 50.0,
        "performer": "Wembley Stadium Historians",
        "days_ahead": 18,
        "time_str": "14:00:00",
        "demand": DemandTier.high,
        "description": "Visit the England dressing room, stand pitch-side near the sacred turf, sit in the Royal Box, and hold the replica FA Cup."
    },
    {
        "title": "Fenway Park Iconic Green Monster Historic Tour",
        "category": "stadium_tours",
        "subcategory": "stadium",
        "venue_name": "Fenway Park",
        "venue_city": "Boston",
        "venue_state": "MA",
        "venue_country": "US",
        "venue_lat": 42.3467,
        "venue_lon": -71.0972,
        "venue_capacity": 350,
        "price": 35.0,
        "performer": "Red Sox Historical Society",
        "days_ahead": 8,
        "time_str": "13:30:00",
        "demand": DemandTier.medium,
        "description": "Tour America's oldest ballpark. Stand atop the world-famous Green Monster, visit the press box, and see the legendary red seat."
    },

    # --- Music ---
    {
        "title": "Neon Pulse: Electronic Music & Synthwave Festival",
        "category": "music",
        "subcategory": "edm",
        "venue_name": "Bayfront Amphitheater",
        "venue_city": "Miami",
        "venue_state": "FL",
        "venue_country": "US",
        "venue_lat": 25.7743,
        "venue_lon": -80.1937,
        "venue_capacity": 1500,
        "price": 89.0,
        "performer": "Kavinsky & Deadmau5 Special Set",
        "days_ahead": 10,
        "time_str": "18:00:00",
        "demand": DemandTier.surge,
        "description": "High-octane electronic music gala with lasers, live analog synths, and bass-heavy performances under the Miami skyline."
    },
    {
        "title": "Acoustic Sunset: Indie & Folk Summer Gala",
        "category": "music",
        "subcategory": "indie",
        "venue_name": "Red Rocks Amphitheatre",
        "venue_city": "Denver",
        "venue_state": "CO",
        "venue_country": "US",
        "venue_lat": 39.6654,
        "venue_lon": -105.2057,
        "venue_capacity": 900,
        "price": 65.0,
        "performer": "The Lumineers Acoustic Collective",
        "days_ahead": 16,
        "time_str": "17:30:00",
        "demand": DemandTier.high,
        "description": "An intimate evening of folk harmonies, acoustic guitars, and heartfelt storytelling nestled in the iconic sandstone cliffs."
    },
    {
        "title": "Symphony Under The Stars: Philharmonic Showcase",
        "category": "music",
        "subcategory": "classical",
        "venue_name": "Hollywood Bowl Arena",
        "venue_city": "Los Angeles",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 34.1128,
        "venue_lon": -118.3394,
        "venue_capacity": 1000,
        "price": 75.0,
        "performer": "LA Philharmonic Orchestra",
        "days_ahead": 22,
        "time_str": "19:00:00",
        "demand": DemandTier.medium,
        "description": "Mesmerizing symphonic compositions featuring Beethoven, Tchaikovsky, and Hans Zimmer film scores accompanied by synchronized fireworks."
    },
    {
        "title": "Rhythm & Soul: Live Afrobeat & Jazz Explosion",
        "category": "music",
        "subcategory": "jazz",
        "venue_name": "Blue Note Jazz Ballroom",
        "venue_city": "New York",
        "venue_state": "NY",
        "venue_country": "US",
        "venue_lat": 40.7308,
        "venue_lon": -74.0006,
        "venue_capacity": 400,
        "price": 55.0,
        "performer": "Burna Boy Live Brass Collective",
        "days_ahead": 14,
        "time_str": "20:30:00",
        "demand": DemandTier.high,
        "description": "Rich polyrhythms, soulful saxophone solos, and intoxicating Afro-funk grooves in the heart of Greenwich Village."
    },

    # --- Arts ---
    {
        "title": "Generative AI & Digital Art Biennale 2026",
        "category": "arts",
        "subcategory": "exhibition",
        "venue_name": "Palace of Fine Arts",
        "venue_city": "San Francisco",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 37.8029,
        "venue_lon": -122.4484,
        "venue_capacity": 500,
        "price": 40.0,
        "performer": "Curated by Refik Anadol Studio",
        "days_ahead": 15,
        "time_str": "11:00:00",
        "demand": DemandTier.high,
        "description": "Massive generative data sculptures, algorithmically painted canvases, and 360-degree reactive visual chambers exploring machine consciousness."
    },
    {
        "title": "Broadway Classics: The Immersive Stage Revival",
        "category": "arts",
        "subcategory": "theatre",
        "venue_name": "Majestic Theatre",
        "venue_city": "New York",
        "venue_state": "NY",
        "venue_country": "US",
        "venue_lat": 40.7584,
        "venue_lon": -73.9877,
        "venue_capacity": 650,
        "price": 110.0,
        "performer": "Original Broadway Ensemble",
        "days_ahead": 20,
        "time_str": "19:30:00",
        "demand": DemandTier.surge,
        "description": "Showcasing timeless showstoppers from Phantom, Les Misérables, and Chicago with world-class vocalists and full live orchestra."
    },
    {
        "title": "Vibrant Canvases: Contemporary Impressionism Gallery",
        "category": "arts",
        "subcategory": "gallery",
        "venue_name": "Art Institute Modern Wing",
        "venue_city": "Chicago",
        "venue_state": "IL",
        "venue_country": "US",
        "venue_lat": 41.8796,
        "venue_lon": -87.6237,
        "venue_capacity": 350,
        "price": 30.0,
        "performer": "Featured Chicago Painters Guild",
        "days_ahead": 9,
        "time_str": "13:00:00",
        "demand": DemandTier.medium,
        "description": "An inspiring showcase of bold palette-knife textures, emotional landscapes, and dynamic light interplay."
    },

    # --- Comedy ---
    {
        "title": "Standup Showcase: Uncensored Live Special",
        "category": "comedy",
        "subcategory": "standup",
        "venue_name": "The Comedy Cellar",
        "venue_city": "New York",
        "venue_state": "NY",
        "venue_country": "US",
        "venue_lat": 40.7302,
        "venue_lon": -74.0006,
        "venue_capacity": 250,
        "price": 45.0,
        "performer": "John Mulaney & Surprise Guests",
        "days_ahead": 7,
        "time_str": "20:00:00",
        "demand": DemandTier.surge,
        "description": "New York's premier underground comedy cellar hosting headline comics testing out razor-sharp new material."
    },
    {
        "title": "The Laugh Riot: Improv & Punchline Battle",
        "category": "comedy",
        "subcategory": "improv",
        "venue_name": "The Second City Mainstage",
        "venue_city": "Chicago",
        "venue_state": "IL",
        "venue_country": "US",
        "venue_lat": 41.9118,
        "venue_lon": -87.6358,
        "venue_capacity": 300,
        "price": 35.0,
        "performer": "Second City All-Stars",
        "days_ahead": 14,
        "time_str": "21:00:00",
        "demand": DemandTier.high,
        "description": "Lightning-fast crowd improv, comedic sketches, and head-to-head roast battles from the comedy powerhouse that launched SNL legends."
    },
    {
        "title": "Late Night Chuckles: Top Comic Arena Tour",
        "category": "comedy",
        "subcategory": "standup",
        "venue_name": "Moody Theater ACL Live",
        "venue_city": "Austin",
        "venue_state": "TX",
        "venue_country": "US",
        "venue_lat": 30.2650,
        "venue_lon": -97.7470,
        "venue_capacity": 550,
        "price": 50.0,
        "performer": "Dave Chappelle & Special Guests",
        "days_ahead": 24,
        "time_str": "20:30:00",
        "demand": DemandTier.surge,
        "description": "Two hours of non-stop belly laughs, witty societal observations, and hilarious crowd interaction in downtown Austin."
    },

    # --- Film ---
    {
        "title": "Indie Visions: Global Short Film Screening & Q&A",
        "category": "film",
        "subcategory": "screening",
        "venue_name": "Egyptian Theatre",
        "venue_city": "Los Angeles",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 34.1022,
        "venue_lon": -118.3364,
        "venue_capacity": 400,
        "price": 25.0,
        "performer": "Sundance Jury Winners & Directors",
        "days_ahead": 11,
        "time_str": "18:30:00",
        "demand": DemandTier.medium,
        "description": "Six prize-winning short films from around the globe followed by an intimate director Q&A and networking mixer."
    },
    {
        "title": "Midnight Sci-Fi Classics: 70mm Retro Experience",
        "category": "film",
        "subcategory": "retro",
        "venue_name": "Film Forum Cinema",
        "venue_city": "New York",
        "venue_state": "NY",
        "venue_country": "US",
        "venue_lat": 40.7282,
        "venue_lon": -74.0049,
        "venue_capacity": 300,
        "price": 22.0,
        "performer": "Criterion Film Society Host",
        "days_ahead": 17,
        "time_str": "23:45:00",
        "demand": DemandTier.high,
        "description": "Original 70mm theatrical projection of Blade Runner and 2001: A Space Odyssey with surround sound and trivia prizes."
    },
    {
        "title": "Animation Forward: Studio Ghibli & Modern Anime Fest",
        "category": "film",
        "subcategory": "anime",
        "venue_name": "Castro Theatre",
        "venue_city": "San Francisco",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 37.7620,
        "venue_lon": -122.4350,
        "venue_capacity": 600,
        "price": 28.0,
        "performer": "Tokyo Film Guild Presentation",
        "days_ahead": 26,
        "time_str": "16:00:00",
        "demand": DemandTier.high,
        "description": "Celebrating the pinnacle of hand-drawn animation on the big screen with live Japanese pipe organ pre-shows."
    },

    # --- Tech ---
    {
        "title": "Global AI Summit 2026: Future of Generative Models",
        "category": "tech",
        "subcategory": "conference",
        "venue_name": "Moscone Center Grand Ballroom",
        "venue_city": "San Francisco",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 37.7842,
        "venue_lon": -122.4016,
        "venue_capacity": 1200,
        "price": 199.0,
        "performer": "Keynote: Dr. Ilya Sutskever & AI Pioneers",
        "days_ahead": 13,
        "time_str": "09:00:00",
        "demand": DemandTier.surge,
        "description": "The world's foremost conference on foundation models, agentic workflows, autonomous systems, and neural reasoning."
    },
    {
        "title": "CloudNativeCon & Microservices Global Expo",
        "category": "tech",
        "subcategory": "devops",
        "venue_name": "Javits Convention Center",
        "venue_city": "New York",
        "venue_state": "NY",
        "venue_country": "US",
        "venue_lat": 40.7580,
        "venue_lon": -74.0020,
        "venue_capacity": 800,
        "price": 149.0,
        "performer": "CNCF Ambassadors & Cloud Architects",
        "days_ahead": 21,
        "time_str": "10:00:00",
        "demand": DemandTier.high,
        "description": "Deep dive into Kubernetes architecture, service mesh observability, eBPF telemetry, and resilient distributed infra."
    },
    {
        "title": "Full-Stack & React Architecture Conference",
        "category": "tech",
        "subcategory": "frontend",
        "venue_name": "McCormick Place Tech Pavilion",
        "venue_city": "Chicago",
        "venue_state": "IL",
        "venue_country": "US",
        "venue_lat": 41.8500,
        "venue_lon": -87.6167,
        "venue_capacity": 700,
        "price": 120.0,
        "performer": "React Core Team & Framework Authors",
        "days_ahead": 28,
        "time_str": "09:30:00",
        "demand": DemandTier.medium,
        "description": "Hands-on workshops on React 19 compiler internals, Server Components, edge SSR, and high-performance WebGL interfaces."
    },

    # --- Hackathon ---
    {
        "title": "Global AI & Agentic Systems Hackathon 2026",
        "category": "hackathon",
        "subcategory": "ai_agents",
        "venue_name": "Silicon Innovation Labs",
        "venue_city": "San Francisco",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 37.7749,
        "venue_lon": -122.4194,
        "venue_capacity": 600,
        "price": 0.0,
        "performer": "DeepMind & OpenAI Developer Community",
        "days_ahead": 8,
        "time_str": "09:00:00",
        "demand": DemandTier.surge,
        "description": "48 hours of rapid building with $100K in seed prizes. Create multi-agent systems, automated workflows, and novel neural apps."
    },
    {
        "title": "SustainTech: Climate & Green Computing Hackathon",
        "category": "hackathon",
        "subcategory": "sustainability",
        "venue_name": "Bengaluru Tech Hub & Convention",
        "venue_city": "Bengaluru",
        "venue_state": "KA",
        "venue_country": "India",
        "venue_lat": 12.9716,
        "venue_lon": 77.5946,
        "venue_capacity": 450,
        "price": 0.0,
        "performer": "EarthTech Alliance",
        "days_ahead": 15,
        "time_str": "10:00:00",
        "demand": DemandTier.high,
        "description": "Hack for the planet: energy-efficient software architectures, smart grid dispatch algorithms, and carbon accounting APIs."
    },
    {
        "title": "Web3 & Zero-Knowledge Buildathon",
        "category": "hackathon",
        "subcategory": "web3",
        "venue_name": "Austin Blockchain Center",
        "venue_city": "Austin",
        "venue_state": "TX",
        "venue_country": "US",
        "venue_lat": 30.2672,
        "venue_lon": -97.7431,
        "venue_capacity": 350,
        "price": 25.0,
        "performer": "ZK Guild Developers",
        "days_ahead": 23,
        "time_str": "09:30:00",
        "demand": DemandTier.medium,
        "description": "Build verifiable zero-knowledge proofs, decentralized identity protocols, and next-gen privacy tooling."
    },

    # --- Conference ---
    {
        "title": "DevOps & SRE Global Leadership Summit",
        "category": "conference",
        "subcategory": "devops",
        "venue_name": "Bell Harbor Conference Center",
        "venue_city": "Seattle",
        "venue_state": "WA",
        "venue_country": "US",
        "venue_lat": 47.6101,
        "venue_lon": -122.3421,
        "venue_capacity": 650,
        "price": 180.0,
        "performer": "Google & AWS Reliability Leads",
        "days_ahead": 19,
        "time_str": "09:00:00",
        "demand": DemandTier.high,
        "description": "Proven patterns for zero-downtime deployments, chaotic failure testing, incident mitigation, and automated rollbacks."
    },
    {
        "title": "Design Systems & Product Experience World Forum",
        "category": "conference",
        "subcategory": "design",
        "venue_name": "Palmer Events Center",
        "venue_city": "Austin",
        "venue_state": "TX",
        "venue_country": "US",
        "venue_lat": 30.2589,
        "venue_lon": -97.7505,
        "venue_capacity": 500,
        "price": 135.0,
        "performer": "Figma & Linear Design Directors",
        "days_ahead": 25,
        "time_str": "10:00:00",
        "demand": DemandTier.medium,
        "description": "Unifying design tokens, cross-platform component architectures, micro-interactions, and accessible typography systems."
    },
    {
        "title": "FinTech Disruption & Open Banking Summit",
        "category": "conference",
        "subcategory": "fintech",
        "venue_name": "Cipriani Wall Street",
        "venue_city": "New York",
        "venue_state": "NY",
        "venue_country": "US",
        "venue_lat": 40.7060,
        "venue_lon": -74.0090,
        "venue_capacity": 600,
        "price": 210.0,
        "performer": "Stripe, Plaid & Banking Leaders",
        "days_ahead": 32,
        "time_str": "09:00:00",
        "demand": DemandTier.surge,
        "description": "Real-time payment rails, FedNow, fraud machine learning models, and algorithmic risk underwriting."
    },

    # --- Food ---
    {
        "title": "Craft Beer, Artisan Spirits & BBQ Carnival",
        "category": "food",
        "subcategory": "fest",
        "venue_name": "Zilker Park Promenade",
        "venue_city": "Austin",
        "venue_state": "TX",
        "venue_country": "US",
        "venue_lat": 30.2669,
        "venue_lon": -97.7729,
        "venue_capacity": 1200,
        "price": 55.0,
        "performer": "Franklin BBQ & 30 Local Breweries",
        "days_ahead": 9,
        "time_str": "12:00:00",
        "demand": DemandTier.surge,
        "description": "Unlimited craft beer tastings, award-winning smoked brisket, artisanal hot sauces, and live bluegrass music."
    },
    {
        "title": "Specialty Coffee World Expo & Barista Cup",
        "category": "food",
        "subcategory": "coffee",
        "venue_name": "Seattle Center Exhibition Hall",
        "venue_city": "Seattle",
        "venue_state": "WA",
        "venue_country": "US",
        "venue_lat": 47.6205,
        "venue_lon": -122.3493,
        "venue_capacity": 700,
        "price": 35.0,
        "performer": "World Coffee Events Champions",
        "days_ahead": 16,
        "time_str": "10:00:00",
        "demand": DemandTier.high,
        "description": "Sample single-origin roasts from 40 nations, witness high-stakes latte art championships, and master pour-over brewing."
    },
    {
        "title": "Gourmet Street Food & Fusion Night Market",
        "category": "food",
        "subcategory": "street_food",
        "venue_name": "Fort Mason Center",
        "venue_city": "San Francisco",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 37.8066,
        "venue_lon": -122.4310,
        "venue_capacity": 900,
        "price": 40.0,
        "performer": "Michelin Bib Gourmand Chefs",
        "days_ahead": 22,
        "time_str": "17:30:00",
        "demand": DemandTier.high,
        "description": "Over 50 international food stalls serving birria bao buns, truffle ramen, hand-rolled churros, and local ciders."
    },

    # --- Fitness ---
    {
        "title": "Urban Hyrox Challenge & Cross-Training Showdown",
        "category": "fitness",
        "subcategory": "race",
        "venue_name": "Navy Pier Grand Ballroom",
        "venue_city": "Chicago",
        "venue_state": "IL",
        "venue_country": "US",
        "venue_lat": 41.8917,
        "venue_lon": -87.6043,
        "venue_capacity": 800,
        "price": 60.0,
        "performer": "Hyrox Athletic League Champions",
        "days_ahead": 11,
        "time_str": "08:00:00",
        "demand": DemandTier.high,
        "description": "The ultimate test of endurance: 8x1km running combined with sled pushes, wall balls, rowing, and burpee broad jumps."
    },
    {
        "title": "Sunset 10K Waterfront Run & Community Festival",
        "category": "fitness",
        "subcategory": "running",
        "venue_name": "South Beach Boardwalk",
        "venue_city": "Miami",
        "venue_state": "FL",
        "venue_country": "US",
        "venue_lat": 25.7825,
        "venue_lon": -80.1340,
        "venue_capacity": 1000,
        "price": 35.0,
        "performer": "Miami Runners Club Pacemakers",
        "days_ahead": 18,
        "time_str": "18:00:00",
        "demand": DemandTier.medium,
        "description": "Scenic sunset race alongside the ocean, with timed bibs, hydration stations, finisher medals, and a post-race beach party."
    },
    {
        "title": "Golden Gate Cycling Century & Charity Ride",
        "category": "fitness",
        "subcategory": "cycling",
        "venue_name": "Crissy Field Promenade",
        "venue_city": "San Francisco",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 37.8044,
        "venue_lon": -122.4660,
        "venue_capacity": 600,
        "price": 50.0,
        "performer": "Peloton & Rapha Cycling Ride Leaders",
        "days_ahead": 27,
        "time_str": "07:30:00",
        "demand": DemandTier.high,
        "description": "Ride across the Golden Gate Bridge into Marin County's scenic mountain roads with full SAG wagon support and energy stops."
    },

    # --- Wellness ---
    {
        "title": "Mindfulness, Breathwork & Sound Bath Sanctuary",
        "category": "wellness",
        "subcategory": "meditation",
        "venue_name": "The Broad Sanctuary Pavilion",
        "venue_city": "Los Angeles",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 34.0544,
        "venue_lon": -118.2505,
        "venue_capacity": 300,
        "price": 35.0,
        "performer": "Calm & Headspace Sound Master Collective",
        "days_ahead": 7,
        "time_str": "19:00:00",
        "demand": DemandTier.medium,
        "description": "Immerse in rejuvenating Tibetan singing bowls, pranayama breathwork, and deep restorative meditation for complete nervous system reset."
    },
    {
        "title": "Alpine Yoga Retreat & Meditation Intensive",
        "category": "wellness",
        "subcategory": "yoga",
        "venue_name": "Chautauqua Mountain Sanctuary",
        "venue_city": "Denver",
        "venue_state": "CO",
        "venue_country": "US",
        "venue_lat": 39.9989,
        "venue_lon": -105.2828,
        "venue_capacity": 250,
        "price": 60.0,
        "performer": "Wanderlust Certified Masters",
        "days_ahead": 14,
        "time_str": "09:00:00",
        "demand": DemandTier.high,
        "description": "Morning Vinyasa flows, guided somatic healing, and mountain air meditation overlooking the majestic Flatirons."
    },
    {
        "title": "Holistic Longevity & Biohacking Summit",
        "category": "wellness",
        "subcategory": "biohacking",
        "venue_name": "La Jolla Wellness Center",
        "venue_city": "San Diego",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 32.8328,
        "venue_lon": -117.2713,
        "venue_capacity": 400,
        "price": 85.0,
        "performer": "Huberman Lab Community Lecturers",
        "days_ahead": 29,
        "time_str": "10:30:00",
        "demand": DemandTier.high,
        "description": "Cutting-edge circadian optimization, cold plunge protocols, infrared sauna sessions, and nutritional biomarker tracking."
    },

    # --- Dance ---
    {
        "title": "World Salsa & Bachata Championship Weekend",
        "category": "dance",
        "subcategory": "latin",
        "venue_name": "Fontainebleau Grand Ballroom",
        "venue_city": "Miami",
        "venue_state": "FL",
        "venue_country": "US",
        "venue_lat": 25.8178,
        "venue_lon": -80.1223,
        "venue_capacity": 850,
        "price": 55.0,
        "performer": "World Latin Dance Champions",
        "days_ahead": 12,
        "time_str": "20:00:00",
        "demand": DemandTier.surge,
        "description": "Electrifying social dancing, master workshops with world champion couples, and sensational choreography showcases until 4 AM."
    },
    {
        "title": "Street Dance & Hip-Hop Battles: Red Bull Cypher",
        "category": "dance",
        "subcategory": "hiphop",
        "venue_name": "Brooklyn Steel Arena",
        "venue_city": "New York",
        "venue_state": "NY",
        "venue_country": "US",
        "venue_lat": 40.7194,
        "venue_lon": -73.9388,
        "venue_capacity": 600,
        "price": 30.0,
        "performer": "Rock Steady Crew & Top B-Boys",
        "days_ahead": 20,
        "time_str": "18:30:00",
        "demand": DemandTier.high,
        "description": "1v1 Breaking, Popping, and Locking battles judged by hip-hop pioneers, with live DJs spinning classic breaks."
    },
    {
        "title": "Contemporary Ballet Under The Stars",
        "category": "dance",
        "subcategory": "ballet",
        "venue_name": "Yerba Buena Gardens Amphitheater",
        "venue_city": "San Francisco",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 37.7850,
        "venue_lon": -122.4025,
        "venue_capacity": 700,
        "price": 45.0,
        "performer": "San Francisco Ballet Principal Dancers",
        "days_ahead": 26,
        "time_str": "19:30:00",
        "demand": DemandTier.medium,
        "description": "Graceful modern choreography blending classical technique with fluid acrobatic movement in an open-air urban oasis."
    },

    # --- Gaming ---
    {
        "title": "Valorant Champions World Invitational 2026",
        "category": "gaming",
        "subcategory": "fps",
        "venue_name": "Kia Forum Arena",
        "venue_city": "Los Angeles",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 33.9583,
        "venue_lon": -118.3419,
        "venue_capacity": 1500,
        "price": 85.0,
        "performer": "Sentinels vs Fnatic Grand Finals",
        "days_ahead": 10,
        "time_str": "16:00:00",
        "demand": DemandTier.surge,
        "description": "The peak of tactical shooter esports. 15,000 cheering fans, thunderous walkouts, and world-class clutch plays."
    },
    {
        "title": "Apex Legends Global Arena Championship",
        "category": "gaming",
        "subcategory": "battle_royale",
        "venue_name": "Moody Center",
        "venue_city": "Austin",
        "venue_state": "TX",
        "venue_country": "US",
        "venue_lat": 30.2808,
        "venue_lon": -97.7317,
        "venue_capacity": 1100,
        "price": 70.0,
        "performer": "TSM, DarkZero & Top 20 Global Squads",
        "days_ahead": 17,
        "time_str": "15:00:00",
        "demand": DemandTier.high,
        "description": "High-octane movement, chaotic final rings, and the crowning of the world's apex predator battle royale squad."
    },
    {
        "title": "Retro Arcade & Speedrunning World Championship",
        "category": "gaming",
        "subcategory": "speedrunning",
        "venue_name": "Galloping Ghost Arcade Arena",
        "venue_city": "Chicago",
        "venue_state": "IL",
        "venue_country": "US",
        "venue_lat": 41.8211,
        "venue_lon": -87.8422,
        "venue_capacity": 450,
        "price": 35.0,
        "performer": "Games Done Quick Record Breakers",
        "days_ahead": 24,
        "time_str": "11:00:00",
        "demand": DemandTier.medium,
        "description": "Over 800 classic arcade cabinets on free play, world record attempts on original CRT monitors, and frame-perfect glitch showcases."
    },

    # --- Charity ---
    {
        "title": "Hope for Children: Annual Black-Tie Benefit Gala",
        "category": "charity",
        "subcategory": "gala",
        "venue_name": "The Plaza Grand Ballroom",
        "venue_city": "New York",
        "venue_state": "NY",
        "venue_country": "US",
        "venue_lat": 40.7645,
        "venue_lon": -73.9744,
        "venue_capacity": 400,
        "price": 125.0,
        "performer": "UNICEF Goodwill Ambassadors",
        "days_ahead": 15,
        "time_str": "19:00:00",
        "demand": DemandTier.high,
        "description": "An elegant evening raising critical funds for pediatric healthcare and global education initiatives, featuring a 4-course banquet and live auction."
    },
    {
        "title": "Save The Oceans: Conservation Benefit Concert",
        "category": "charity",
        "subcategory": "benefit",
        "venue_name": "Humphreys Concerts by the Bay",
        "venue_city": "San Diego",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 32.7170,
        "venue_lon": -117.2280,
        "venue_capacity": 650,
        "price": 50.0,
        "performer": "Jack Johnson & Ocean Voices",
        "days_ahead": 21,
        "time_str": "17:30:00",
        "demand": DemandTier.medium,
        "description": "100% of proceeds fund coral reef restoration and marine sanctuary protection. Enjoy sunset acoustic tunes directly by the yacht marina."
    },
    {
        "title": "Clean Water Initiative Charity Auction & Dinner",
        "category": "charity",
        "subcategory": "auction",
        "venue_name": "Seattle Waterfront Event Pier",
        "venue_city": "Seattle",
        "venue_state": "WA",
        "venue_country": "US",
        "venue_lat": 47.6080,
        "venue_lon": -122.3410,
        "venue_capacity": 350,
        "price": 90.0,
        "performer": "Charity: Water Leadership Team",
        "days_ahead": 28,
        "time_str": "18:30:00",
        "demand": DemandTier.medium,
        "description": "Funding sustainable solar-powered wells for remote communities. Live auction includes trips, sports memorabilia, and fine art."
    },

    # --- Networking ---
    {
        "title": "Founders, Angels & Venture Capital Mixer",
        "category": "networking",
        "subcategory": "tech_startup",
        "venue_name": "Bespoke Innovation Rooftop",
        "venue_city": "San Francisco",
        "venue_state": "CA",
        "venue_country": "US",
        "venue_lat": 37.7844,
        "venue_lon": -122.4065,
        "venue_capacity": 450,
        "price": 45.0,
        "performer": "Y Combinator & Sequoia Alumni Network",
        "days_ahead": 8,
        "time_str": "18:00:00",
        "demand": DemandTier.surge,
        "description": "High-signal mixer connecting pre-seed and Series A founders with top tier angels, syndicate leads, and venture partners over craft cocktails."
    },
    {
        "title": "Women in Tech Leadership & Mentorship Breakfast",
        "category": "networking",
        "subcategory": "leadership",
        "venue_name": "Midtown Executive Club",
        "venue_city": "New York",
        "venue_state": "NY",
        "venue_country": "US",
        "venue_lat": 40.7527,
        "venue_lon": -73.9772,
        "venue_capacity": 250,
        "price": 30.0,
        "performer": "Girls in Tech & Fortune 500 VPs",
        "days_ahead": 16,
        "time_str": "08:30:00",
        "demand": DemandTier.high,
        "description": "Empowering keynote sessions, breakout mentorship tables, and career strategy discussions for aspiring women engineering and product leaders."
    },
    {
        "title": "NextGen Product Managers Speed Networking Night",
        "category": "networking",
        "subcategory": "product",
        "venue_name": "Capital Factory Lounge",
        "venue_city": "Austin",
        "venue_state": "TX",
        "venue_country": "US",
        "venue_lat": 30.2689,
        "venue_lon": -97.7405,
        "venue_capacity": 300,
        "price": 25.0,
        "performer": "Reforge & Product School Community",
        "days_ahead": 22,
        "time_str": "18:30:00",
        "demand": DemandTier.medium,
        "description": "Structured 5-minute speed networking rotations followed by open social mixer for tech PMs, designers, and growth engineers."
    },

    # --- Kids ---
    {
        "title": "Junior Science Fair & Robotics Discovery Expo",
        "category": "kids",
        "subcategory": "stem",
        "venue_name": "Boston Children's Museum Hall",
        "venue_city": "Boston",
        "venue_state": "MA",
        "venue_country": "US",
        "venue_lat": 42.3524,
        "venue_lon": -71.0503,
        "venue_capacity": 500,
        "price": 20.0,
        "performer": "MIT Museum Science Educators",
        "days_ahead": 7,
        "time_str": "10:00:00",
        "demand": DemandTier.high,
        "description": "Exciting hands-on STEM experiments, LEGO Mindstorms battle robots, slime chemistry labs, and stargazing planetarium dome."
    },
    {
        "title": "Magic, Wonder & Illusion Family Spectacular",
        "category": "kids",
        "subcategory": "family",
        "venue_name": "Dr. Phillips Center Walt Disney Theater",
        "venue_city": "Orlando",
        "venue_state": "FL",
        "venue_country": "US",
        "venue_lat": 28.5375,
        "venue_lon": -81.3780,
        "venue_capacity": 800,
        "price": 35.0,
        "performer": "World Magic Guild Masters",
        "days_ahead": 14,
        "time_str": "14:00:00",
        "demand": DemandTier.surge,
        "description": "Mind-bending stage illusions, levitation, hilarious comedy magic, and interactive tricks where kids join the magicians on stage!"
    },
    {
        "title": "Dino Safari: Interactive Animatronic Adventure",
        "category": "kids",
        "subcategory": "dinosaurs",
        "venue_name": "Field Museum Touring Pavilion",
        "venue_city": "Chicago",
        "venue_state": "IL",
        "venue_country": "US",
        "venue_lat": 41.8663,
        "venue_lon": -87.6170,
        "venue_capacity": 600,
        "price": 28.0,
        "performer": "National Geographic Explorer Guides",
        "days_ahead": 21,
        "time_str": "11:30:00",
        "demand": DemandTier.high,
        "description": "Walk among life-sized, roaring T-Rex and Triceratops animatronics, dig for real fossil teeth, and earn Junior Paleontologist badges."
    }
]


def populate_db_and_csv():
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    added_count = 0

    print("Checking existing events in database...")
    existing_titles = {t.lower().strip() for (t,) in db.query(Event.title).all()}

    # Also load events_clean.csv to check max external_id
    csv_path = DATA_DIR / "events_clean.csv"
    csv_rows = []
    if csv_path.exists():
        df_csv = pd.read_csv(csv_path)
        base_ext_id = int(df_csv["event_id"].max()) + 1
    else:
        df_csv = pd.DataFrame()
        base_ext_id = 90000

    new_csv_rows = []

    for item in NEW_CATEGORY_EVENTS:
        title = item["title"]
        if title.lower().strip() in existing_titles:
            continue

        event_dt = now + timedelta(days=item["days_ahead"])
        # Parse time_str into event_dt
        h, m, s = map(int, item["time_str"].split(":"))
        event_dt = event_dt.replace(hour=h, minute=m, second=s, microsecond=0)

        sold_tickets = random.randint(15, int(item["venue_capacity"] * 0.4))

        event = Event(
            external_id=base_ext_id,
            organizer_id=None,
            title=title,
            description=item["description"],
            category=item["category"],
            subcategory=item["subcategory"],
            event_datetime=event_dt,
            venue_name=item["venue_name"],
            venue_city=item["venue_city"],
            venue_state=item["venue_state"],
            venue_country=item["venue_country"],
            venue_lat=item["venue_lat"],
            venue_lon=item["venue_lon"],
            venue_capacity=item["venue_capacity"],
            base_price=item["price"],
            current_price=item["price"],
            total_tickets=item["venue_capacity"],
            tickets_sold=sold_tickets,
            demand_tier=item["demand"],
            popularity_score=round(random.uniform(0.85, 0.99), 3),
            primary_performer_name=item["performer"],
        )
        db.add(event)
        db.flush()

        # Add checklist
        db.add(OperationsChecklist(event_id=event.id))

        # Add FAQs
        db.add(EventFAQ(
            event_id=event.id,
            question="What is the digital ticketing and entry policy?",
            answer="Strictly contactless digital QR code entry via the Etixo app. No printout required."
        ))
        db.add(EventFAQ(
            event_id=event.id,
            question="What is the refund or cancellation policy?",
            answer="Full refunds are automatically processed if cancelled at least 48 hours prior to start."
        ))

        # Add Terms
        db.add(EventTerm(event_id=event.id, term_text="All attendees must present valid photo identification matching the booking name."))
        db.add(EventTerm(event_id=event.id, term_text="Doors open 45 minutes prior to the scheduled start time."))

        existing_titles.add(title.lower().strip())
        added_count += 1

        # Add to CSV row
        new_csv_rows.append({
            "event_id": base_ext_id,
            "name": title,
            "category": item["category"],
            "subcategory": item["subcategory"],
            "datetime_utc": event_dt.strftime("%Y-%m-%d %H:%M:%S+00:00"),
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
            "venue_popularity": 350000,
            "performer_score_avg": 0.92,
            "performer_popularity_avg": 250000.0,
            "primary_performer_name": item["performer"],
            "event_popularity_score": round(random.uniform(0.85, 0.99), 3),
            "price_estimated": item["price"],
            "price_is_synthetic": True,
        })
        base_ext_id += 1

    db.commit()
    db.close()
    print(f"Successfully added {added_count} diverse events to the SQLite database!")

    # Update CSV if there are new rows
    if new_csv_rows and not df_csv.empty:
        df_new = pd.DataFrame(new_csv_rows)
        df_combined = pd.concat([df_csv, df_new], ignore_index=True)
        df_combined.to_csv(csv_path, index=False)
        print(f"Appended {len(new_csv_rows)} rows to {csv_path}!")


if __name__ == "__main__":
    populate_db_and_csv()
