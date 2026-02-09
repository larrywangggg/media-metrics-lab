from __future__ import annotations

from app.db.base import Base
import uuid
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

class Job(Base):
    __tablename__ = "jobs"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="queued")
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(),
        onupdate=func.now(),)
    
    total_rows: Mapped[int | None] = mapped_column(Integer, nullable=False, default=0)
    processed_rows: Mapped[int | None] = mapped_column(Integer, nullable=False, default=0)

    # Define your columns and relationships here    