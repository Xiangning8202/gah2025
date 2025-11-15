from typing import Dict, List, Optional, Any, Callable
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime


# -------------------------------------------------------------------
# Node Type
# -------------------------------------------------------------------
class NodeType(Enum):
    """Types of nodes in the graph."""

    STEP = "step"  # A normal LangGraph state update node
    AGENT = "agent"  # Full LLM agent
    TOOL = "tool"  # A tool/function inside the graph
    TESTING = "testing"  # A testing node injected by our platform
    SYSTEM = "system"  # START / END / internal nodes


# -------------------------------------------------------------------
# Node
# -------------------------------------------------------------------
@dataclass
class Node:
    """
    Represents a node in YOUR workflow layer.
    Not extracted from user code—created from a LangGraph object.

    Matches langgraph's Node structure:
    - id: str (required)
    - name: str (required)
    - data: Any (the callable/data from langgraph, can be None)
    - metadata: Optional[Any] (can be None)
    """

    id: str
    name: str
    data: Optional[Any] = None
    metadata: Optional[Any] = None

    # Additional fields for backward compatibility and execution tracking
    node_type: NodeType = NodeType.STEP
    is_testing: bool = False
    test_config: Dict[str, Any] = field(default_factory=dict)
    execution_count: int = 0
    last_executed: Optional[datetime] = None
    execution_history: List[Dict[str, Any]] = field(default_factory=list)

    @property
    def function(self) -> Optional[Callable]:
        """Backward compatibility: returns data if it's callable."""
        if callable(self.data):
            return self.data
        return None

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Executes the underlying LangGraph step."""
        print(f"data: {self.data}, typeof: {type(self.data)}")
        if self.data is None or not callable(self.data):
            raise ValueError(f"Node {self.name} has no callable data")

        try:
            output = self.data(state)

            # Record execution
            self.execution_count += 1
            self.last_executed = datetime.now()
            self.execution_history.append(
                {
                    "timestamp": self.last_executed.isoformat(),
                    "input": state.copy(),
                    "output": output,
                    "success": True,
                }
            )

            if isinstance(output, dict):
                return output
            return {"result": output}

        except Exception as e:
            self.execution_count += 1
            self.last_executed = datetime.now()
            self.execution_history.append(
                {
                    "timestamp": self.last_executed.isoformat(),
                    "input": state.copy(),
                    "error": str(e),
                    "success": False,
                }
            )
            raise

    @staticmethod
    def normalize_node(node):
        is_system_node = node.id.startswith("__") and node.id.endswith("__")
        node_type = NodeType.SYSTEM if is_system_node else NodeType.STEP
        fun = getattr(node.data, "name", None)

        return Node(
            id=node.id,
            name=node.id,
            data=fun,
            metadata={},
            node_type=node_type,
        )
