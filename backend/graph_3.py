"""
graph_3.py - Simple graph demonstrating prompt injection testing with PromptInjectionNode

This graph demonstrates a prompt injection testing workflow:
1. Generate: Creates an initial benign prompt
2. Inject: Uses PromptInjectionNode to inject malicious content via Ollama
3. Process: Evaluates the result of the injection

The inject node uses the PromptInjectionNode which can:
- Call Ollama with a sophisticated injection model (dolphin-phi)
- Generate realistic prompt injection attacks
- Fall back to mock injection if Ollama is unavailable

To use with Ollama:
1. Make sure Ollama is running: `ollama serve`
2. Pull the model: `ollama pull dolphin-phi`
3. Set use_mock=False in the node configuration below
"""

import sys
import logging
from pathlib import Path

# Configure logging to see what's happening
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Add backend to path for imports
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from langgraph.graph import StateGraph, START, END
from testing_nodes.prompt_injection_node import create_prompt_injection_node
from lantern import build_callable_graph


graph = StateGraph(dict)


def generate(state):
    """Step 1: Generate an initial benign prompt."""
    prompt = "What is the weather like today?"
    return {"prompt": prompt, "original": prompt}


# Create the PromptInjectionNode instance
# Set use_mock=False to use Ollama, or True to use mock injection
_injection_node = create_prompt_injection_node(
    node_id="inject",
    name="prompt_injection_test",
    ollama_model="dolphin-phi",
    state_prompt_key="prompt",
    state_output_key="injected_prompt",
    use_mock=False  # Set to True if you don't have Ollama running
)


def inject(state):
    """Step 2: Inject malicious content into the prompt using PromptInjectionNode."""
    return _injection_node._inject_prompt(state)


def process(state):
    """Step 3: Process the injected prompt and show results."""
    original = state.get("original", "")
    injected = state.get("injected_prompt", "")
    
    # Show comparison between original and injected prompts
    injection_added = len(injected) - len(original)
    
    result = {
        "original_prompt": original,
        "injected_prompt": injected,
        "chars_added": injection_added,
        "test_type": "prompt_injection",
        "status": "completed",
        "warning": "This injected prompt could potentially bypass safety measures"
    }
    
    return result


# Add nodes to graph
graph.add_node("generate", generate)
graph.add_node("inject", inject)
graph.add_node("process", process)


# Connect nodes: START -> generate -> inject -> process -> END
graph.add_edge(START, "generate")
graph.add_edge("generate", "inject")
graph.add_edge("inject", "process")
graph.add_edge("process", END)


def build():
    """Build and run the callable graph."""
    compiled_graph = graph.compile()
    build_callable_graph(compiled_graph)


if __name__ == "__main__":
    build()

