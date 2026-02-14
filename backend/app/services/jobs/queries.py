from __future__ import annotations

from typing import Any, Dict, List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Job, Result

def _job_to_dict(job: Job) -> Dict[str, Any]:
    return {
        "id": str(job.id),
        "status": job.status,
        "total_rows": job.total_rows,
        "processed_rows": job.processed_rows,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
    }
    
def _result_to_dict(r: Result) -> Dict[str, Any]:
    return{
        "id": r.id,
        "job_id": str(r.job_id),
        "platform": r.platform,
        "url": r.url,
        "status": r.status,
        "error_message": r.error_message,
        "title": r.title,
        "views": r.views,
        "likes": r.likes,
        "comments":r.comments,
        "published_at": r.published_at.isoformat() if r.published_at else None,
        "engagement_rate": r.engagement_rate,
    }
    
def list_jobs(db: Session, *, limit: int=20, offset: int=0) -> Dict[str, Any]:
    stmt = (
        select(Job)
        .order_by(Job.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    jobs: List[Job] = db.scalars(stmt).all()
    return {
        "limit": limit,
        "offset": offset,
        "items": [_job_to_dict(j) for j in jobs],
    }
    

def get_job_detail(db: Session, *, job_id: UUID) -> Dict[str, Any] | None:
    job = db.get(Job, job_id)
    if not job:
        return None
    return _job_to_dict(job)

def list_job_results(
    db: Session,
    *,
    job_id: UUID,
    limit: int=50,
    offset: int=0,
) -> Dict[str, Any] | None:
    job = db.get(Job, job_id)
    if not job:
        return None
    
    stmt= (
        select(Result)
        .where(Result.job_id == job_id)
        .order_by(Result.id.asc())
        .offset(offset)
        .limit(limit)
    )
    rows: List[Result] = db.scalars(stmt).all()
    
    return{
        "job": _job_to_dict(job),
        "limit": limit,
        "offset": offset,
        "items": [_result_to_dict(r) for r in rows],
    }