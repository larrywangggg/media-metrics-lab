from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.upload_service import parse_upload

router = APIRouter()

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    return parse_upload(file)
