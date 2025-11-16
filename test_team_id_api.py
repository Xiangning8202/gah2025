#!/usr/bin/env python3
"""
Quick test to verify team_id is returned in analysis response.
"""

import requests
import json
import time

API_URL = "http://localhost:8000"

def wait_for_server():
    """Wait for server to be ready."""
    print("Waiting for API server to be ready...")
    for i in range(10):
        try:
            response = requests.get(f"{API_URL}/health", timeout=2)
            if response.ok:
                print("✓ API server is ready!")
                return True
        except:
            time.sleep(1)
    print("✗ API server not responding")
    return False

def test_llm_analysis_response():
    """Test if LLM analysis response includes team_id."""
    print("\n" + "=" * 60)
    print("Testing LLM Analysis Response Structure")
    print("=" * 60)
    
    # First, let's check if there are any existing graphs
    print("\n1. Checking for existing graphs...")
    try:
        response = requests.get(f"{API_URL}/api/graphs")
        graphs_data = response.json()
        
        # Handle dict with "graphs" key
        if isinstance(graphs_data, dict) and "graphs" in graphs_data:
            graphs = graphs_data["graphs"]
        elif isinstance(graphs_data, list):
            graphs = graphs_data
        else:
            graphs = []
        
        if not graphs or len(graphs) == 0:
            print("   No graphs found. Using an existing graph ID...")
            # Just use one of the existing graph IDs from the output
            # Or create a minimal one - but for now just use a known ID
            print("   Please create a graph first through the UI or use an existing one")
            return False
        else:
            graph_id = graphs[0]["graph_id"]
            print(f"   ✓ Using existing graph: {graph_id}")
        
        # Execute the graph
        print("\n2. Executing graph...")
        exec_data = {
            "initial_state": {"test": "data"},
            "config": {}
        }
        response = requests.post(
            f"{API_URL}/api/graphs/{graph_id}/execute",
            json=exec_data
        )
        execution = response.json()
        execution_id = execution["execution_id"]
        print(f"   ✓ Execution started: {execution_id}")
        
        # Request LLM analysis
        print("\n3. Requesting LLM analysis (this may take a moment)...")
        analysis_request = {
            "graph_id": graph_id,
            "execution_id": execution_id,
            "focus_areas": ["security"]
        }
        
        response = requests.post(
            f"{API_URL}/api/analysis/llm-analysis",
            json=analysis_request,
            timeout=60
        )
        
        if not response.ok:
            print(f"   ✗ Analysis request failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
        
        analysis = response.json()
        
        # Check for team_id in response
        print("\n4. Checking response structure...")
        print(f"   Analysis ID: {analysis.get('analysis_id', 'N/A')}")
        print(f"   Team ID: {analysis.get('team_id', '❌ NOT FOUND')}")
        print(f"   Model: {analysis.get('model', 'N/A')}")
        
        if 'team_id' in analysis and analysis['team_id']:
            print("\n✓ SUCCESS! Team ID is present in the response!")
            print(f"   Team ID: {analysis['team_id']}")
            return True
        else:
            print("\n✗ FAILED! Team ID is missing from the response!")
            print("\nFull response structure:")
            print(json.dumps(analysis, indent=2))
            return False
            
    except requests.exceptions.Timeout:
        print("   ✗ Request timed out (LLM call may be slow)")
        print("   Note: If the LLM is working, team_id should still be in the response")
        return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run the test."""
    print("\n" + "=" * 60)
    print("TEAM ID API RESPONSE TEST")
    print("=" * 60)
    
    if not wait_for_server():
        print("\n✗ Cannot proceed without API server")
        return 1
    
    success = test_llm_analysis_response()
    
    print("\n" + "=" * 60)
    if success:
        print("✓ Test PASSED! Team ID is visible in API responses.")
        print("\nThe frontend should now display the team ID when you:")
        print("1. Execute an attack graph")
        print("2. Click 'AI Analysis' button")
        print("3. Look for the 'Team ID' field in the metadata section")
    else:
        print("✗ Test FAILED! Check the errors above.")
    print("=" * 60)
    
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())

