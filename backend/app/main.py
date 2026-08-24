"""
main.py — FastAPI application entry point.

Run locally with:
    uvicorn app.main:app --reload

On startup, creates any DB tables that don't exist yet (fine for local
SQLite dev). Once this ships to staging/prod against Postgres/Neon, switch
to Alembic migrations (`alembic upgrade head`) as the source of truth
instead of relying on create_all — the migrations/ folder is already set
up for that.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import admin, agents, auth, bookings, events, organizer, support, users
from app.core.config import get_settings
from app.db.session import Base, engine

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(events.router)
app.include_router(bookings.bookings_router)
app.include_router(bookings.router)
app.include_router(organizer.router)
app.include_router(admin.router)
app.include_router(support.router)
app.include_router(agents.router)


@app.get("/health")
def health():
    return {"status": "ok"}
