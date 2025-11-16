#!/usr/bin/env python3
"""
Direct test of the LLM client fix for 400 Bad Request error.
"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

def test_llm_client_call():
    """Test LLM client with a simple call."""
    print("=" * 60)
    print("Testing LLM Client API Call")
    print("=" * 60)
    
    try:
        from llm_client import get_llm_client
        
        print("\n1. Initializing LLM client...")
        client = get_llm_client()
        print(f"   ✓ Client initialized")
        print(f"   Team ID: {client.team_id}")
        print(f"   Model: {client.model}")
        
        print("\n2. Making a simple test call...")
        print("   (This will call the actual LLM API)")
        
        response = client.call(
            prompt="What is 2+2? Answer in one word.",
            max_tokens=50,
            temperature=0.3
        )
        
        print(f"\n3. ✓ SUCCESS! Got response:")
        print(f"   Response: {response[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"\n✗ FAILED with error:")
        print(f"   {type(e).__name__}: {str(e)}")
        
        # Print more details for debugging
        import traceback
        print("\nFull traceback:")
        traceback.print_exc()
        
        return False

def test_llm_client_with_system_prompt():
    """Test LLM client with system prompt (should filter it out now)."""
    print("\n" + "=" * 60)
    print("Testing LLM Client with System Prompt")
    print("=" * 60)
    
    try:
        from llm_client import get_llm_client
        
        print("\n1. Making call with system prompt...")
        print("   (System prompt should be converted to user message prefix)")
        
        client = get_llm_client()
        response = client.call(
            prompt="What is 3+3?",
            system_prompt="You are a helpful math assistant. Be concise.",
            max_tokens=50,
            temperature=0.3
        )
        
        print(f"\n2. ✓ SUCCESS! Got response:")
        print(f"   Response: {response[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"\n✗ FAILED with error:")
        print(f"   {type(e).__name__}: {str(e)}")
        return False

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("LLM CLIENT FIX TEST")
    print("=" * 60)
    print("\nThis test will:")
    print("1. Test a simple LLM API call")
    print("2. Test LLM API call with system prompt")
    print("\nBoth should work without 400 Bad Request errors.")
    print("=" * 60)
    
    results = []
    
    # Test 1: Simple call
    results.append(("Simple API Call", test_llm_client_call()))
    
    # Test 2: Call with system prompt
    results.append(("API Call with System Prompt", test_llm_client_with_system_prompt()))
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{test_name:.<45} {status}")
    
    all_passed = all(result[1] for result in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ ALL TESTS PASSED!")
        print("\nThe LLM API is now working correctly.")
        print("The 400 Bad Request error has been fixed.")
        print("\nYou can now:")
        print("1. Run attack graphs in the UI")
        print("2. Click 'AI Analysis' button")
        print("3. See the team ID and analysis results")
    else:
        print("✗ SOME TESTS FAILED")
        print("\nPlease check:")
        print("1. Your .env file has correct TEAM_ID and API_TOKEN")
        print("2. The API server is running")
        print("3. The error messages above for more details")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())

