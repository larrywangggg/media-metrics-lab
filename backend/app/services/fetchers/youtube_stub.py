"""
YouTube fetcher:
- Default: returns hardcoded stub data (MVP behaviour)
- Optional: uses yt-dlp to extract real YouTube metadata (views/likes/comments/title/published_at)

Switch via env:
- YOUTUBE_FETCHER_IMPL=stub|yt_dlp
Optional stability knobs:
- YOUTUBE_INNERTUBE_KEY=... (Innertube API key, optional)
- YOUTUBE_PO_TOKEN=... (PO token, optional)
- YTDLP_PROXY=http://... (optional)
- YTDLP_COOKIES_FILE=/path/to/cookies.txt (optional)
"""

from __future__ import annotations
from .types import FetchResult
from datetime import datetime, timezone
import os
from typing import Any, Dict, Optional

try:
    import yt_dlp
    from yt_dlp.utils import DownloadError
except Exception: #yt-dlp is not installed or failed to import, we will fall back to the stub implementation
    yt_dlp = None 
    DownloadError = Exception

# Helper functions for constructing FetchResult objects and parsing yt-dlp output/errors
def _success(
    *,
    url:str,
    platform:str,
    title: Optional[str] = None,
    views: Optional[int] = None,
    likes: Optional[int] = None,
    comments: Optional[int] = None,
    published_at: Optional[datetime] = None,
) -> Dict[str, Any]:
    return {
        "ok": True,
        "url": url,
        "platform": platform,
        "title": title,
        "views": views,
        "likes": likes,
        "comments": comments,
        "published_at": published_at,
        "error_message": None,
    }

def _fail(*, url:str, platform:str, msg:str) -> Dict[str, Any]:
    return {
        "ok": False,
        "url": url,
        "platform": platform,
        "title": None,
        "views": None,
        "likes": None,
        "comments": None,
        "published_at": None,
        "error_message": msg,
    }
    
def _parse_timestamp(info: Dict[str, Any]) -> Optional[datetime]:
    ts = info.get("timestamp")
    if isinstance(ts, (int, float)):
        return datetime.fromtimestamp(int(ts), tz=timezone.utc)
    
    upload_date = info.get("upload_date")
    if isinstance(upload_date, str) and len(upload_date) == 8 and upload_date.isdigit():
        try:
            dt = datetime.strptime(upload_date, "%Y%m%d")
            return dt.replace(tzinfo=timezone.utc) #yt-dlp upload_date is in YYYYMMDD format, we parse it and set timezone to UTC
        except ValueError:
            return None
    return None

def _map_ytdlp_error(e: Exception) -> str:
    text = str(e)[:500] #truncate to avoid excessively long error messages
    lowered = text.lower()
    
    # Heuristic mapping of common yt-dlp error messages to user-friendly explanations
    if "private video" in lowered or "confirm your age" in lowered:
        return "This video is private, age-restricted, or requires authentication."
    if "video unavailable" in lowered or "this video is not available" in lowered:
        return "This video is unavailable."
    if "timed out" in lowered or "timeout" in lowered or "connection" in lowered:
        return "Network error while fetching YouTube metadata(timeout/connection)."
    if "429" in lowered or "rate limit" in lowered or "too many requests" in lowered:
        return "Rate limited by YouTube. Please try again later."
    if "unsupported url" in lowered or "invalid url" in lowered:
        return "Invalid YouTube URL."
    return f"yt-dlp failed: {text}"




class YouTubeFetcherStub:
    """
    This file needs to be renamed later, for now keep for compatibility with the factory. 
    The actual implementation will be switched via env var YOUTUBE_FETCHER_IMPL.
    
    Behaviour:
    - If YOUTUBE_FETCHER_IMPL != 'yt_dlp': return stub data
    - Else: use yt-dlp to extract real metrics
    """
    
    
    platform = "youtube"
    
    def __init__(self) -> None:
        self.impl = os.getenv("YOUTUBE_FETCHER_IMPL", "stub").strip().lower() #fall back to stub if not set or invalid
        #Optional: yt-dlp YouTube extractor knobs
        self.innertube_key = os.getenv("YOUTUBE_INNERTUBE_KEY")
        self.po_token = os.getenv("YOUTUBE_PO_TOKEN")
        self.proxy = os.getenv("YTDLP_PROXY")
        self.cookies_file = os.getenv("YTDLP_COOKIES_FILE")
        
    
    def fetch(self, url:str) -> Dict[str, Any]:
        if self.impl != "yt_dlp":
            #Return stub data for MVP or if yt-dlp is not available
            return _success(
            url=url,
            platform=self.platform,
            title="Example YouTube Video",
            views=123456,
            likes=7890,
            comments=123,
            published_at=datetime.now(timezone.utc),
        )
        if yt_dlp is None:
            return _fail(url=url, platform=self.platform, msg="yt-dlp is not available. Please install yt-dlp or switch to stub implementation.")
        
        return self._fetch_with_ytdlp(url)
            
    def _fetch_with_ytdlp(self, url:str) -> Dict[str, Any]:
        extractor_args: Dict[str, Dict[str, list[str]]] = {}
        
        # Add YouTube-specific extractor args if provided via env vars
        youtube_args: Dict[str, list[str]] = {}
        if self.innertube_key:
            youtube_args["innertube_api_key"] = [self.innertube_key]
        if self.po_token:
            youtube_args["po_token"] = [self.po_token]
        if youtube_args:
            extractor_args["youtube"] = youtube_args
            
        # Construct yt-dlp options
        ydl_opts: Dict[str, Any] = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "noplaylist": True,
            "extractor_args": extractor_args if extractor_args else None,
            }
        
        if self.proxy:
            ydl_opts["proxy"] = self.proxy
        if self.cookies_file:
            ydl_opts["cookiefile"] = self.cookies_file
            
        ydl_opts = {k: v for k, v in ydl_opts.items() if v is not None} #remove None values
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if not isinstance(info, dict):
                    return _fail(url=url, platform=self.platform, msg="yt-dlp returned unexpected data format.")
                
                title = info.get("title")
                views = info.get("view_count")
                likes = info.get("like_count")
                comments = info.get("comment_count")
                published_at = _parse_timestamp(info)
                
                # ensure ints where possible, else None
                def _to_int(x:Any) -> Optional[int]:
                    try:
                        return int(x) if x is not None else None
                    except Exception:
                        return None
                    
            return _success(
                url=url,
                platform=self.platform,
                title=title if isinstance(title, str) else None,
                views=_to_int(views),
                likes=_to_int(likes),
                comments=_to_int(comments),
                published_at=published_at,
            )
            
        except DownloadError as e:
            return _fail(url=url, platform=self.platform, msg=_map_ytdlp_error(e))
        except Exception as e:   
            return _fail(url=url, platform=self.platform, msg=f"Unexpected error: {e}")