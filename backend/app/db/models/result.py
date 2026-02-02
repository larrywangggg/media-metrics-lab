from __future__ import annotations
from app.db.base import Base

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Float, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

class Result(Base):
    __tablename__ = "results"
    
    id: Mapped[int]= mapped_column(primary_key=True, autoincrement=True)
    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True),
                                              ForeignKey("jobs.id",ondelete="CASCADE"), 
                                              nullable=False)
    platform: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    views: Mapped[int | None] = mapped_column(Integer, nullable=True)
    likes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comments: Mapped[int | None] = mapped_column(Integer, nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    engagement_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default = "queued")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Define your columns and relationships here