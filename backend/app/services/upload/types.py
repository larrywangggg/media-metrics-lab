from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Any, Dict

@dataclass(frozen=True)
class ParsedRow:
    row_index: int # 1-based index (excluding header)
    platform: Optional[str]
    url: Optional[str]
    error_messages: Optional[List[str]]
    
    # Convert to dict for JSON serialization
    def to_dict(self) -> Dict[str, Any]: 
        d: Dict[str, Any] = {
            "row_index": self.row_index,
            "platform": self.platform,
            "url": self.url,
        }
        if self.error_messages:
            d["error_messages"] = self.error_messages
        return d