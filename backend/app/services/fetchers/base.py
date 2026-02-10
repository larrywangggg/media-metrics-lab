"""
Fetcher interface(Protocol).
"""

from __future__ import annotations
from typing import Protocol
from .types import FetchResult

class PlatformFetcher(Protocol):
    platform : str
    
    def fetch(self, url:str) -> FetchResult: ...
    
    