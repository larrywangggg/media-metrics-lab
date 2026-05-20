from fastapi import APIRouter, Response
import os

router = APIRouter()

@router.api_route("/health", methods=["GET", "HEAD"], tags=["system"])
def health():
    return Response(status_code=200)

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