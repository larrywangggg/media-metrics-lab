"""Database session management.

Supports SQLite for local development and any SQLAlchemy compatible
connection string via the `DATABASE_URL` environment variable in production.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker