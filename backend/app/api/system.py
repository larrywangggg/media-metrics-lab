from fastapi import APIRouter
import os

router = APIRouter()

@router.get("/meta", tags=["system"])
def meta():
    """
    Return runtime metadata that the frontend can display.
    This is deliberately future-proof: UI should not depend on 'stub' existing.
    """
    return {
        "fetchers": {
            "youtube": os.getenv("YOUTUBE_FETCHER_IMPL", "unknown"),
        }
    }