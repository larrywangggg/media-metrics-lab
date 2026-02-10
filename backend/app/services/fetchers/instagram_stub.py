"""""
Instagram stub fetcher for failure testing, returns hardcoded data for MVP issue#7.
"""

from __future__ import annotations
from .types import FetchResult
class InstagramFetcherStub:
    platform = "instagram"
    
    def fetch(self, url:str) -> FetchResult:
        # In a real implementation, you would parse the URL and make API calls to Instagram here.
        # For this stub, we return hardcoded data that simulates a failure.
        
        return FetchResult(
            ok=False,
            url=url,
            platform=self.platform,
            title=None,
            views=None,
            likes=None,
            comments=None,
            published_at=None,
            error_message="Failed to fetch data from Instagram. This is a stub response for testing.",
        )