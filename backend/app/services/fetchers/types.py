"""
Shared data types for platform fetchers.
"""

from __future__ import annotations
from typing import  Optional, TypedDict
from datetime import datetime

class FetchResult(TypedDict):
    ok : bool
    url : str
    platform : str
    
    #success upload fields
    title : Optional[str]
    views : Optional[int]
    likes : Optional[int]
    comments : Optional[int]
    published_at : Optional[datetime]
    
    #error upload fields
    error_message : Optional[str]