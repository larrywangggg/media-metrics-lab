from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.upload import parse_upload
from sqlalchemy.orm import Session
from app.db.session import get_db

from app.services.jobs.service import creat_job_from_upload

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
