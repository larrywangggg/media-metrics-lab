from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.services.jobs.service import creat_job_from_upload, run_job

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


@router.post("/{job_id}/run")
def run(job_id: UUID, db: Session = Depends(get_db)):
    try:
        return run_job(db, job_id)
    except HTTPException: # re-raise HTTP exceptions to be handled by FastAPI's exception handlers
        raise 
    except Exception as e:
        db.rollback() # rollback the transaction in case of any exception to avoid partial commits
        raise HTTPException(status_code=500, detail=str(e)) # return a 500 Internal