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

    @staticmethod
    def normalize_edge(edge):
        print(f"working with edge: {edge}")
        if isinstance(edge, tuple) or hasattr(edge, "__getitem__"):
            return Edge(
                edge[0],
                edge[1],
                getattr(edge, "data", None),
                getattr(edge, "conditional", False),
                getattr(edge, "condition", None),
                getattr(edge, "metadata", {}),
            )
        elif hasattr(edge, "source") and hasattr(edge, "target"):
            return Edge(
                edge.source,
                edge.target,
                getattr(edge, "data", None),
                getattr(edge, "conditional", False),
                getattr(edge, "condition", None),
                getattr(edge, "metadata", {}),
            )
        else:
            raise ValueError(f"Unknown edge format: {type(edge)} - {edge}")

    def to_dict(self):
        return {
            "source": self.source,
            "target": self.target,
            "data": self.data,
            "conditional": self.conditional,
            "metadata": self.metadata,
        }
