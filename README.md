# 🎟️ Agentic AI for Intelligent Event Discovery & Ticket Booking Platform

> A 9-agent, AI-native reimagining of event discovery and ticket booking — where autonomous agents personalize discovery, automate organizer workflows, optimize pricing and marketing, and protect the platform from fraud, instead of relying on static, rule-based ticketing systems.


---

## 📌 Table of Contents

1. [Project Overview](#-project-overview)
2. [Problem Statement](#-problem-statement)
3. [Objectives](#-objectives)
4. [Key Features](#-key-features)
5. [System Architecture](#-system-architecture)
6. [AI Agent Workflow](#-ai-agent-workflow)
7. [Recommendation Engine](#-recommendation-engine)
8. [Technology Stack](#-technology-stack)
9. [Repository Structure](#-repository-structure)
10. [Backend Architecture](#-backend-architecture)
11. [Database Overview](#-database-overview)
12. [Installation Guide](#-installation-guide)
13. [Running the Project](#-running-the-project)
14. [Environment Variables](#-environment-variables)
15. [Future Improvements](#-future-improvements)
16. [Project Roadmap](#-project-roadmap)
17. [Contributors](#-contributors)
18. [License](#-license)
19. [Acknowledgements](#-acknowledgements)

---

## Project Overview

Modern event platforms — District, BookMyShow, MakeMyTrip Events, Eventbrite, Ticketmaster — are excellent at **transaction management** but weak at **understanding the user**. Discovery is filter-driven rather than intent-driven, organizers manually write descriptions and campaigns, pricing is largely static, support is human-bottlenecked, and fraud detection is reactive.

This project reimagines the event booking platform as an **Agentic AI ecosystem**: a set of nine specialized, collaborating agents that continuously learn from user behavior and platform signals to personalize discovery, automate organizer operations, optimize revenue, and protect the platform — all without hardcoded, rule-only logic driving the experience.

The product is built and demoed through **three simulated personas/portals** in a single React application — **Attendee**, **Organizer**, and **Admin** — plus a dedicated **AI Support** portal, so that every agent's behavior is directly visible and testable in the UI before the corresponding production service exists.

---

## Problem Statement

> How can AI continuously understand customer preferences, automate event management, optimize ticket sales, and proactively assist organizers and attendees through autonomous decision-making — instead of relying on traditional rule-based event management systems?

Specifically, the platform addresses:

| Gap in existing platforms | Agentic AI response |
|---|---|
| Preferences & booking history are underused | **Personalization Agent** builds a dynamic user profile from interests, location, and behavior |
| Discovery relies on manual filters, not intent | **Event Discovery Agent** parses natural-language search queries |
| Organizers manually write descriptions, FAQs, T&Cs | **Event Creation Assistant Agent** generates content via GenAI |
| Marketing content is manually produced per channel | **Marketing Campaign Agent** auto-generates & schedules campaigns |
| Pricing is static | **Dynamic Pricing & Promotion Agent** adjusts price to real-time demand |
| Support depends on human agents for repetitive queries | **Customer Support Agent** handles bookings, refunds, and FAQs conversationally |
| Fraud detection is reactive | **Fraud Detection Agent** screens transactions in real time |
| Organizers lack proactive insight | **Organizer Intelligence Agent** surfaces sales/engagement analytics |
| Event-day readiness is manually tracked | **Event Operations Agent** automates readiness checklists & QR ticketing |

---

## Objectives

Build an Agentic AI Event Discovery and Ticket Booking Platform that:

- Personalizes event recommendations based on user interests and behavior
- Assists organizers in creating and publishing high-quality events
- Generates marketing content automatically for multiple channels
- Optimizes ticket sales through intelligent, demand-aware pricing
- Provides AI-powered customer support for booking, refunds, and event queries
- Detects fraudulent bookings and suspicious activity in real time
- Delivers intelligent insights and recommendations to organizers

**Expected outcomes:** a highly personalized discovery experience, increased sales via intelligent marketing/pricing, reduced organizer manual effort, faster AI-driven support, stronger fraud protection, better organizer decision-making, and a scalable agentic ecosystem that continuously learns and adapts for attendees, organizers, and admins.

---

## Key Features

### Attendee Portal
- Natural-language event search with live intent parsing (category, location, price ceiling)
- Personalized "Recommended for You" rail driven by a live preferences profile
- Real-time demand badges (`Low` / `Medium` / `High` / `Surge`) and live ticket-sold progress bars
- Event details page with a **dynamic price lock countdown**, simulated checkout, and inline fraud-agent interception demo

### Organizer Console
- **Insights tab** — revenue, tickets sold, and sales-velocity analytics (charted)
- **Create Event tab** — AI-assisted event creation: auto-generated description, FAQs, and terms & conditions from a title/category/location
- **Marketing tab** — one-click AI campaign generation across WhatsApp, Email, and X (Twitter), with simulated send counts and engagement rates
- **Operations tab** — automated event-readiness checklist (QR checkpoints, venue systems, payment hooks) with a live readiness score

### Admin Dashboard
- Platform-wide stats: attendee clusters, gross revenue, total purchases, active fraud warnings
- Live fraud detection log with severity, IP, and transaction detail
- User preference/segment overview for platform-level personalization insight

### AI Support Portal
- Conversational assistant covering refunds/cancellations, ticket/QR questions, dynamic pricing explanations, and fraud-block explanations
- Human escalation flow ("escalate" / "human" / "operator") to simulate Level‑2 support hand-off

### Cross-Cutting: Live Agent Notification Feed
- A persistent, real-time notification center in the navbar surfaces every agent action as it happens (pricing changes, fraud blocks, campaign creation, QR activation, event readiness updates) — making the multi-agent system observable, not a black box.

---

## System Architecture

The platform integrates the existing frontend with a backend, database, AI agent layer, LLM layer, and recommendation engine into one cohesive system.

```
                              ┌────────────────────────────────────────────┐
                              │                CLIENTS                     │
                              │  Attendee UI · Organizer UI · Admin UI ·    │
                              │  Support UI   (React 19 + Vite, this repo)  │
                              └───────────────────────┬──────────────────────┘
                                                       │ REST / JSON (JWT auth)
                                                       ▼
                              ┌────────────────────────────────────────────┐
                              │                API LAYER                    │
                              │   FastAPI · Routers · Middleware · Auth     │
                              └───────────────────────┬──────────────────────┘
                                                       │
                 ┌─────────────────────────────────────┼─────────────────────────────────────┐
                 ▼                                     ▼                                     ▼
     ┌───────────────────────┐          ┌───────────────────────────┐         ┌───────────────────────────┐
     │   CORE SERVICES        │          │        AGENT LAYER         │         │   RECOMMENDATION ENGINE    │
     │  Users · Events ·       │◄────────►│  9 collaborating agents    │◄───────►│  Feature engineering ·     │
     │  Bookings · Organizers  │          │  (rule-based / direct exec │         │  Content-based model ·     │
     │                         │          │   / LLM-generation)        │         │  Behavior signals           │
     └───────────┬─────────────┘          └──────────────┬─────────────┘         └──────────────┬─────────────┘
                 │                                        │                                     │
                 ▼                                        ▼                                     ▼
     ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
     │                                     DATABASE LAYER (PostgreSQL)                                     │
     │   users · preferences · events · bookings · campaigns · fraud_logs · agent_logs · notifications      │
     └───────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                       │
                                                       ▼
                                        ┌───────────────────────────┐
                                        │          LLM LAYER          │
                                        │  Pluggable LLM API for      │
                                        │  NLP parsing & content-gen  │
                                        └───────────────────────────┘
```


1. The **frontend** (this repo's `src/`) calls a REST API, authenticated via JWT.
2. The **API layer** routes requests to core CRUD services or to the **agent layer**.
3. Agents read/write through core services and the **database**, call the **LLM layer** for NLP/generation tasks (discovery intent parsing, content generation, support responses), and call the **recommendation engine** for personalization/ranking.
4. Every agent action is written to an `agent_logs` table and surfaced back to the frontend via the notification feed — the same UX pattern already implemented client-side in this prototype.

---

## AI Agent Workflow

Nine agents are defined across the problem statement and the 6-week plan. **Where the two documents used slightly different names for overlapping responsibilities, the roster below follows the naming actually implemented in this repo's frontend simulation** (`src/context/AppContext.jsx`), since per-document conflicts are resolved in favor of what's built. Each agent uses one (or a combination) of three operational approaches: **rule-based logic**, **direct execution**, or **LLM generation** — consistent with the 6-week plan.

| # | Agent | Approach | Currently simulated in `AppContext.jsx` |
|---|---|---|---|
| 1 | Event Discovery Agent | Rule-based intent parsing → LLM (planned) | `parsedIntent` in `AttendeePortal.jsx` |
| 2 | User Preference & Personalization Agent | Rule-based → ML ranking (planned) | `recommendedEvents` filter in `AttendeePortal.jsx` |
| 3 | Event Creation Assistant Agent | LLM generation | `generateAICopy()` |
| 4 | Marketing Campaign Agent | LLM generation + direct execution | `triggerMarketingCampaign()` |
| 5 | Dynamic Pricing & Promotion Agent | Rule-based | Price-fluctuation `useEffect` interval + price-lock countdown |
| 6 | Fraud Detection Agent | Rule-based | Fraud checks inside `createBooking()` |
| 7 | Customer Support Agent | Rule-based → LLM (planned) | `sendSupportMessage()` |
| 8 | Organizer Intelligence Agent | Direct execution (analytics) | Insights tab charts in `OrganizerConsole.jsx` |
| 9 | Event Operations Agent | Direct execution | Ops checklist tab + QR/readiness notifications |

### Agent-by-agent detail

#### 1. Event Discovery Agent
- **Purpose:** Understand natural-language search queries and surface relevant events.
- **Inputs:** Free-text query, user location, budget.
- **Outputs:** Parsed intent object (`category`, `location`, `maxPrice`) used to filter/rank the event list.
- **Interactions:** Frontend (search bar) → LLM layer (intent extraction, planned) → Recommendation Engine (ranking) → Database (event catalog).
- **Trigger:** On search input change (debounced in production).
- **Current implementation:** keyword/regex-based intent parsing in `AttendeePortal.jsx`; production version replaces this with an LLM-backed NLU call.

#### 2. User Preference & Personalization Agent
- **Purpose:** Maintain a living profile of each user's interests, location, and spend pattern; drive the "Recommended for You" rail.
- **Inputs:** Explicit preference toggles, booking history, browsing behavior.
- **Outputs:** Ranked list of events per user; updated preference vector.
- **Interactions:** Frontend (preference selector) → Database (`preferences` table) → Recommendation Engine.
- **Trigger:** Preference change, new booking, session start.

#### 3. Event Creation Assistant Agent
- **Purpose:** Reduce organizer effort by auto-drafting event descriptions, FAQs, T&Cs, and SEO copy.
- **Inputs:** Event title, category, location, base price.
- **Outputs:** Generated description, FAQ list, terms list (organizer can review/edit before publishing).
- **Interactions:** Organizer Console (Create Event tab) → LLM layer → Database (`events` table) → Event Operations Agent (auto-registers readiness checklist).
- **Trigger:** Organizer submits "Generate with AI" in the create-event form.

#### 4. Marketing Campaign Agent
- **Purpose:** Automatically produce and "schedule" channel-specific promotional content.
- **Inputs:** Target event, selected channel (WhatsApp / Email / X).
- **Outputs:** Campaign record with generated copy, simulated reach, and engagement rate.
- **Interactions:** Organizer Console (Marketing tab) → LLM layer (copy generation) → Database (`campaigns` table) → Notification feed.
- **Trigger:** Organizer clicks "Launch Campaign".

#### 5. Dynamic Pricing & Promotion Agent
- **Purpose:** Continuously adjust ticket price based on demand velocity and remaining inventory.
- **Inputs:** `ticketsSold`, `totalTickets`, demand tier, elapsed time.
- **Outputs:** Updated price; demand-tier reclassification (`Low → Medium → High → Surge`); price-lock countdown for attendees mid-checkout.
- **Interactions:** Booking flow → Database (`events.price`) → Notification feed → Organizer Intelligence Agent (feeds sales-velocity charts).
- **Trigger:** Interval tick (simulated every 45s), and immediately after every successful booking.

#### 6. Fraud Detection Agent
- **Purpose:** Screen every booking attempt for suspicious patterns before it's confirmed.
- **Inputs:** Ticket quantity, payment details (cardholder name, card number), IP/session signal.
- **Outputs:** `allow` / `deny` decision; fraud log entry with severity when denied.
- **Interactions:** Checkout flow (`createBooking()`) → Database (`fraud_logs`) → Admin Dashboard → Notification feed.
- **Trigger:** Every booking submission, pre-confirmation.
- **Current rules (prototype):** bulk quantity (> 10 tickets), flagged/test cardholder names, known test-card fingerprints. Production version layers in a trained anomaly-detection model.

#### 7. Customer Support Agent
- **Purpose:** Resolve common attendee queries conversationally; escalate to a human when needed.
- **Inputs:** Free-text chat message.
- **Outputs:** Contextual response (refunds, tickets/QR, pricing explanation, fraud explanation) or escalation hand-off.
- **Interactions:** Support Portal → LLM layer (planned upgrade from keyword matching) → Database (`support_messages`, `bookings` for context).
- **Trigger:** New chat message.

#### 8. Organizer Intelligence Agent
- **Purpose:** Give organizers proactive, data-backed insight into how their events are performing.
- **Inputs:** Aggregated bookings, revenue, campaign engagement.
- **Outputs:** Sales-velocity, revenue, and demand-distribution charts; recommendations (planned: attendance prediction).
- **Interactions:** Organizer Console (Insights tab) ← Database (aggregation queries across `bookings`, `events`, `campaigns`).
- **Trigger:** Dashboard load / periodic refresh.

#### 9. Event Operations Agent
- **Purpose:** Ensure an event is operationally ready before it goes live — inventory, QR/check-in systems, venue data, reminders.
- **Inputs:** Event metadata, checklist task states.
- **Outputs:** Readiness score; QR ticket activation confirmations; reminder scheduling (planned).
- **Interactions:** Organizer Console (Operations tab) → Database (`agent_logs`, event readiness state) → Notification feed → Customer Support Agent (answers "is my QR active?" style queries).
- **Trigger:** New event created, checklist item toggled, successful booking (QR activation).

---

## Recommendation Engine

The Recommendation Engine powers Agents #1 and #2 and is designed as its own pipeline, separate from — but consumed by — the agent layer.

| Component | Description |
|---|---|
| **User Preference Agent** | Maintains the live preference vector (explicit tags + implicit behavior) documented in Agent #2 above. |
| **Recommendation Pipeline** | Candidate generation (category/location/budget filter) → feature scoring → ranking → serve top‑N. |
| **Feature Engineering** | User features: preferred categories, location, historical spend, budget ceiling. Event features: category, price, location, demand tier, recency. |
| **Content-based recommendations** | Match event attributes (category, price band, location) against the user's declared and inferred preferences — the baseline approach called out in the 6-week plan (Python + `pandas`/`scikit-learn`). |
| **Behavior-based personalization** | Booking history and click-through signals feed back into the preference vector to bias future rankings. |
| **Future hybrid possibilities** | Collaborative filtering across similar user clusters; embedding-based semantic similarity between a user's natural-language queries and event descriptions (via the LLM/embedding layer). |
| **API contract with frontend** | `GET /recommendations?userId=...` → ranked event list, consumed by the "Recommended for You" section already implemented in `AttendeePortal.jsx`. |
| **Storage** | Preference vectors and recommendation feedback events persisted in the `preferences` and `agent_logs` tables; served with low-latency reads (caching candidate for high-traffic periods). |
| **Evolution over time** | Preferences update on every booking/interaction; the plan's Week 3–5 timeline explicitly includes tuning recommendation accuracy against a sample dataset and A/B comparison against a baseline. |

> 🗒️ **Assumption:** The 6-week plan documents the *approach* (content-based, Python/`pandas`/`scikit-learn`, later NLP via an LLM for the Discovery Agent) but not a finalized model choice or hyperparameters — those are intentionally left as implementation detail for the recommendation track, not fabricated here.

---

## Technology Stack

| Layer | Technology | Why it fits |
|---|---|---|
| **Frontend framework** | React 19 + Vite 8 | Already implemented; fast HMR dev loop, modern React (hooks-first architecture) |
| **Routing** | React Router 7 (`HashRouter`) | Already implemented; simple multi-portal navigation without server-side routing config |
| **Styling** | Tailwind CSS 4 | Already implemented; utility-first styling matching the dark, agent-console aesthetic |
| **Charts** | Recharts | Already implemented; Organizer Intelligence Agent's sales/revenue visualizations |
| **Icons** | lucide-react | Already implemented across all portals |
| **Backend framework** | Python + FastAPI *(proposed)* | Async-friendly, typed request/response models, pairs naturally with a Python AI/ML stack |
| **Auth** | JWT | Named directly in the 6-week plan (Day 4: "defined auth approach (JWT)") |
| **Database** | PostgreSQL *(proposed)* | Relational integrity for users/events/bookings/preferences as scoped in the plan's DB schema task |
| **ORM / migrations** | SQLAlchemy + Alembic *(proposed)* | Standard, typed data-access layer for a FastAPI backend |
| **AI / ML framework** | `pandas`, `scikit-learn` | Explicitly named in the 6-week plan for the recommendation stack |
| **LLM layer** | Pluggable LLM API (provider-agnostic) | Plan specifies "LLM API for NLP agents" without naming a fixed provider — kept configurable |
| **Embeddings (future)** | `sentence-transformers` *(optional, proposed)* | Enables semantic search/hybrid recommendations beyond content-based filtering |
| **Vector DB (future)** | Chroma or `pgvector` *(optional, proposed)* | Only needed once embedding-based recommendations/search are introduced |
| **Containerization** | Docker + Docker Compose *(proposed)* | Reproducible local/staging environments across frontend, backend, and database |
| **Deployment** | Cloud host TBD (Render / Railway / similar) *(proposed)* | Plan reaches a "staging deployment" milestone in Week 6 without naming a specific host |
| **Testing** | `pytest` (backend), Vitest/RTL (frontend) *(proposed)* | Standard testing stacks for the respective ecosystems |
| **CI/CD** | GitHub Actions *(proposed)* | Automates lint/test/build on push, consistent with the plan's Week 6 integration/deploy phase |
| **Logging & monitoring** | Structured logging via `agent_logs` table + platform logs *(proposed)* | Every agent action is auditable, matching the plan's DB schema note ("agent logs") |
| **Documentation** | Markdown (this README + inline docstrings) | GitHub-native, low friction for recruiters/developers |

---

## Repository Structure

```
.
├── src/                        # frontend source
│   ├── assets/                 # Images (hero.png, icons)
│   ├── components/
│   │   └── Navbar.jsx          # Portal switcher + live agent notification feed
│   ├── context/
│   │   └── AppContext.jsx      # Global state + all 9 agents' client-side simulation logic
│   ├── pages/
│   │   ├── AttendeePortal.jsx  # Discovery, search intent, personalized recs
│   │   ├── EventDetails.jsx    # Booking flow, dynamic price lock, fraud demo
│   │   ├── OrganizerConsole.jsx# Insights / Create / Marketing / Operations tabs
│   │   ├── AdminDashboard.jsx  # Fraud logs, revenue, user clusters
│   │   └── SupportPortal.jsx   # AI support chat simulation
│   ├── App.jsx                 # Route table
│   ├── App.css / index.css     # Global styles
│   └── main.jsx                # App entry point
├── public/                     # static assets (favicon, icon sprite)
├── index.html                  # Vite HTML entry
├── vite.config.js              # 
├── package.json                # 
│
├── backend/                    # API + agent + recommendation services
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── api/                 # Routers: auth, events, bookings, users, organizer, admin, support, agents
│   │   ├── core/                 # Config, security (JWT), logging, middleware
│   │   ├── services/             # Business logic shared across routers/agents
│   │   ├── agents/                # One module per agent (see Agent Workflow section)
│   │   │   ├── discovery_agent.py
│   │   │   ├── personalization_agent.py
│   │   │   ├── event_creation_agent.py
│   │   │   ├── marketing_agent.py
│   │   │   ├── pricing_agent.py
│   │   │   ├── fraud_agent.py
│   │   │   ├── support_agent.py
│   │   │   ├── organizer_intelligence_agent.py
│   │   │   └── operations_agent.py
│   │   ├── recommendation/        # Feature engineering + ranking pipeline
│   │   ├── llm/                   # Pluggable LLM client / router
│   │   ├── models/                # SQLAlchemy models + Pydantic schemas
│   │   ├── db/                    # Session management, Alembic migrations
│   │   └── utils/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── database/                    # schema docs / migration reference
│   └── schema.md
│
├── docs/                        # problem statement, 6-week plan, diagrams
│   ├── problem-statement.md
│   └── 6-week-plan.pdf
│
├── .github/
│   └── workflows/                # CI (lint, test, build)
│
├── docker-compose.yml            # frontend + backend + Postgres, local orchestration
└── README.md                     # This file
```

---

## 🔧 Backend Architecture

| Layer | Responsibility |
|---|---|
| **API Layer** | REST endpoints grouped by domain: `/auth`, `/events`, `/bookings`, `/users`, `/organizer`, `/admin`, `/support`, `/agents/*` |
| **Authentication** | JWT-based login/signup, role claims for `attendee`, `organizer`, `admin` |
| **Controllers / Routers** | Thin request/response handling, delegate to services |
| **Services** | Core business logic: booking creation, inventory decrement, campaign creation, ticket QR issuance |
| **AI Modules (Agents)** | Each of the 9 agents as an independent, testable module invoked by services or routers |
| **Recommendation Engine** | Standalone module consumed by the Discovery & Personalization agents |
| **Database Layer** | SQLAlchemy models + Alembic migrations against PostgreSQL |
| **Utilities** | Formatting, ID generation, notification dispatch helpers |
| **Configuration** | Environment-driven config (`.env` → `pydantic-settings`) |
| **Middleware** | CORS, request logging, error handling |
| **Logging** | Structured logs + persisted `agent_logs` entries per agent action, mirroring the live notification feed already in the frontend |
| **Security** | Password hashing, JWT verification, rate limiting on booking/auth endpoints (per Week 5 of the plan) |
| **Validation** | Pydantic request/response models across every endpoint |
| **Background Tasks** | Async jobs for campaign "sending", price re-evaluation ticks, and reminder scheduling — mirroring the `setInterval` dynamic-pricing simulation already in the frontend, moved server-side |

---
### Core tables

| Table | Purpose | Key fields |
|---|---|---|
| `users` | Attendees, organizers, and admins | `id`, `name`, `email`, `password_hash`, `role`, `location` |
| `preferences` | Personalization vector per user | `id`, `user_id` (FK → `users`), `categories[]`, `budget`, `ticket_tier` |
| `events` | Event catalog | `id`, `organizer_id` (FK → `users`), `title`, `description`, `category`, `date`, `time`, `location`, `base_price`, `current_price`, `total_tickets`, `tickets_sold`, `demand_tier`, `risk_factor`, `image_url` |
| `event_faqs` | Generated/edited FAQs per event | `id`, `event_id` (FK), `question`, `answer` |
| `event_terms` | Generated/edited T&Cs per event | `id`, `event_id` (FK), `term_text` |
| `bookings` | Ticket purchases | `id`, `event_id` (FK), `user_id` (FK), `quantity`, `price_paid`, `qr_code`, `status`, `created_at` |
| `campaigns` | Marketing Campaign Agent output | `id`, `event_id` (FK), `channel`, `status`, `content`, `sent_count`, `engagement_rate` |
| `fraud_logs` | Fraud Detection Agent decisions | `id`, `booking_attempt_id`, `type`, `severity`, `ip`, `user_ref`, `event_id` (FK), `details`, `timestamp` |
| `support_messages` | Customer Support Agent chat history | `id`, `user_id` (FK), `sender`, `message`, `escalated`, `timestamp` |
| `agent_logs` | Auditable log of every agent action, across all 9 agents | `id`, `agent_name`, `action_type`, `related_entity_id`, `message`, `timestamp` |
| `notifications` | Denormalized feed backing the navbar notification center | `id`, `user_id` (FK, nullable for org-wide), `message`, `type`, `unread`, `timestamp` |

### Relationships & flow

- **User flow:** `users` 1—1 `preferences`; a user's `role` gates access to the Organizer/Admin portals (already reflected by the portal-switcher UI).
- **Event flow:** `events` 1—N `event_faqs`, `events` 1—N `event_terms`; each event belongs to one organizer (`users`).
- **Booking flow:** `bookings` N—1 `events`, `bookings` N—1 `users`; every successful booking decrements `events.tickets_sold` and re-evaluates `demand_tier`/`current_price` (Dynamic Pricing Agent), then issues a `qr_code` (Event Operations Agent).
- **Ticket flow:** QR code generation and validation state travel with the `bookings` row rather than a separate table, matching the current prototype's `qrCode` field on each booking.
- **Organizer flow:** `events.organizer_id` scopes the Organizer Console's Insights/Marketing/Operations tabs to that organizer's own events.
- **AI-related data:** every agent decision (pricing change, fraud block, campaign creation, recommendation served) is written to `agent_logs`, which is the audit trail behind the notification feed and behind Organizer/Admin analytics.

---

## ⚙️ Installation Guide

### Prerequisites
- **Node.js** ≥ 18 and npm (for the frontend)
- **Python** ≥ 3.11 (for the proposed backend)
- **PostgreSQL** ≥ 14 (proposed database)
- **Docker** (optional, for containerized local setup)

### 1. Clone the repository
```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Frontend setup (already implemented)
```bash
npm install
```

### 3. Backend setup (proposed)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Database setup (proposed)
```bash
# Create the database
createdb ticket_booking_db

# Run migrations
cd backend
alembic upgrade head
```

---

## Running the Project

### Frontend (already implemented)
```bash
npm run dev
```
Runs on Vite's default dev server (typically `http://localhost:5173`). Build for production with `npm run build`, preview with `npm run preview`, and lint with `npm run lint` (oxlint).

### Backend (proposed)
```bash
cd backend
uvicorn app.main:app --reload
```

### Full stack via Docker Compose (proposed)
```bash
docker compose up --build
```
## Environment Variables

**Frontend (`.env` at repo root, Vite-prefixed):**
```env
VITE_API_BASE_URL=http://localhost:8000
```

**Backend (`backend/.env`):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ticket_booking_db
JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
LLM_API_KEY=your-llm-provider-key
LLM_PROVIDER=openai   # or anthropic / other — kept pluggable per the plan
```
## Future Improvements

- Replace keyword/regex-based intent parsing (Discovery Agent, Support Agent) with true LLM-backed NLU
- Upgrade the content-based recommendation baseline to a hybrid (collaborative + embedding-based) model
- Move Dynamic Pricing Agent's simulated `setInterval` tick to a real server-side scheduled job
- Add a trained anomaly-detection model to the Fraud Detection Agent, alongside its existing rule-based checks
- Real payment gateway integration (the frontend already scaffolds a Razorpay-style checkout flow)
- Role-based access control enforcement end-to-end (organizer-scoped data, admin-only routes)
- Automated E2E tests across all three portals

---

## Project Roadmap

| Week | Focus | Key milestones |
|---|---|---|
| **1** | Foundation & Planning | Use-case alignment, architecture & tech stack proposal, DB schema design, environment setup, wireframes |
| **2** | Core Platform Build | Event listing/search UI, baseline content-based recommendation model, Event/User CRUD APIs, booking + mock payment flow, JWT auth |
| **3** | Intelligent Agents — Discovery & Personalization | NLP search intent, User Preference & Personalization Agent (live behavioral features), Event Creation Assistant Agent, Customer Support Agent + combined agent testing |
| **4** | Intelligent Agents — Marketing, Pricing, Fraud & Ops | Marketing Campaign Agent, Fraud Detection Agent, Dynamic Pricing & Promotion Agent, Organizer Intelligence Agent, Event Operations Agent — **feature freeze reached** |
| **5** | Testing, Refinement & Security | UI hardening, API security (rate limiting, input validation), fraud threshold tuning, load testing, recommendation A/B evaluation, full E2E integration testing |
| **6** | Final Integration, Deployment & Demo | Full user-journey testing, punch-list fixes, staging deployment, documentation, final demo & retrospective |
---
