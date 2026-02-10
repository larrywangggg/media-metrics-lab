"""
YouTube fetcher stub, returns hardcoded data for MVP issue#7.
"""

from __future__ import annotations
from .types import FetchResult
from datetime import datetime, timezone

class YouTubeFetcherStub:
    platform = "youtube"
    
    def fetch(self, url:str) -> FetchResult:
        # In a real implementation, you would parse the URL and make API calls to YouTube here.
        # For this stub, we return successfulhardcoded data.
        
        return FetchResult(
            ok=True,
            url=url,
            platform=self.platform,
            title="Example YouTube Video",
            views=123456,
            likes=7890,
            comments=123,
            published_at=datetime.now(timezone.utc),
            error_message=None,
        )