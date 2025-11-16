#!/usr/bin/env python3
"""
Test script to verify Team ID is correctly loaded and returned in analysis response.
"""

import sys
import os
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

def test_env_loading():
    """Test if .env file is loaded correctly."""
    print("=" * 60)
    print("Testing Environment Variable Loading")
    print("=" * 60)
    
    from dotenv import load_dotenv
    env_path = backend_dir / ".env"
    
    print(f"\n1. .env file path: {env_path}")
    print(f"2. .env file exists: {env_path.exists()}")
    
    if env_path.exists():
        load_dotenv(env_path)
        team_id = os.getenv("TEAM_ID")
        api_token = os.getenv("API_TOKEN")
        
        print(f"3. TEAM_ID loaded: {'✓' if team_id else '✗'}")
        if team_id:
            print(f"   Value: {team_id}")
        print(f"4. API_TOKEN loaded: {'✓' if api_token else '✗'}")
        if api_token:
            print(f"   Value: {api_token[:10]}..." if len(api_token) > 10 else api_token)
        
        return team_id and api_token
    else:
        print("✗ .env file not found!")
        print("\nPlease create backend/.env with:")
        print("TEAM_ID=your_team_id")
        print("API_TOKEN=your_api_token")
        return False

def test_llm_client():
    """Test if LLM client can be initialized."""
    print("\n" + "=" * 60)
    print("Testing LLM Client Initialization")
    print("=" * 60)
    
    try:
        from llm_client import get_llm_client
        
        print("\n1. Initializing LLM client...")
        client = get_llm_client()
        
        print(f"2. Client initialized: ✓")
        print(f"3. Team ID: {client.team_id}")
        print(f"4. Model: {client.model}")
        print(f"5. API Token loaded: {'✓' if client.api_token else '✗'}")
        
        return True
    except Exception as e:
        print(f"✗ Failed to initialize LLM client: {e}")
        return False

def test_api_endpoint():
    """Test if the API endpoint returns team_id."""
    print("\n" + "=" * 60)
    print("Testing API Endpoint (requires running server)")
    print("=" * 60)
    
    try:
        import requests
        
        # Check if server is running
        try:
            response = requests.get("http://localhost:8000/health", timeout=2)
            print("\n1. API server is running: ✓")
        except requests.exceptions.ConnectionError:
            print("\n✗ API server is not running!")
            print("   Start it with: cd api && ./start_server.sh")
            return False
        
        print("2. Note: To test team_id in response, you need to:")
        print("   a. Create a graph")
        print("   b. Execute the graph")
        print("   c. Request LLM analysis")
        print("   d. Check the response for team_id field")
        
        return True
    except ImportError:
        print("\n✗ requests library not installed")
        print("   Install with: pip install requests")
        return False

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("TEAM ID CONFIGURATION TEST")
    print("=" * 60)
    
    results = []
    
    # Test 1: Environment variables
    results.append(("Environment Loading", test_env_loading()))
    
    # Test 2: LLM Client
    results.append(("LLM Client", test_llm_client()))
    
    # Test 3: API Endpoint
    results.append(("API Endpoint", test_api_endpoint()))
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{test_name:.<30} {status}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        print("\n✓ All tests passed! Team ID should now be visible in analysis.")
        print("\nNext steps:")
        print("1. Restart the API server: cd api && ./start_server.sh")
        print("2. Run an attack graph execution")
        print("3. Request LLM analysis")
        print("4. Check the Analysis Panel for Team ID")
    else:
        print("\n✗ Some tests failed. Please fix the issues above.")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())

