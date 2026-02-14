from __future__ import annotations

import os
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

load_dotenv()  # take environment variables from .env.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable not set"
        "Create backend/.env from backend/.env.example and set DATABASE_URL."
        )

print("DATABASE_URL =", DATABASE_URL)
engine = create_engine(DATABASE_URL)

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