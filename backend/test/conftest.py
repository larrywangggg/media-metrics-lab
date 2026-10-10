"""
Shared fixtures for the PostgreSQL-backed test suite.

Tests run against a dedicated database (TEST_DATABASE_URL), never the dev or
production one. The schema is built once per session with Alembic, and every
table is truncated before each test that touches the database.
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import Callable, Iterator

import pytest
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BACKEND_DIR / ".env")  # lets developers put TEST_DATABASE_URL in backend/.env

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://app:app@localhost:5432/mediametrics_test",
)

# Must run before anything imports app.db.session, which builds its engine from
# DATABASE_URL at import time.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["YOUTUBE_FETCHER_IMPL"] = "stub"  # tests must never call YouTube
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-not-for-production")

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.exc import OperationalError  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

import app.db.models  # noqa: E402,F401  (registers every table on Base.metadata)
from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402

# Every test truncates all tables, so refuse to point at anything that does not
# look like a throwaway database.
if "test" not in (engine.url.database or ""):
    pytest.exit(
        f"Refusing to run: test database name {engine.url.database!r} must contain 'test'. "
        "Set TEST_DATABASE_URL to a dedicated database.",
        returncode=4,
    )


def _create_database_if_missing() -> None:
    try:
        with engine.connect():
            return
    except OperationalError as exc:
        if "does not exist" not in str(exc):
            raise

    name = engine.url.database
    admin = create_engine(engine.url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    try:
        with admin.connect() as conn:
            conn.execute(text(f'CREATE DATABASE "{name}"'))
    except Exception as exc:
        reason = str(getattr(exc, "orig", None) or exc).strip()
        pytest.exit(
            f"Test database {name!r} does not exist and could not be created: {reason}\n"
            f"Create it once with: createdb -h {engine.url.host} -p {engine.url.port or 5432} "
            f"-O {engine.url.username} {name}",
            returncode=4,
        )
    finally:
        admin.dispose()


@pytest.fixture(scope="session")
def run_alembic() -> Callable[..., None]:
    """Run an Alembic command against the test database, the same way app startup does."""

    def _run(*args: str) -> None:
        subprocess.run([sys.executable, "-m", "alembic", *args], cwd=BACKEND_DIR, check=True)

    return _run


@pytest.fixture(scope="session")
def migrated_db(run_alembic: Callable[..., None]) -> None:
    _create_database_if_missing()
    run_alembic("upgrade", "head")


@pytest.fixture
def clean_db(migrated_db: None) -> None:
    # Truncate before (not after) each test so a failing test leaves its rows behind to inspect.
    tables = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))


@pytest.fixture
def db(clean_db: None) -> Iterator[Session]:
    """A session for arranging and asserting on rows directly in Postgres."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(clean_db: None) -> TestClient:
    # Not used as a context manager on purpose: that would trigger the app lifespan,
    # which re-runs migrations in a subprocess for every test. migrated_db covers it.
    return TestClient(app)


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    resp = client.post("/auth/register", json={"username": "test_user", "password": "test_pass"})
    assert resp.status_code == 201, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}
