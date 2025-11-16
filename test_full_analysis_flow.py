#!/usr/bin/env python3
"""
Test the complete LLM analysis flow through the API.
"""

import requests
import time

API_URL = "http://localhost:8000"

print("=" * 60)
print("Testing Complete LLM Analysis Flow")
print("=" * 60)

# Get available graphs
print("\n1. Getting available graphs...")
response = requests.get(f"{API_URL}/api/graphs")
graphs_data = response.json()
graphs = graphs_data["graphs"]

if not graphs:
    print("   ✗ No graphs available")
    exit(1)

graph_id = graphs[0]["graph_id"]
print(f"   ✓ Using graph: {graph_id}")

# Execute the graph
print("\n2. Executing graph...")
exec_response = requests.post(
    f"{API_URL}/api/graphs/{graph_id}/execute",
    json={"initial_state": {"test": "data"}, "config": {}}
)
execution = exec_response.json()
execution_id = execution["execution_id"]
print(f"   ✓ Execution ID: {execution_id}")

# Request LLM analysis
print("\n3. Requesting LLM analysis...")
print("   (This will call the LLM API - may take a few seconds)")
analysis_response = requests.post(
    f"{API_URL}/api/analysis/llm-analysis",
    json={
        "graph_id": graph_id,
        "execution_id": execution_id,
        "focus_areas": ["security", "vulnerabilities"]
    },
    timeout=60
)

if analysis_response.ok:
    analysis = analysis_response.json()
    print("\n4. ✓ ANALYSIS SUCCESSFUL!")
    print("=" * 60)
    print(f"   Analysis ID: {analysis['analysis_id']}")
    print(f"   Team ID: {analysis.get('team_id', 'NOT FOUND')}")
    print(f"   Model: {analysis.get('model', 'NOT FOUND')}")
    print(f"   Risk Score: {analysis.get('risk_score', 'N/A')}")
    print(f"\n   Summary: {analysis['summary'][:150]}...")
    print(f"   Vulnerabilities: {len(analysis.get('vulnerabilities', []))}")
    print(f"   Recommendations: {len(analysis.get('recommendations', []))}")
    print("=" * 60)
    print("\n✓ ALL SYSTEMS WORKING!")
    print("\nYou can now:")
    print("1. Open the frontend (http://localhost:3000)")
    print("2. Go to Attack mode")
    print("3. Execute a graph")
    print("4. Click 'AI Analysis' button")
    print("5. See the Team ID and full analysis!")
else:
    print(f"\n✗ Analysis failed: {analysis_response.status_code}")
    print(f"   Error: {analysis_response.text}")

