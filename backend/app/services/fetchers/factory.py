from __future__ import annotations
from fastapi import HTTPException

from .base import PlatformFetcher
from .instagram_stub import InstagramFetcherStub
from .tiktok_stub import TikTokFetcherStub      
from .youtube_stub import YouTubeFetcherStub

def get_fetcher(platform:str) -> PlatformFetcher:
    
    normalized = platform.strip().lower()
    
    if normalized == "youtube":
        return YouTubeFetcherStub()
    if normalized == "instagram":
        return InstagramFetcherStub()
    if normalized == "tiktok":
        return TikTokFetcherStub()
    
    raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")