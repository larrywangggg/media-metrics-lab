from __future__ import annotations

from typing import Any, Dict, List
from sqlalchemy.orm import Session

from app.db.models import Job, Result
from app.services.upload import parse_upload


def creat_job_from_upload(db:Session, file) -> Dict[str, Any]:
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
            job_id=job.id,
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
                "row_index" : r["row_index"],
                "error_messages": r.get("error_messages", []),
            }
            for r in invalid_rows[:20] # include a preview of the first 20 invalid rows with their error messages
        ]
    }