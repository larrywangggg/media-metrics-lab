from __future__ import annotations
from typing import List, Optional, Any, Dict
from fastapi import UploadFile

from app.services.upload.utils import infer_extension, looks_like_csv, looks_like_xlsx, normalise_cell, build_header_map, guard_file
from app.services.upload.types import ParsedRow
from app.services.upload.readers.csv_reader import read_csv_rows
from app.services.upload.readers.xlsx_reader import read_xlsx_rows
from app.services.upload.validators import validate_row

def parse_upload(file: UploadFile) -> Dict[str, Any]:
    """
    Parse the uploaded CSV/XLSX file and validate rows into a normalised internal format.

    Returns:
    {
      "total_rows": int,
      "valid_rows": int,
      "invalid_rows": int,
      "rows": [
        {
          "row_index": int,   # 1-based index (excluding header)
          "platform": str | None,
          "url": str | None,
          "error_messages"?: [str, ...]
        }
      ]
    }

    Notes:
    - This function does NOT persist anything to the database.
    - It is deterministic: it always returns per-row results,
      even if some or all rows are invalid.
    - It orchestrates file reading, validation, and summarisation,
      but delegates actual logic to reader/validator helpers.
    """
    
    guard_file(file)
    
    filename = (file.filename or "").strip()
    ext = infer_extension(filename)
    
    if ext == ".csv":
        raw_rows = read_csv_rows(file)
    elif ext == ".xlsx":
        raw_rows = read_xlsx_rows(file)
    else:
        # fallback: content-type sniffing
        if looks_like_csv(file.content_type):
            raw_rows = read_csv_rows(file)
        elif looks_like_xlsx(file.content_type):
            raw_rows = read_xlsx_rows(file)
        else:
            raise ValueError(
                f"Unsupported file type. Please upload CSV or XLSX. "
                f"Got filename='{filename}', content_type='{file.content_type}'."
            )
            
    parsed: List[ParsedRow] = []
    for i, row in enumerate(raw_rows, start=1):
        platform_raw = normalise_cell(row.get("platform"))
        url_raw = normalise_cell(row.get("url"))
        
        platform, url, errors = validate_row(platform_raw, url_raw)
        
        parsed.append(
            ParsedRow(
            row_number=i,
            platform=platform,
            url=url,
            errors_messages=errors,)
            )
    
    total_rows = len(parsed)
    valid_rows = sum(1 for r in parsed if not r.errors_messages) 
    invalid_rows = total_rows - valid_rows
    
    return {
        "total_rows": total_rows,
        "valid_rows": valid_rows,
        "invalid_rows": invalid_rows,
        "rows": [r.to_dict() for r in parsed], # convert dataclass instances to dicts for JSON serialization
        }
