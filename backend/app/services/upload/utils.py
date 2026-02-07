from __future__ import annotations
from typing import List, Optional, Any, Dict
import os
from fastapi import UploadFile

SUPPORTED_PLATFORMS = {"youtube","tiktok","instagram"}
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB

def infer_extension(filename: str) -> str:
    """
    Infer file extension from filename.

    Returns:
    - Lowercased extension including leading dot (e.g. '.csv'),
      or empty string if none.
    """
    _, ext = os.path.splitext((filename or "").lower()) #handles None or empty string
    return ext


def looks_like_csv(content_type: Optional[str]) -> bool:
    if not content_type:
        return False
    ct = content_type.lower()
    return ("csv" in ct) or (ct == "text/plain") # some browsers use text/plain for CSV uploads

def looks_like_xlsx(content_type: Optional[str]) -> bool:
    if not content_type:
        return False
    ct = content_type.lower()
    return (
        ("excel" in ct) 
        or ("spreadsheet" in ct) 
        or (ct == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        )# common MIME type for XLSX files

def normalise_cell(value: Any) -> Optional[str]:
    """
    Convert a raw cell value into a clean string or None.

    Behaviour:
    - None -> None
    - Whitespace-only -> None
    - Other values -> stripped string
    """
    if value is None:
        return None #treat None as None, not as "None" string
    if isinstance(value, str):
        s = value.strip()
        return s if s else None #treat empty or whitespace-only strings as None
    s = str(value).strip()
    return s if s else None

def build_header_map(fieldnames: List[str]) -> Dict[str, str]:
    """
    Build a mapping from logical field names ('platform', 'url')
    to actual column names in the file.

    Raises:
    - ValueError if required columns are missing.

    Notes:
    - Matching is case-insensitive.
    """
    lowered = {name.strip().lower(): name for name in fieldnames if name is not None}
    if "platform" not in lowered or "url" not in lowered:
        raise ValueError("CSV must contain 'platform' and 'url' columns (case-insensitive)")
    return{"platform": lowered["platform"], "url": lowered["url"]}

def guard_file(file: UploadFile) -> None:
    """
    Perform basic sanity checks on an uploaded file.

    Checks:
    - File is present
    - File size does not exceed MAX_FILE_SIZE_BYTES

    Raises:
    - ValueError if file is missing or too large.

    Notes:
    - This is a defensive guard, not business validation.
    """
    
    if file is None:
        raise ValueError("No file uploaded.")
    
    f = file.file # UploadFile is a FastAPI wrapper; `file.file` is the underlying file-like.
                  # binary stream that supports seek() and tell().

    try:
        pos = f.tell() #store current position
        f.seek(0, os.SEEK_END) #seek to end to get size
        size = f.tell()
        f.seek(pos) #reset to original position
        if size > MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds maximum limit of {MAX_FILE_SIZE} bytes.")
    except Exception:
         # best-effort; ignore if not seekable
        return 
   
        