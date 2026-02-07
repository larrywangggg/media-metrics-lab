from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.upload import parse_upload

router = APIRouter()

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    return await parse_upload(file)
