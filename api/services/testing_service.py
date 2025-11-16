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
from testing_nodes.fuzzer_node import FuzzerNode, create_fuzzer_node

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
                description="Generates fuzzed inputs using deterministic attack templates (SQL injection, XSS, etc.)",
                icon="🎲",
                default_config={
                    "state_input_key": "prompt",
                    "state_output_key": "fuzzed_prompt",
                    "fuzzing_strategies": [
                        "prompt_injection",
                        "sql_injection",
                        "xss_injection",
                        "command_injection",
                        "unicode_manipulation",
                        "length_testing",
                        "special_characters",
                        "format_string",
                        "encoding_attacks",
                        "context_overflow"
                    ],
                    "mutation_rate": 1.0,
                    "save_logs": True,
                },
                config_schema={
                    "state_input_key": {"type": "string", "description": "State key to read input from"},
                    "state_output_key": {"type": "string", "description": "State key to write fuzzed output to"},
                    "fuzzing_strategies": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of fuzzing strategies to apply"
                    },
                    "mutation_rate": {"type": "number", "minimum": 0.0, "maximum": 1.0, "description": "Probability of applying each strategy"},
                    "save_logs": {"type": "boolean", "description": "Whether to save fuzzing logs"},
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
        
        # Update specific attributes for fuzzer nodes
        elif isinstance(testing_node, FuzzerNode):
            if "state_input_key" in request.config:
                testing_node.state_input_key = request.config["state_input_key"]
            if "state_output_key" in request.config:
                testing_node.state_output_key = request.config["state_output_key"]
            if "fuzzing_strategies" in request.config:
                testing_node.strategies = request.config["fuzzing_strategies"]
            if "mutation_rate" in request.config:
                testing_node.mutation_rate = request.config["mutation_rate"]
            if "save_logs" in request.config:
                testing_node.save_logs = request.config["save_logs"]

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
                state_output_key=config.get("state_output_key", "prompt"),  # Use same key to replace in place
            )
        elif request.node_type == TestingNodeType.FUZZER:
            # Create fuzzer node using the proper FuzzerNode class
            config = request.config
            return create_fuzzer_node(
                node_id=node_id,
                name=request.name or "fuzzer",
                state_input_key=config.get("state_input_key", "prompt"),
                state_output_key=config.get("state_output_key", "prompt"),  # Replace in-place (same key)
                fuzzing_strategies=config.get("fuzzing_strategies", None),
                mutation_rate=config.get("mutation_rate", 1.0),
                save_logs=config.get("save_logs", True),
                log_file=config.get("log_file", None),
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
