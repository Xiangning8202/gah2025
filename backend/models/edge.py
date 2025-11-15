from typing import Dict, Optional, Any, Callable
from dataclasses import dataclass, field


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
    - conditional: bool (required)
    """

    source: str
    target: str
    conditional: bool = False

    # Additional fields for backward compatibility
    condition: Optional[Callable] = None  # For conditional LangGraph routes
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self):
        return {
            "source": self.source,
            "target": self.target,
            "conditional": self.conditional,
            "metadata": self.metadata,
        }
