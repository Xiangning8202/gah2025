"""Service for testing node operations."""

import sys
from pathlib import Path
from typing import Dict, List, Any
import uuid

# Add backend directory to path
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from node import Node, NodeType
from testing_nodes.prompt_injection_node import PromptInjectionNode, create_prompt_injection_node
# Note: fuzzer_node.py has PromptFuzzer class and fuzzer_node_function, not FuzzerNode class

from models.testing import (
    TestingNodeAddRequest,
    TestingNodeAddResponse,
    TestingNodeTemplate,
    TestingNodeType,
    TestingNodeConfigRequest,
    TestingNodeConfigResponse,
)


class TestingService:
    """Service for managing testing nodes."""

    def __init__(self):
        self.testing_nodes: Dict[str, Node] = {}  # node_id -> testing node
        self.graph_testing_nodes: Dict[str, List[str]] = {}  # graph_id -> [node_ids]

    def get_templates(self) -> List[TestingNodeTemplate]:
        """Get available testing node templates."""
        return [
            TestingNodeTemplate(
                node_type=TestingNodeType.PROMPT_INJECTION,
                display_name="Prompt Injection",
                description="Injects malicious content into prompts to test for vulnerabilities",
                icon="⚠️",
                default_config={
                    "use_mock": False,
                    "ollama_base_url": "http://localhost:11434",
                    "ollama_model": "dolphin-phi",
                    "state_prompt_key": "prompt",
                    "state_output_key": "injected_prompt",
                },
                config_schema={
                    "use_mock": {"type": "boolean", "description": "Use mock injection instead of Ollama"},
                    "ollama_base_url": {"type": "string", "description": "Base URL for Ollama API"},
                    "ollama_model": {"type": "string", "description": "Model to use for injection"},
                    "state_prompt_key": {"type": "string", "description": "State key to read prompt from"},
                    "state_output_key": {"type": "string", "description": "State key to write injected prompt to"},
                },
            ),
            TestingNodeTemplate(
                node_type=TestingNodeType.FUZZER,
                display_name="Fuzzer",
                description="Generates fuzzed inputs to test edge cases and error handling",
                icon="🎲",
                default_config={
                    "fuzz_type": "random",
                    "iterations": 10,
                },
                config_schema={
                    "fuzz_type": {"type": "string", "enum": ["random", "mutation", "generation"]},
                    "iterations": {"type": "integer", "minimum": 1, "maximum": 1000},
                },
            ),
            TestingNodeTemplate(
                node_type=TestingNodeType.VALIDATOR,
                display_name="Validator",
                description="Validates node outputs against expected schemas or conditions",
                icon="✅",
                default_config={
                    "validation_type": "schema",
                    "strict": True,
                },
                config_schema={
                    "validation_type": {"type": "string", "enum": ["schema", "regex", "custom"]},
                    "strict": {"type": "boolean", "description": "Fail on validation errors"},
                },
            ),
            TestingNodeTemplate(
                node_type=TestingNodeType.MOCK,
                display_name="Mock Node",
                description="Mocks expensive operations like LLM calls with predefined responses",
                icon="🎭",
                default_config={
                    "mock_response": {},
                    "delay_ms": 0,
                },
                config_schema={
                    "mock_response": {"type": "object", "description": "Response to return"},
                    "delay_ms": {"type": "integer", "description": "Artificial delay in milliseconds"},
                },
            ),
        ]

    def add_testing_node(
        self,
        request: TestingNodeAddRequest,
        graph_service
    ) -> TestingNodeAddResponse:
        """Add a testing node to a graph."""
        # Get the graph
        graph = graph_service.get_graph_instance(request.graph_id)
        if graph is None:
            raise ValueError(f"Graph not found: {request.graph_id}")

        # Generate node ID
        node_id = request.name or f"{request.node_type.value}_{str(uuid.uuid4())[:8]}"

        # Create the testing node based on type
        testing_node = self._create_testing_node(node_id, request)

        # Add node to graph
        graph.nodes[node_id] = testing_node

        # Parse position to insert node in graph
        # Format: "before:node_id" or "after:node_id"
        self._insert_node_in_graph(graph, node_id, request.position)

        # Track testing node
        self.testing_nodes[node_id] = testing_node
        if request.graph_id not in self.graph_testing_nodes:
            self.graph_testing_nodes[request.graph_id] = []
        self.graph_testing_nodes[request.graph_id].append(node_id)

        return TestingNodeAddResponse(
            node_id=node_id,
            graph_id=request.graph_id,
            node_type=request.node_type.value,
            position=request.position,
            config=request.config,
            message=f"Testing node {node_id} added successfully",
        )

    def configure_testing_node(
        self,
        node_id: str,
        graph_id: str,
        request: TestingNodeConfigRequest
    ) -> TestingNodeConfigResponse:
        """Configure an existing testing node."""
        if node_id not in self.testing_nodes:
            raise ValueError(f"Testing node not found: {node_id}")

        testing_node = self.testing_nodes[node_id]

        # Update configuration
        testing_node.test_config.update(request.config)

        # Update specific attributes for prompt injection nodes
        if isinstance(testing_node, PromptInjectionNode):
            if "use_mock" in request.config:
                testing_node.use_mock = request.config["use_mock"]
            if "ollama_model" in request.config:
                testing_node.ollama_model = request.config["ollama_model"]
            if "ollama_base_url" in request.config:
                testing_node.ollama_base_url = request.config["ollama_base_url"]

        return TestingNodeConfigResponse(
            node_id=node_id,
            graph_id=graph_id,
            config=testing_node.test_config,
            message=f"Testing node {node_id} configured successfully",
        )

    def _create_testing_node(
        self,
        node_id: str,
        request: TestingNodeAddRequest
    ) -> Node:
        """Create a testing node instance based on type."""
        if request.node_type == TestingNodeType.PROMPT_INJECTION:
            config = request.config
            return create_prompt_injection_node(
                node_id=node_id,
                name=request.name or "prompt_injection",
                use_mock=config.get("use_mock", False),
                ollama_base_url=config.get("ollama_base_url", "http://localhost:11434"),
                ollama_model=config.get("ollama_model", "dolphin-phi"),
                state_prompt_key=config.get("state_prompt_key", "prompt"),
                state_output_key=config.get("state_output_key", "injected_prompt"),
            )
        elif request.node_type == TestingNodeType.FUZZER:
            # Create fuzzer node
            def fuzzer_func(state: Dict[str, Any]) -> Dict[str, Any]:
                # Simple fuzzing logic
                import random
                import string
                fuzz_data = ''.join(random.choices(string.ascii_letters + string.digits, k=50))
                return {"fuzzed_input": fuzz_data, **state}

            return Node(
                id=node_id,
                name=request.name or "fuzzer",
                data=fuzzer_func,
                node_type=NodeType.TESTING,
                is_testing=True,
                test_config=request.config,
            )
        elif request.node_type == TestingNodeType.VALIDATOR:
            # Create validator node
            def validator_func(state: Dict[str, Any]) -> Dict[str, Any]:
                # Simple validation logic
                validation_passed = True  # Would implement actual validation
                return {"validation_passed": validation_passed, **state}

            return Node(
                id=node_id,
                name=request.name or "validator",
                data=validator_func,
                node_type=NodeType.TESTING,
                is_testing=True,
                test_config=request.config,
            )
        elif request.node_type == TestingNodeType.MOCK:
            # Create mock node
            config = request.config
            def mock_func(state: Dict[str, Any]) -> Dict[str, Any]:
                import time
                if config.get("delay_ms", 0) > 0:
                    time.sleep(config["delay_ms"] / 1000)
                return {**state, **config.get("mock_response", {})}

            return Node(
                id=node_id,
                name=request.name or "mock",
                data=mock_func,
                node_type=NodeType.TESTING,
                is_testing=True,
                test_config=request.config,
            )
        else:
            raise ValueError(f"Unknown testing node type: {request.node_type}")

    def _insert_node_in_graph(self, graph, node_id: str, position: str):
        """Insert a node into the graph at the specified position."""
        from edge import Edge

        # Parse position: "before:target_node" or "after:source_node"
        if ":" not in position:
            # No specific position, don't modify edges
            return

        pos_type, ref_node = position.split(":", 1)

        if pos_type == "before":
            # Insert before ref_node: find edges pointing to ref_node
            incoming_edges = [e for e in graph.edges if e.target == ref_node]
            # Remove those edges and create new ones through our node
            for edge in incoming_edges:
                graph.edges.remove(edge)
                # Add edge from source to our node
                graph.edges.append(
                    Edge(
                        source=edge.source,
                        target=node_id,
                        data=edge.data,
                        conditional=edge.conditional,
                        metadata=edge.metadata,
                    )
                )
            # Add edge from our node to ref_node
            graph.edges.append(
                Edge(
                    source=node_id,
                    target=ref_node,
                    data=None,
                    conditional=False,
                    metadata={"injected": True},
                )
            )
        elif pos_type == "after":
            # Insert after ref_node: find edges starting from ref_node
            outgoing_edges = [e for e in graph.edges if e.source == ref_node]
            # Remove those edges and create new ones through our node
            for edge in outgoing_edges:
                graph.edges.remove(edge)
                # Add edge from our node to target
                graph.edges.append(
                    Edge(
                        source=node_id,
                        target=edge.target,
                        data=edge.data,
                        conditional=edge.conditional,
                        metadata=edge.metadata,
                    )
                )
            # Add edge from ref_node to our node
            graph.edges.append(
                Edge(
                    source=ref_node,
                    target=node_id,
                    data=None,
                    conditional=False,
                    metadata={"injected": True},
                )
            )

        # Update start/end nodes
        graph._update_start_end_nodes()


# Global instance
_testing_service = TestingService()


def get_testing_service() -> TestingService:
    """Get the global testing service instance."""
    return _testing_service

