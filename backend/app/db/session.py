"""
session.py — Engine, session factory, and declarative base.

Swapping DATABASE_URL (e.g. from local SQLite to Neon/Postgres) is the only
change needed to move environments -- no code elsewhere depends on the
specific backend.
"""

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# SQLite needs this connect_arg when used from multiple threads (FastAPI's
# threadpool for sync routes); Postgres/Neon ignores it via the branch below.
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator:
    """FastAPI dependency: yields a request-scoped DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
