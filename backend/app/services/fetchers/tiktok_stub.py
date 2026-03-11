"""
TikTok stub fetcher for failure testing, returns hardcoded data for MVP issue#7.
"""

from __future__ import annotations
from .types import FetchResult

class TikTokFetcherStub:
    platform = "tiktok"
    
    def fetch(self, url:str) -> FetchResult:
        # In a real implementation, you would parse the URL and make API calls to TikTok here.
        # For this stub, we return hardcoded data that simulates a failure.
        
        # Try to extract @username from TikTok URL (e.g. tiktok.com/@username/video/...)
        channel = None
        try:
            from urllib.parse import urlparse
            for part in urlparse(url).path.split('/'):
                if part.startswith('@'):
                    channel = part
                    break
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
            error_message="Failed to fetch data from TikTok. This is a stub response for testing.",
        )