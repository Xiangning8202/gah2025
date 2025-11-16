"""
attack_graph.py - External API Attack Graph

This graph is used for testing external APIs with attack vectors.
It creates a simple flow:
1. Start: Initial prompt (can be modified by testing nodes)
2. Validate: Basic validation
3. API Call: Calls the external API with the prompt
4. End: Returns the result

Testing nodes can be inserted between start and validate to modify the prompt.
"""

import sys
import logging
from pathlib import Path
from typing import TypedDict
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Add backend to path for imports
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from langgraph.graph import StateGraph, START, END
from lantern import build_callable_graph


class AttackState(TypedDict, total=False):
    """State for attack graph."""
    prompt: str  # Main prompt field - testing nodes will replace this
    original_prompt: str  # Preserved original prompt
    injection_applied: bool  # Flag indicating prompt injection occurred
    fuzzing_applied: bool  # Flag indicating fuzzing occurred
    is_valid: bool
    validation_message: str
    target_url: str  # The URL of the external API to attack
    api_response: str  # Response from the external API
    status_code: int  # HTTP status code from the external API
    result: str  # Final result
    status: str  # Overall status
    error: str  # Any error messages


def create_attack_graph(target_url: str) -> StateGraph:
    """
    Create an attack graph that targets a specific external API.
    
    Args:
        target_url: The URL of the external API to test
        
    Returns:
        A compiled StateGraph configured to attack the target
    """
    graph = StateGraph(AttackState)
    
    def start(state):
        """Start node: Initialize with a default prompt."""
        prompt = "Hello, how can you help me?"
        print("\n" + "="*80)
        print("🎯 ATTACK MODE - Initial Prompt")
        print("="*80)
        print(f"Initial prompt: {prompt}")
        print(f"Target API: {target_url}")
        print("="*80 + "\n")
        return {
            "prompt": prompt,
            "target_url": target_url,
            "status": "started"
        }
    
    def validate(state):
        """Validate node: Validates the prompt before sending to API."""
        print("✅ VALIDATE - Checking prompt validity...")
        
        current_prompt = state.get("prompt", "")
        original_prompt = state.get("original_prompt", "")
        
        # Check if prompt was modified by testing nodes
        was_modified = bool(original_prompt and original_prompt != current_prompt)
        
        # Simple validation checks
        is_valid = True
        validation_message = "Prompt is valid"
        
        if not current_prompt:
            is_valid = False
            validation_message = "Error: Empty prompt"
        elif len(current_prompt) > 10000:
            is_valid = False
            validation_message = "Error: Prompt too long, truncating"
            current_prompt = current_prompt[:10000]
        
        if was_modified:
            print(f"⚠️  WARNING: Prompt was modified by testing node!")
            if original_prompt:
                print(f"Original: {original_prompt[:100]}...")
            print(f"Modified: {current_prompt[:100]}...")
        
        print(f"✓ Validation result: {validation_message}")
        print(f"✓ Prompt length: {len(current_prompt)} characters\n")
        
        return {
            "prompt": current_prompt,
            "is_valid": is_valid,
            "validation_message": validation_message
        }
    
    def call_api(state):
        """Call the external API with the prompt."""
        print("\n" + "="*80)
        print("🌐 API CALL - Calling External API")
        print("="*80)
        
        prompt = state.get("prompt", "")
        target = state.get("target_url", target_url)
        injection_applied = state.get("injection_applied", False)
        fuzzing_applied = state.get("fuzzing_applied", False)
        
        print(f"Target URL: {target}")
        print(f"Prompt: {prompt[:200]}...")
        print(f"Injection applied: {injection_applied}")
        print(f"Fuzzing applied: {fuzzing_applied}")
        
        try:
            # Make the API call
            # Support both GET and POST methods
            # Try POST first with JSON body
            with httpx.Client(timeout=30.0) as client:
                try:
                    # Try POST with JSON
                    response = client.post(
                        target,
                        json={"prompt": prompt, "message": prompt, "query": prompt},
                        headers={"Content-Type": "application/json"}
                    )
                except Exception as post_error:
                    print(f"POST request failed, trying GET: {post_error}")
                    # Fall back to GET with query parameter
                    response = client.get(
                        target,
                        params={"prompt": prompt, "message": prompt, "query": prompt}
                    )
                
                status_code = response.status_code
                print(f"✓ Status Code: {status_code}")
                
                # Try to get response as JSON, fall back to text
                try:
                    api_response = response.json()
                    response_text = str(api_response)
                except:
                    response_text = response.text
                
                print(f"✓ Response: {response_text[:500]}...")
                print("="*80 + "\n")
                
                return {
                    "api_response": response_text,
                    "status_code": status_code,
                    "status": "completed",
                    "result": f"API call completed with status {status_code}"
                }
        
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error calling API: {error_msg}")
            print("="*80 + "\n")
            
            return {
                "api_response": "",
                "status_code": 0,
                "status": "error",
                "error": error_msg,
                "result": f"API call failed: {error_msg}"
            }
    
    # Add nodes to graph
    graph.add_node("start", start)
    graph.add_node("validate", validate)
    graph.add_node("call_api", call_api)
    
    # Connect nodes
    graph.add_edge(START, "start")
    graph.add_edge("start", "validate")
    graph.add_edge("validate", "call_api")
    graph.add_edge("call_api", END)
    
    return graph


def build(target_url: str = "http://example.com/api"):
    """Build and return the compiled attack graph."""
    print("\n" + "🎯 " + "="*76)
    print("🎯  ATTACK GRAPH: EXTERNAL API TESTING")
    print("🎯  " + "="*76)
    print("🎯  Flow:")
    print("🎯    1. Start with initial prompt")
    print("🎯    2. Validate prompt (may be modified by testing nodes)")
    print("🎯    3. Call external API")
    print("🎯    4. Return result")
    print(f"🎯  Target: {target_url}")
    print("🎯  " + "="*76 + "\n")
    
    graph = create_attack_graph(target_url)
    compiled_graph = graph.compile()
    
    # Return the compiled graph directly (not CallableGraph)
    # The graph_service will handle wrapping it
    return compiled_graph


if __name__ == "__main__":
    # Example usage
    target = "https://api.example.com/chat"
    if len(sys.argv) > 1:
        target = sys.argv[1]
    
    compiled = build(target)
    
    # Test run
    result = compiled.invoke({})
    print("\n📊 Final Result:")
    print(result)

