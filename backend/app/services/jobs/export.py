from __future__ import annotations

import csv
import io
from typing import Iterable, Iterator, Optional 
from uuid import UUID

from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Job, Result

EXPORT_COLUMNS =[
    "platform",
    "url",
    "title",
    "views",
    "likes",
    "comments",
    "published_at",
    "engagement_rate",
    "status",
    "error_message",
]

def _calc_engagement_rate(views: Optional[int], likes: int, comments: int) -> str:
    """Return a string to keep CSV stable, blank when not calculable"""
    if not views or views <= 0:
        return ""
    l = likes or 0
    c = comments or 0
    return f"{(l + c) / views:.6f}" # 6 decimal places should be enough for engagement rate

def _iter_csv(rows:Iterable[Result])-> Iterator[str]:
    """
    Stream UTF-8 CSV text.
    Includes BOM so Excel is more likely to open UTF-8 correctly.
    """
    # UTF-8 BOM for Excel compatibility
    yield "\ufeff"
    
    buf = io.StringIO()
    writer = csv.writer(buf)
    
    # Write header
    writer.writerow(EXPORT_COLUMNS)
    yield buf.getvalue() 
    buf.seek(0)
    buf.truncate(0)
    
    for r in rows:
        writer.writerow([
            r.platform,
            r.url,
            r.title,
            r.views,
            r.likes,
            r.comments,
            r.published_at.isoformat() if r.published_at else "",
            _calc_engagement_rate(r.views, r.likes, r.comments),
            r.status,
            r.error_message or "",
        ])
        yield buf.getvalue()
        buf.seek(0)
        buf.truncate(0)
        
        
def export_job_results_csv(db: Session, job_id: UUID) -> StreamingResponse:
    """ Export results of a completed job as CSV. Raises HTTPException if job not found or not completed."""
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    if job.status != "completed":
        raise HTTPException(status_code=409, detail=f"Job not completed: {job_id} status={job.status}")
    
    stmt = (
        select(Result)
        .where(Result.job_id == job_id)
        .order_by(Result.id.asc())
    )
    rows = db.scalars(stmt).all()
    
    filename = f"job_{job_id}_results.csv"
    return StreamingResponse(
        _iter_csv(rows),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
    