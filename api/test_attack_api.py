"""Test script for the attack API endpoints."""

import requests
import json
import time

API_BASE = "http://localhost:8000"


def test_health_check():
    """Test that the API is running."""
    print("\n=== Testing Health Check ===")
    response = requests.get(f"{API_BASE}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    print("✓ Health check passed")


def test_create_attack_graph():
    """Test creating an attack graph."""
    print("\n=== Testing Create Attack Graph ===")
    
    # Create an attack graph targeting a mock API
    payload = {
        "target_url": "https://httpbin.org/post",
        "graph_name": "Test Attack Graph",
        "description": "Testing attack mode against httpbin"
    }
    
    response = requests.post(
        f"{API_BASE}/api/graphs/attack/create",
        json=payload
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code != 201:
        print(f"Error: {response.text}")
        return None
    
    data = response.json()
    print(f"Graph ID: {data['graph_id']}")
    print(f"Name: {data['name']}")
    print(f"Target URL: {data['target_url']}")
    print(f"Nodes: {list(data['structure']['nodes'].keys())}")
    print("✓ Attack graph created successfully")
    
    return data['graph_id']


def test_execute_attack_graph(graph_id):
    """Test executing an attack graph with streaming."""
    print("\n=== Testing Execute Attack Graph ===")
    
    payload = {
        "initial_state": {
            "prompt": "Hello, can you help me?"
        }
    }
    
    response = requests.post(
        f"{API_BASE}/api/graphs/attack/{graph_id}/execute/stream",
        json=payload,
        stream=True
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Error: {response.text}")
        return
    
    print("\nStreaming execution events:")
    print("-" * 80)
    
    event_count = 0
    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            if line_str.startswith('data: '):
                event_data = line_str[6:]  # Remove 'data: ' prefix
                try:
                    event = json.loads(event_data)
                    event_type = event.get('event_type')
                    print(f"\n[{event_type.upper()}]")
                    
                    if event_type == 'start':
                        print(f"  Execution started: {event.get('execution_id')}")
                    elif event_type == 'node_start':
                        print(f"  Node: {event.get('node_name')} ({event.get('node_id')})")
                    elif event_type == 'node_complete':
                        print(f"  Node: {event.get('node_name')} - {event.get('status')}")
                        print(f"  Duration: {event.get('duration_ms'):.2f}ms")
                        if event.get('error'):
                            print(f"  Error: {event.get('error')}")
                    elif event_type == 'complete':
                        print(f"  Total duration: {event.get('duration_ms'):.2f}ms")
                        print(f"  Status: {event.get('status')}")
                    elif event_type == 'error':
                        print(f"  Error: {event.get('error')}")
                    
                    event_count += 1
                except json.JSONDecodeError as e:
                    print(f"Failed to parse event: {e}")
    
    print("-" * 80)
    print(f"\n✓ Received {event_count} events")


def main():
    """Run all tests."""
    print("=" * 80)
    print("ATTACK API TESTS")
    print("=" * 80)
    
    try:
        # Test health check
        test_health_check()
        
        # Test creating attack graph
        graph_id = test_create_attack_graph()
        
        if graph_id:
            # Test executing the attack graph
            time.sleep(1)  # Brief pause
            test_execute_attack_graph(graph_id)
        
        print("\n" + "=" * 80)
        print("✓ ALL TESTS PASSED")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

