from __future__ import annotations
from typing import List, Optional, Tuple

SUPPORTED_PLATFORMS = {"youtube","tiktok","instagram"}
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB

def normalise_platform(platform: Optional[str]) -> Optional[str]:
    if not platform:
        return None
    p = platform.strip().lower()
    mapping = {
        "yt": "youtube",
        "youtube.com": "youtube",
        "tt": "tiktok",
        "tik tok": "tiktok",
        "ig": "instagram",
        "insta": "instagram",
    }
    return mapping.get(p,p)

def validate_row(platform_raw: Optional[str], url_raw: Optional[str]) -> Tuple[Optional[str],Optional[str],List[str]]:
    errors: List[str] = []
    platform = normalise_platform(platform_raw)
    
    if not platform:
        errors.append("Platform is required.")
    elif platform not in SUPPORTED_PLATFORMS:
        errors.append(f"Unsupported platform. Platform must be one of: {sorted(SUPPORTED_PLATFORMS)}")
        
    url = url_raw.strip() if url_raw else None
    if not url:
        errors.append("URL is required.")
    
    return platform if platform else None, url if url else None, errors