""""Public exports for fetchers module."""

from .factory import get_fetcher
from .base import PlatformFetcher
from .types import FetchResult

__all__ = [
    "PlatformFetcher",
    "FetchResult",
    "get_fetcher",
]