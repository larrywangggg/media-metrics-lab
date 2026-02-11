from __future__ import annotations

from typing import Any, Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.models import Job, Result
from app.services.upload import parse_upload
from app.services.fetchers import get_fetcher

import uuid
from fastapi import HTTPException



def creat_job_from_upload(db: Session, file) -> Dict[str, Any]:
    parsed = parse_upload(file) # This should return a dict with keys 'total_rows' and 'data'
    
    rows: List[dict] = parsed["rows"]
    valid_rows = [r for r in rows if not r.get("error_messages")] # Assuming error_messages is a list of strings if there are validation errors
    invalid_rows = [r for r in rows if r.get("error_messages")]
    
    job = Job(
        status="queued",
        total_rows=len(valid_rows),
        processed_rows=0,
    )
    
    db.add(job)
    db.flush() # to get the job.id assigned
    
    results = [
        Result(
            job_id = job.id,
            platform = r["platform"],
            url = r["url"],
            status = "queued",
            error_message = None,
        )
        for r in valid_rows # only create Result entries for valid rows
    ]
    
    if results:
        db.add_all(results) # add all results to the session at once
        
    db.commit() # commit the transaction to persist Job and Result entries
    
    
    return {
        "job_id": str(job.id),
        "total_rows": parsed["total_rows"],
        "valid_rows": len(valid_rows),
        "invalid_rows": len(invalid_rows),
        "invalid_preview": [
            {
                "row_index": r["row_index"],
                "error_messages": r.get("error_messages", []),
            }
            for r in invalid_rows[:20] # include a preview of the first 20 invalid rows with their error messages
        ]
    }
    
    
def process_job(db: Session, job_id: uuid.UUID) -> Dict[str, int]:
    """Short row processor for issue#7, matches stub style"""
    results = db.scalars(
        select(Result)
        .where(Result.job_id == job_id, Result.status == "queued")
        .order_by(Result.id.asc())
    ).all() # get all queued results for the job, ordered by id to maintain consistent processing order
    
    success_rows = 0
    failed_rows = 0
    for row in results:
        fetch_result = get_fetcher(row.platform).fetch(row.url)
        if fetch_result["ok"]:
            row.title = fetch_result["title"]
            row.views = fetch_result["views"]
            row.likes = fetch_result["likes"]
            row.comments = fetch_result["comments"]
            row.published_at = fetch_result["published_at"]
            row.status = "success"
            row.error_message = None
            success_rows += 1
        else:
            row.status = "failed"
            row.error_message = fetch_result["error_message"]
            failed_rows += 1
    
    return {
        "processed_rows": len(results),
        "success_rows": success_rows,
        "failed_rows": failed_rows,
    }
    

def run_job(db: Session, job_id: uuid.UUID) -> Dict[str, Any]:
    """Manual endpoint adapter: thin wrapper around process_job."""
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    
    job.status = "running"
    db.flush() # persist the status change before processing
    
    summary = process_job(db, job_id)
    job.processed_rows = summary["processed_rows"]
    job.status = "completed"
    db.commit() # commit the transaction to persist all changes
    
    return {
        "job_id": str(job.id),
        "status": job.status,
        "total_rows": job.total_rows,
        "processed_rows": summary["processed_rows"],
        "success_rows": summary["success_rows"],
        "failed_rows": summary["failed_rows"],
    }
    