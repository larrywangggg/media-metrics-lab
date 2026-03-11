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
        
        # Try to extract @username from Instagram URL (e.g. instagram.com/username/p/...)
        channel = None
        try:
            from urllib.parse import urlparse
            parts = [p for p in urlparse(url).path.split('/') if p and p not in ('p', 'reel', 'tv')]
            if parts:
                candidate = parts[0]
                channel = candidate if candidate.startswith('@') else f"@{candidate}"
        except Exception:
            pass

        return FetchResult(
            ok=False,
            url=url,
            platform=self.platform,
            channel=channel,
            title=None,
            views=None,
            likes=None,
            comments=None,
            published_at=None,
            error_message="Failed to fetch data from Instagram. This is a stub response for testing.",
        )