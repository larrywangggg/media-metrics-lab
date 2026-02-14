from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.services.jobs.service import creat_job_from_upload, mark_job_running, run_job_in_background
from app.services.jobs.queries import list_job_results, list_jobs, get_job_detail
from app.services.jobs.export import export_job_results_csv

router = APIRouter()

@router.post("/upload")
def upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        return creat_job_from_upload(db, file)
    except HTTPException: # re-raise HTTP exceptions to be handled by FastAPI's exception handlers
        raise 
    except Exception as e:
        db.rollback() # rollback the transaction in case of any exception to avoid partial commits
        raise HTTPException(status_code=500, detail=str(e)) # return a 500 Internal


@router.post("/{job_id}/run", status_code=202)
def run(job_id: UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        payload = mark_job_running(db, job_id)
        background_tasks.add_task(run_job_in_background, job_id)
        return payload
    except HTTPException: # re-raise HTTP exceptions to be handled by FastAPI's exception handlers
        raise 
    except Exception as e:
        db.rollback() # rollback the transaction in case of any exception to avoid partial commits
        raise HTTPException(status_code=500, detail=str(e)) # return a 500 Internal
    
    
    
@router.get("")
def get_jobs(limit: int=20, offset: int=0, db: Session = Depends(get_db)):
    limit = max(1, min(limit, 100))
    offset = max(0, offset)
    return list_jobs(db, limit=limit, offset=offset)

@router.get("/{job_id}")
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    data = get_job_detail(db, job_id=job_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    return data

@router.get("/{job_id}/results")
def get_results(
    job_id: UUID,
    limit: int=50,
    offset: int=0,
    db: Session=Depends(get_db)):
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    data = list_job_results(db, job_id=job_id, limit=limit, offset=offset)
    if not data:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    return data


@router.get("/{job_id}/export.csv",response_class=StreamingResponse)
def export_csv(job_id: UUID, db: Session = Depends(get_db)):
    try:
        return export_job_results_csv(db, job_id)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))