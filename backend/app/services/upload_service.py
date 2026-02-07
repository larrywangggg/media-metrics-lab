
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Any, Dict, Tuple

import csv
import io
import os

from fastapi import UploadFile

# @dataclass(frozen=True)
# class ParsedRow:
#     row_index: int # 1-based index (excluding header)
#     platform: Optional[str]
#     url: Optional[str]
#     error_messages: Optional[str]
    
#     # Convert to dict for JSON serialization
#     def to_dict(self) -> Dict[str, Any]: 
#         d: Dict[str, Any] = {
#             "row_index": self.row_index,
#             "platform": self.platform,
#             "url": self.url,
#         }
#         if self.error_messages:
#             d["error_messages"] = self.error_messages
#         return d


SUPPORTED_PLATFORMS = {"youtube","tiktok","instagram"}
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB


def parse_upload(file: UploadFile) -> Dict[str, Any]:
    """
    Parse the uploaded CSV/XLSX file and validate rows into a normalised internal format.
    Returns: {
      "total_rows: int,
      "valid_rows: int,
      "invalid_rows: int,
      "rows: [{"row_index":int,#1-based index (excluding header)
                "platform":str|None,
                "url":str|None,
                "error_messages"?:[str,...]
              }]
    }
    Notes:
    - This function does NOT persist anything.
    - It is deterministic: it always returns per-row results, even if rows are invalid.
    """
    
    
    