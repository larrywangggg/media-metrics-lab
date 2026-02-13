from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.services.jobs.service import creat_job_from_upload, mark_job_running, run_job_in_background

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