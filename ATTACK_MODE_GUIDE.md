# Attack Mode Guide

## Overview

Attack Mode allows you to test external APIs with security testing nodes. This feature is designed for red-teaming and security testing of AI agent systems exposed through APIs.

## Features

### 1. External API Testing
- Target any external API endpoint
- Supports both GET and POST requests
- Automatically handles JSON and text responses

### 2. Simple Graph Structure
Attack graphs have a minimal structure:
```
Start → Validate → API Call → End
```

Testing nodes can be inserted between Start and Validate to modify the prompt before it reaches the API.

### 3. Reusable Testing Nodes
All testing nodes from the `/test` page work in attack mode:
- **Prompt Injection**: Attempts to extract system prompts
- **Fuzzer**: Tests input validation with malformed data
- Any other testing nodes you've created

### 4. Real-time Execution Monitoring
- Streaming execution events via Server-Sent Events (SSE)
- Watch each node execute in real-time
- See API responses immediately

## Usage

### Frontend (`/attack` page)

1. **Navigate to Attack Mode**
   - Go to `http://localhost:3000/attack`
   - Or click "Attack" in the navigation bar

2. **Set Target URL**
   - Enter the URL of the API you want to test
   - Example: `https://api.example.com/chat`
   - Click "Create Attack Graph"

3. **Add Testing Nodes**
   - Click the "+" button to open the node directory
   - Drag and drop testing nodes onto the graph
   - Position them between "start" and "validate" nodes

4. **Execute Attack**
   - Click the "Run" button in the top bar
   - Watch the execution in real-time
   - View results in the log panel

### Backend API

#### Create Attack Graph
```bash
POST /api/graphs/attack/create
Content-Type: application/json

{
  "target_url": "https://api.example.com/chat",
  "graph_name": "My Attack Test",
  "description": "Testing external API security"
}
```

Response:
```json
{
  "graph_id": "uuid",
  "name": "My Attack Test",
  "target_url": "https://api.example.com/chat",
  "structure": {
    "nodes": {...},
    "edges": [...]
  }
}
```

#### Execute Attack Graph
```bash
POST /api/graphs/attack/{graph_id}/execute/stream
Content-Type: application/json

{
  "initial_state": {
    "prompt": "Hello, can you help me?"
  }
}
```

Returns Server-Sent Events stream with execution updates.

## Architecture

### Frontend Components
- **`/client/src/app/attack/page.tsx`**: Main attack page
- Reuses existing components:
  - `GraphCanvas`: Visual graph editor
  - `GraphControls`: Node manipulation controls
  - `NodeDirectory`: Testing node catalog
  - `LogPanel`: Execution logs

### Backend Components
- **`/backend/attack_graph.py`**: Attack graph definition
- **`/api/routers/attack.py`**: Attack mode API endpoints
- **`/api/services/graph_service.py`**: Enhanced with `load_graph_from_module()`

### Graph Structure
```python
class AttackState(TypedDict):
    prompt: str                  # Current prompt (can be modified by testing nodes)
    original_prompt: str         # Preserved original
    injection_applied: bool      # Flag for prompt injection
    fuzzing_applied: bool        # Flag for fuzzing
    target_url: str             # External API URL
    api_response: str           # Response from external API
    status_code: int            # HTTP status code
    result: str                 # Final result
```

## Examples

### Example 1: Test Prompt Injection
1. Create attack graph targeting `https://api.example.com/chat`
2. Add "Prompt Injection" node between start and validate
3. Run the attack
4. Observe if the external API reveals its system prompt

### Example 2: Test Input Validation
1. Create attack graph targeting your API
2. Add "Fuzzer" node to generate malformed inputs
3. Run the attack
4. Check if API handles edge cases properly

### Example 3: Custom Testing Sequence
1. Create attack graph
2. Add multiple testing nodes in sequence:
   - Prompt Injection
   - Fuzzer
   - Custom validation node
3. Run and analyze results

## Testing

Run the test script to verify everything works:
```bash
cd api
python test_attack_api.py
```

This will:
1. Check API health
2. Create an attack graph
3. Execute the graph with streaming
4. Display all events

## Security Considerations

⚠️ **Important**: Attack Mode is designed for authorized security testing only.

- Only test APIs you own or have permission to test
- Be aware of rate limits on external APIs
- Some security testing techniques may be detected by WAFs
- Always follow responsible disclosure practices

## Troubleshooting

### Common Issues

**Issue**: "Failed to create attack graph"
- **Solution**: Check that the backend server is running (`python api/main.py`)
- **Solution**: Verify the attack_graph.py file exists in `/backend`

**Issue**: "API call failed"
- **Solution**: Check that the target URL is accessible
- **Solution**: Verify the target API accepts POST requests with JSON body
- **Solution**: Check CORS settings if calling from browser

**Issue**: "No events received"
- **Solution**: Check browser console for SSE connection errors
- **Solution**: Verify streaming endpoint is working (`/execute/stream`)

## Future Enhancements

Potential improvements for attack mode:
- Support for custom HTTP headers
- Authentication token management
- Response analysis and scoring
- Automated vulnerability detection
- Report generation
- Batch testing with multiple prompts

