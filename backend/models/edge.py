from typing import Dict, List, Optional, Any, Callable, Set
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import uuid


# -------------------------------------------------------------------
# Edge
# -------------------------------------------------------------------
@dataclass
class Edge:
    """
    Represents a directed edge between nodes.
    
    Matches langgraph's Edge structure:
    - source: str (required)
    - target: str (required)
    - data: Optional[Any] (can be None)
    - conditional: bool (required)
    """
    source: str
    target: str
    data: Optional[Any] = None
    conditional: bool = False

    # Additional fields for backward compatibility
    condition: Optional[Callable] = None  # For conditional LangGraph routes
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self):
        return {
            "source": self.source,
            "target": self.target,
            "data": self.data,
            "conditional": self.conditional,
            "metadata": self.metadata,
        }

