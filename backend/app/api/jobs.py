from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.upload import parse_upload

router = APIRouter()

@router.post("/upload")
def upload(file: UploadFile = File(...)):
    return parse_upload(file)
