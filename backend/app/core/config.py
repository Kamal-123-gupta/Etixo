"""
config.py — Centralized, environment-driven configuration.

All settings are read from environment variables / a .env file at the repo
root of `backend/`. Defaults are safe for local development (SQLite,
permissive CORS) but should be overridden via env vars in staging/prod
(Postgres/Neon URL, a real JWT secret, a locked-down CORS origin list).
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- App ---
    APP_NAME: str = "Agentic Ticket Booking API"
    ENV: str = "development"
    DEBUG: bool = True

    # --- Database ---
    # Defaults to a local SQLite file so the project runs with zero external
    # setup. Point this at Neon/Postgres in staging/prod, e.g.:
    #   postgresql+psycopg2://user:password@host/dbname?sslmode=require
    DATABASE_URL: str = "sqlite:///./ticket_booking.db"

    # --- Auth / JWT ---
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    # --- CORS ---
    # Vite dev server default + any deployed frontend origin(s), comma-separated via env.
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # --- LLM layer (pluggable; template-fallback agents work without this) ---
    LLM_PROVIDER: str = "none"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = ""

    # --- Recommendation / data ---
    DATA_DIR: str = "../data/processed"


@lru_cache
def get_settings() -> Settings:
    return Settings()