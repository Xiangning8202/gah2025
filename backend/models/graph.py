from typing import Dict, List, Any, Set
import uuid
from langchain_core.runnables.graph import Graph as LangChainGraph

from models.node import Node, NodeType
from models.edge import Edge


class Graph:
    """
    Represents a workflow graph created FROM the user's LangGraph object.
    """

    def __init__(
        self,
        graph: LangChainGraph,
        name: str = "",
        description: str = "",
    ):
        self.nodes: Dict[str, Node] = {}
        self.edges: List[Edge] = []

        for node_id, node in graph.nodes.items():
            is_system_node = node_id.startswith("__") and node_id.endswith("__")
            node_type = NodeType.SYSTEM if is_system_node else NodeType.STEP
            self.nodes[node_id] = Node(
                id=node_id,
                name=node_id,
                data="Callable()",
                metadata={},
                node_type=node_type,
            )

        for edge in graph.edges:
            try:
                if isinstance(edge, tuple) or hasattr(edge, "__getitem__"):
                    source_id, target_id = edge[0], edge[1]
                    data = getattr(edge, "data", None)
                    conditional = getattr(edge, "conditional", False)
                    condition = getattr(edge, "condition", None)
                    metadata = getattr(edge, "metadata", {})

                elif hasattr(edge, "source") and hasattr(edge, "target"):
                    source_id, target_id = edge.source, edge.target
                    data = getattr(edge, "data", None)
                    conditional = getattr(edge, "conditional", False)
                    condition = getattr(edge, "condition", None)
                    metadata = getattr(edge, "metadata", {})

                else:
                    raise ValueError(f"Unknown edge format: {type(edge)} - {edge}")

                self.edges.append(
                    Edge(
                        source=source_id,
                        target=target_id,
                        data=data,
                        conditional=conditional,
                        condition=condition,
                        metadata=metadata,
                    )
                )

            except (IndexError, TypeError) as e:
                raise ValueError(
                    f"Cannot convert edge to Edge model: {edge} (error: {e})"
                )

        # Additional fields
        self.id: str = str(uuid.uuid4())
        self.name: str = name
        self.description: str = description

        # Auto-detect start and end nodes from edges
        self.start_nodes: Set[str] = set()
        self.end_nodes: Set[str] = set()
        self._update_start_end_nodes()

        # Execution environment
        self.execution_state: Dict[str, Any] = {}
        self.execution_history: List[Dict[str, Any]] = []
        self.is_running: bool = False

    def _update_start_end_nodes(self):
        """Updates start_nodes and end_nodes based on edges."""
        if not self.edges:
            return

        all_sources = {e.source for e in self.edges}
        all_targets = {e.target for e in self.edges}

        # Start nodes are sources that are never targets (or __start__)
        self.start_nodes = all_sources - all_targets
        if "__start__" in self.nodes:
            self.start_nodes.add("__start__")

        # End nodes are targets that are never sources (or __end__)
        self.end_nodes = all_targets - all_sources
        if "__end__" in self.nodes:
            self.end_nodes.add("__end__")

    def to_dict(self) -> Dict[str, Any]:
        """Convert graph to dictionary representation."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "nodes": {
                nid: {
                    "id": n.id,
                    "name": n.name,
                    "node_type": n.node_type.value,
                    "is_testing": n.is_testing,
                }
                for nid, n in self.nodes.items()
            },
            "edges": [e.to_dict() for e in self.edges],
            "start_nodes": list(self.start_nodes),
            "end_nodes": list(self.end_nodes),
        }

    # ------------------------------------------------------
    # Node + Edge management
    # ------------------------------------------------------

    # def add_node(self, node: Node) -> str:
    #     """Add a node to the graph."""
    #     self.nodes[node.id] = node
    #     return node.id

    # def add_edge(
    #     self,
    #     source_id: str,
    #     target_id: str,
    #     condition: Callable = None,
    #     metadata: Dict[str, Any] = None,
    #     data: Any = None,
    #     conditional: bool = False,
    # ) -> Edge:
    #     """Add an edge to the graph."""
    #     edge = Edge(
    #         source=source_id,
    #         target=target_id,
    #         data=data,
    #         conditional=conditional,
    #         condition=condition,
    #         metadata=metadata or {},
    #     )
    #     self.edges.append(edge)
    #     self._update_start_end_nodes()
    #     return edge

    # def get_node(self, node_id: str) -> Optional[Node]:
    #     """Get a node by ID."""
    #     return self.nodes.get(node_id)

    # def get_edges_from(self, node_id: str) -> List[Edge]:
    #     """Get all edges originating from a node."""
    #     return [e for e in self.edges if e.source == node_id]

    # def get_edges_to(self, node_id: str) -> List[Edge]:
    #     """Get all edges pointing to a node."""
    #     return [e for e in self.edges if e.target == node_id]
