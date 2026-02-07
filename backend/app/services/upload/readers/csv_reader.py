from __future__ import annotations
import csv
import io
from typing import List, Optional, Any, Dict
from fastapi import UploadFile

from app.services.upload.utils import build_header_map

def read_csv_rows(file: UploadFile) -> List[Dict[str, Any]]:
    """
    Read a CSV UploadFile and extract raw rows containing only
    the required logical fields: platform and url.

    Input:
    - file: UploadFile pointing to a CSV file.

    Output:
    - List of dicts, each with keys:
      {
        "platform": Any,
        "url": Any
      }

    Notes:
    - This function performs NO validation.
    - Header names are matched case-insensitively.
    - Encoding is best-effort UTF-8 with BOM handling.
    - Row order is preserved.
    """
    
    file.file.seek(0) # ensure at the start
    raw_bytes = file.file.read()
    
    try:
        text = raw_bytes.decode("utf-8-sig") # handle potential BOM
    except UnicodeDecodeError:
        text = raw_bytes.decode("utf-8", errors="replace") # fallback with replacement
        
    reader = csv.DictReader(io.StringIO(text)) # DictReader handles header row and maps to dicts
    if not reader.fieldnames:
        return [] # empty file or no header
    
    key_map = build_header_map(reader.fieldnames) # get actual header names for "platform" and "url"
    rows: List[Dict[str, Any]] = []
    for row in reader:
        rows.append({
            "platform": row.get(key_map["platform"]),
            "url": row.get(key_map["url"])
            })
    return rows