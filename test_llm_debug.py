#!/usr/bin/env python3
"""
Debug test to see what we're sending to the LLM API.
"""

import sys
import json
import logging
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

# Enable debug logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(levelname)s: %(message)s'
)

def test_with_logging():
    """Test LLM call with full logging."""
    print("=" * 60)
    print("LLM API Debug Test")
    print("=" * 60)
    
    try:
        from llm_client import get_llm_client
        
        print("\nInitializing client and making test call...")
        print("Watch the DEBUG logs below to see what's being sent:\n")
        
        client = get_llm_client()
        
        # Simple test
        response = client.call(
            prompt="Say 'test' and nothing else.",
            max_tokens=10,
            temperature=0.1
        )
        
        print(f"\n✓ SUCCESS: {response}")
        return True
        
    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        return False

if __name__ == "__main__":
    sys.exit(0 if test_with_logging() else 1)

