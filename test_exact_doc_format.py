#!/usr/bin/env python3
"""
Test using the EXACT format from the documentation.
"""

import requests
import os
from pathlib import Path
from dotenv import load_dotenv

# Load env vars
env_path = Path(__file__).parent / "backend" / ".env"
load_dotenv(env_path)

TEAM_ID = os.getenv("TEAM_ID")
API_TOKEN = os.getenv("API_TOKEN")
API_ENDPOINT = "https://ctwa92wg1b.execute-api.us-east-1.amazonaws.com/prod/invoke"

print("=" * 60)
print("Testing EXACT Documentation Format")
print("=" * 60)
print(f"\nTeam ID: {TEAM_ID}")
print(f"API Token Length: {len(API_TOKEN) if API_TOKEN else 0}")

# Test 1: Exact format from docs (no api_token in body)
print("\n\nTest 1: Format from documentation (no api_token in body)")
print("-" * 60)

response = requests.post(
    API_ENDPOINT,
    headers={
        "Content-Type": "application/json",
        "X-Team-ID": TEAM_ID,
        "X-API-Token": API_TOKEN
    },
    json={
        "team_id": TEAM_ID,
        "model": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
        "messages": [
            {"role": "user", "content": "Hello, how are you?"}
        ],
        "max_tokens": 1024
    }
)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text[:500]}")

if response.ok:
    print("\n✓ SUCCESS with documentation format!")
else:
    print(f"\n✗ FAILED: {response.status_code}")
    
    # Test 2: With api_token in body
    print("\n\nTest 2: With api_token in body")
    print("-" * 60)
    
    response2 = requests.post(
        API_ENDPOINT,
        headers={
            "Content-Type": "application/json",
            "X-Team-ID": TEAM_ID,
            "X-API-Token": API_TOKEN
        },
        json={
            "team_id": TEAM_ID,
            "api_token": API_TOKEN,
            "model": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            "messages": [
                {"role": "user", "content": "Hello, how are you?"}
            ],
            "max_tokens": 1024
        }
    )
    
    print(f"Status Code: {response2.status_code}")
    print(f"Response: {response2.text[:500]}")
    
    if response2.ok:
        print("\n✓ SUCCESS with api_token in body!")
    else:
        print(f"\n✗ FAILED: {response2.status_code}")
        print("\nPlease verify your TEAM_ID and API_TOKEN with the competition organizers.")

