#!/usr/bin/env python3
"""
Test with minimal request matching curl exactly.
"""

import httpx
import os
from pathlib import Path
from dotenv import load_dotenv

# Load env vars
env_path = Path(__file__).parent / "backend" / ".env"
load_dotenv(env_path)

TEAM_ID = os.getenv("TEAM_ID")
API_TOKEN = os.getenv("API_TOKEN")
API_ENDPOINT = "https://ctwa92wg1b.execute-api.us-east-1.amazonaws.com/prod/invoke"

print("Testing minimal request (matching curl exactly)")
print("=" * 60)

headers = {
    "Content-Type": "application/json",
    "X-Team-ID": TEAM_ID,
    "X-API-Token": API_TOKEN
}

# Test 1: With temperature and top_p
print("\nTest 1: With temperature and top_p")
payload1 = {
    "team_id": TEAM_ID,
    "model": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    "messages": [{"role": "user", "content": "Say hi"}],
    "max_tokens": 50,
    "temperature": 0.7,
    "top_p": 0.9
}

with httpx.Client(timeout=30) as client:
    response = client.post(API_ENDPOINT, headers=headers, json=payload1)
    print(f"Status: {response.status_code}")
    if not response.is_success:
        print(f"Error: {response.text}")

# Test 2: WITHOUT temperature and top_p (like curl)
print("\nTest 2: WITHOUT temperature and top_p (matching curl)")
payload2 = {
    "team_id": TEAM_ID,
    "model": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    "messages": [{"role": "user", "content": "Say hi"}],
    "max_tokens": 50
}

with httpx.Client(timeout=30) as client:
    response = client.post(API_ENDPOINT, headers=headers, json=payload2)
    print(f"Status: {response.status_code}")
    if response.is_success:
        print(f"✓ SUCCESS!")
        print(f"Response: {response.json()}")
    else:
        print(f"✗ Error: {response.text}")

