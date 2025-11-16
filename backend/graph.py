from typing import Dict, List, Any, Set
import uuid
from graph_helper import LangGraphCtxHelper
from node import Node
from edge import Edge
from collections import deque


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
        self.branches: Dict[str, List[callable]] = {}

        for node in graph.nodes.values():
            node = Node.normalize_node(node)
            if node.data is not None:
                node.data = self.helper.ex_tool(node.data)
            self.nodes[node.id] = node

        for edge in graph.edges:
            edge = Edge.normalize_edge(edge)
            self.edges.append(edge)

        for node_id, fun in helper.branches:
            func = helper.ex_tool(fun)  # turn string into callable
            self.branches.setdefault(node_id, []).append(func)

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

    def merge_state(self, state: dict, output: dict) -> dict:
        for k, v in output.items():
            if k == "logs":
                # append instead of overwrite
                state.setdefault("logs", []).extend(v)
            elif k == "data":
                # merge dicts instead of overwrite
                state.setdefault("data", {}).update(v)
            else:
                # overwrite scalars
                state[k] = v
        return state

    def run_node(self, node_id: str) -> List[str]:
        node = self.nodes[node_id]
        if node.data is None:
            # nothing to execute
            return []

        output = node.execute(self.state)
        self.state = self.merge_state(self.state, output)

        print(f"ran {node_id} -> {output}")

        next_nodes = []

        # conditional branches
        if node_id in self.branches:
            for router in self.branches[node_id]:
                print(f"branch says next is: {router(self.state)}")
                next_nodes.append(router(self.state))
        else:
            # static edges
            for edge in self.edges:
                if edge.source == node_id:
                    print(f"edge says next is {edge.target}")
                    next_nodes.append(edge.target)

        return next_nodes

    def run_all_nodes(self) -> Dict[str, Any]:
        if not self.start_nodes:
            raise RuntimeError("No start node detected")

        queue = deque(self.start_nodes)

        self.execution_history.clear()

        while queue:
            node_id = queue.popleft()
            if node_id == "__start__":
                next_nodes = [e.target for e in self.edges if e.source == node_id]
            else:
                next_nodes = self.run_node(node_id)
                self.execution_history.append(
                    {
                        "node_id": node_id,
                        "state": dict(self.state),
                    }
                )
            queue.extend(next_nodes)

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
