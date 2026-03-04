from __future__ import annotations

import os
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

load_dotenv()  # Load local .env in development; ignored if not present.


def _normalize_database_url(database_url: str) -> str:
    """Normalize managed Postgres URLs to the SQLAlchemy psycopg3 dialect."""
    normalized = database_url.strip()
    if normalized.startswith("postgresql+psycopg://"):
        return normalized
    if normalized.startswith("postgresql://"):
        return "postgresql+psycopg://" + normalized[len("postgresql://") :]
    if normalized.startswith("postgres://"):
        return "postgresql+psycopg://" + normalized[len("postgres://") :]
    return normalized


def _resolve_database_url() -> str:
    # Prefer explicit DATABASE_URL. Fall back to common managed-DB variable.
    database_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    if database_url:
        return _normalize_database_url(database_url)

    raise RuntimeError(
        "Database URL not configured. Set DATABASE_URL (preferred) or POSTGRES_URL. "
        "For Vercel: Project Settings -> Environment Variables."
    )


engine = create_engine(_resolve_database_url())

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency. Creates a session per request and closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
