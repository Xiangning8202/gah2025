from typing import Dict, List, Any, Set
import uuid
from graph_helper import LangGraphCtxHelper

from node import Node
from edge import Edge


class CallableGraph:
    """
    Represents a workflow graph created FROM the user's LangGraph object.
    """

    def __init__(
        self,
        helper: LangGraphCtxHelper,
        name: str = "",
        description: str = "",
    ):
        self.helper = helper
        graph = helper.lc_graph

        self.nodes: Dict[str, Node] = {}
        self.edges: List[Edge] = []

        for node in graph.nodes.values():
            node = Node.normalize_node(node)
            if node.data is not None:
                node.data = self.helper.ex_tool(node.data)
            self.nodes[node.id] = node

        for edge in graph.edges:
            edge = Edge.normalize_edge(edge)
            self.edges.append(edge)

        # Additional fields
        self.id: str = str(uuid.uuid4())
        self.name: str = name
        self.description: str = description
        self.state = {}

        # Auto-detect start and end nodes from edges
        self.start_nodes: Set[str] = set()
        self.end_nodes: Set[str] = set()
        self._update_start_end_nodes()

        # Execution environment
        self.execution_state: Dict[str, Any] = {}
        self.execution_history: List[Dict[str, Any]] = []
        self.is_running: bool = False

    def run_node(self, node_id: str) -> Dict[str, Any]:
        node = self.nodes[node_id]
        output = node.execute(self.state)
        self.state.update(output)
        return output

    def run_all_nodes(self) -> Dict[str, Any]:
        for node_id, node in self.nodes.items():
            if node.data is not None:
                output = node.execute(self.state)
                self.state.update(output)
        return self.state

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
