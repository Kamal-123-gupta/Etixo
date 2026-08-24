"""
conftest.py — Test fixtures.

Points DATABASE_URL at a throwaway temp-file SQLite DB *before* app.main
(and therefore app.db.session, which creates the engine at import time) is
ever imported, so tests never touch the real dev database
(backend/ticket_booking.db) or require Postgres.
"""

import os
import tempfile

import pytest

_tmp_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_dir}/test.db"
os.environ["JWT_SECRET_KEY"] = "test-secret"

from fastapi.testclient import TestClient  # noqa: E402

from app.db.session import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_db():
    """Every test gets a clean slate -- tests otherwise share one temp-file
    DB for the whole session (see module docstring), so without this,
    fixtures re-registering the same email across test functions would
    collide. Also clears the pricing agent's in-process price-lock dict,
    since IDs restart at 1 each test and a stale lock from a prior test
    could otherwise leak into a new one."""
    from app.agents.pricing_agent import _price_locks

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    _price_locks.clear()
    yield


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def organizer_headers(client):
    client.post(
        "/auth/register",
        json={
            "name": "Org Tester",
            "email": "org-tester@test.com",
            "password": "password123",
            "role": "organizer",
        },
    )
    r = client.post("/auth/login", json={"email": "org-tester@test.com", "password": "password123"})
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def attendee_headers(client):
    client.post(
        "/auth/register",
        json={
            "name": "Attendee Tester",
            "email": "attendee-tester@test.com",
            "password": "password123",
            "role": "attendee",
        },
    )
    r = client.post("/auth/login", json={"email": "attendee-tester@test.com", "password": "password123"})
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
