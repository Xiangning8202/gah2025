"""Service for graph management operations."""

import sys
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
import importlib.util

# Add backend directory to path
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from graph import CallableGraph
from graph_helper import LangGraphCtxHelper
from node import Node, NodeType
from edge import Edge

from models.graph import (
    GraphLoadRequest,
    GraphLoadResponse,
    GraphResponse,
    GraphListItem,
    GraphStructure,
    NodeInfo,
    EdgeInfo,
)


class GraphService:
    """Service for managing graphs."""

    def __init__(self):
        self.graphs: Dict[str, Dict[str, Any]] = {}  # graph_id -> graph data

    def load_graph(self, request: GraphLoadRequest) -> GraphLoadResponse:
        """Load a LangGraph from code, file, or module."""
        graph_id = str(uuid.uuid4())
        
        # TODO: Implement actual loading logic based on request type
        # For now, create a mock graph structure
        if request.code:
            # Parse code and extract graph
            graph = self._load_from_code(request.code, request.graph_name, request.description)
        elif request.file_path:
            # Load from file
            graph = self._load_from_file(request.file_path, request.graph_name, request.description)
        elif request.module_path:
            # Import from module
            graph = self._load_from_module(request.module_path, request.graph_name, request.description)
        else:
            # Create empty graph
            graph = self._create_empty_graph(request.graph_name, request.description)

        # Store graph
        self.graphs[graph_id] = {
            "id": graph_id,
            "graph": graph,
            "name": request.graph_name,
            "description": request.description,
            "created_at": datetime.now(),
            "last_executed": None,
        }

        # Convert to response
        structure = self._graph_to_structure(graph)
        
        return GraphLoadResponse(
            graph_id=graph_id,
            name=request.graph_name,
            description=request.description,
            structure=structure,
            created_at=self.graphs[graph_id]["created_at"],
        )

    def get_graph(self, graph_id: str) -> Optional[GraphResponse]:
        """Get a graph by ID."""
        if graph_id not in self.graphs:
            return None

        graph_data = self.graphs[graph_id]
        structure = self._graph_to_structure(graph_data["graph"])

        return GraphResponse(
            graph_id=graph_id,
            name=graph_data["name"],
            description=graph_data["description"],
            structure=structure,
            created_at=graph_data["created_at"],
            last_executed=graph_data.get("last_executed"),
        )

    def list_graphs(self) -> List[GraphListItem]:
        """List all loaded graphs."""
        items = []
        for graph_id, graph_data in self.graphs.items():
            graph = graph_data["graph"]
            items.append(
                GraphListItem(
                    graph_id=graph_id,
                    name=graph_data["name"],
                    description=graph_data["description"],
                    node_count=len(graph.nodes),
                    edge_count=len(graph.edges),
                    created_at=graph_data["created_at"],
                    last_executed=graph_data.get("last_executed"),
                )
            )
        return items

    def get_graph_instance(self, graph_id: str) -> Optional[CallableGraph]:
        """Get the actual graph instance for execution."""
        if graph_id not in self.graphs:
            return None
        return self.graphs[graph_id]["graph"]

    def update_last_executed(self, graph_id: str):
        """Update the last executed timestamp for a graph."""
        if graph_id in self.graphs:
            self.graphs[graph_id]["last_executed"] = datetime.now()

    def _load_from_code(self, code: str, name: str, description: Optional[str]) -> CallableGraph:
        """Load graph from Python code string."""
        # This would need actual implementation to execute the code safely
        # For now, return empty graph
        return self._create_empty_graph(name, description)

    def _load_from_file(self, file_path: str, name: str, description: Optional[str]) -> CallableGraph:
        """Load graph from a file."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Load the module from file
        spec = importlib.util.spec_from_file_location("user_graph", path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from {file_path}")

        module = importlib.util.module_from_spec(spec)
        sys.modules["user_graph"] = module
        spec.loader.exec_module(module)

        # Try to find a StateGraph object in the module
        for attr_name in dir(module):
            if attr_name.startswith('_'):
                continue
            
            attr = getattr(module, attr_name)
            
            # Check if it's a StateGraph (has nodes dict and edges list)
            if hasattr(attr, "nodes") and hasattr(attr, "edges") and hasattr(attr, "compile"):
                # Found a StateGraph - compile it first
                try:
                    print(f"Found StateGraph: {attr_name}")
                    compiled_graph = attr.compile()
                    # Pass the module and filepath to avoid stack inspection issues
                    helper = LangGraphCtxHelper(compiled_graph, module=module, filepath=str(path.absolute()))
                    return CallableGraph(helper, name, description or "")
                except Exception as e:
                    print(f"Could not create graph from {attr_name}: {e}")
                    import traceback
                    traceback.print_exc()

        # If no graph found, return empty graph
        print("No suitable graph found in module, returning empty graph")
        return self._create_empty_graph(name, description)

    def _load_from_module(self, module_path: str, name: str, description: Optional[str]) -> CallableGraph:
        """Load graph from a module path."""
        # This would import the module and extract the graph
        # For now, return empty graph
        return self._create_empty_graph(name, description)

    def load_graph_from_module(
        self, 
        file_path: str, 
        graph_name: str, 
        description: Optional[str] = None,
        build_kwargs: Optional[Dict[str, Any]] = None
    ) -> GraphLoadResponse:
        """
        Load a graph from a module file with optional build arguments.
        
        This is useful for graphs that need parameters (like attack graphs with target URLs).
        
        Args:
            file_path: Path to the Python file containing the graph
            graph_name: Name for the graph
            description: Optional description
            build_kwargs: Optional kwargs to pass to the build() function
            
        Returns:
            GraphLoadResponse with the loaded graph details
        """
        graph_id = str(uuid.uuid4())
        build_kwargs = build_kwargs or {}
        
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Load the module from file
        spec = importlib.util.spec_from_file_location("user_graph", path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from {file_path}")

        module = importlib.util.module_from_spec(spec)
        sys.modules["user_graph"] = module
        spec.loader.exec_module(module)

        # Look for a build() function in the module
        if hasattr(module, 'build') and callable(module.build):
            try:
                print(f"Found build() function, calling with kwargs: {build_kwargs}")
                compiled_graph = module.build(**build_kwargs)
                
                # Create CallableGraph from the compiled graph
                helper = LangGraphCtxHelper(compiled_graph, module=module, filepath=str(path.absolute()))
                graph = CallableGraph(helper, graph_name, description or "")
                
                # Store graph
                self.graphs[graph_id] = {
                    "id": graph_id,
                    "graph": graph,
                    "name": graph_name,
                    "description": description,
                    "created_at": datetime.now(),
                    "last_executed": None,
                }

                # Convert to response
                structure = self._graph_to_structure(graph)
                
                return GraphLoadResponse(
                    graph_id=graph_id,
                    name=graph_name,
                    description=description,
                    structure=structure,
                    created_at=self.graphs[graph_id]["created_at"],
                )
            except Exception as e:
                print(f"Error calling build() function: {e}")
                import traceback
                traceback.print_exc()
                raise ValueError(f"Failed to build graph: {e}")
        else:
            raise ValueError(f"Module does not have a build() function: {file_path}")

    def _create_empty_graph(self, name: str, description: Optional[str]) -> CallableGraph:
        """Create an empty graph structure."""
        # Create a minimal helper for an empty graph
        # This is a simplified version - would need proper initialization
        class MockHelper:
            def __init__(self):
                self.lc_graph = type('Graph', (), {
                    'nodes': {},
                    'edges': []
                })()
            
            def ex_tool(self, tool):
                return tool

        helper = MockHelper()
        return CallableGraph(helper, name, description or "")

    def _graph_to_structure(self, graph: CallableGraph) -> GraphStructure:
        """Convert CallableGraph to GraphStructure response model."""
        nodes_dict = {}
        for node_id, node in graph.nodes.items():
            nodes_dict[node_id] = NodeInfo(
                id=node.id,
                name=node.name,
                node_type=node.node_type.value,
                is_testing=node.is_testing,
                metadata=node.metadata or {},
            )

        edges_list = []
        for edge in graph.edges:
            edges_list.append(
                EdgeInfo(
                    source=edge.source,
                    target=edge.target,
                    conditional=edge.conditional,
                    metadata=edge.metadata or {},
                )
            )

        return GraphStructure(
            nodes=nodes_dict,
            edges=edges_list,
            start_nodes=list(graph.start_nodes),
            end_nodes=list(graph.end_nodes),
        )


# Global instance
_graph_service = GraphService()


def get_graph_service() -> GraphService:
    """Get the global graph service instance."""
    return _graph_service

