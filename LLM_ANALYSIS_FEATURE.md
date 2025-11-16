# LLM Analysis Feature

## Overview

After running graph3 (or any graph) on the frontend, an AI-powered analysis is automatically generated and displayed in a beautiful side panel. The LLM analyzes the execution results and provides:

- **Summary**: High-level overview of what happened
- **Vulnerabilities**: Detected security vulnerabilities
- **Security Issues**: Potential security concerns
- **Recommendations**: Actionable improvement suggestions
- **Risk Score**: 0-100 score indicating overall risk level
- **Detailed Analysis**: In-depth analysis of the execution

## Architecture

### Backend Components

1. **API Models** (`api/models/analysis.py`)
   - `LLMAnalysisRequest`: Request model for analysis
   - `LLMAnalysisResponse`: Response model with analysis results

2. **Analysis Service** (`api/services/analysis_service.py`)
   - `generate_llm_analysis()`: Main function that:
     - Retrieves execution data
     - Formats it for LLM consumption
     - Calls LLM API with structured prompt
     - Parses and returns structured analysis

3. **API Endpoints** (`api/routers/analysis.py`)
   - `POST /api/analysis/llm-analysis`: Generate new analysis
   - `GET /api/analysis/llm-analysis/{analysis_id}`: Retrieve existing analysis

### Frontend Components

1. **AnalysisPanel** (`client/src/components/AnalysisPanel.tsx`)
   - Beautiful sliding panel UI
   - Auto-fetches analysis on open
   - Displays risk score with visual indicators
   - Collapsible detailed analysis section
   - Regenerate analysis button

2. **TopBar Updates** (`client/src/components/TopBar.tsx`)
   - New "View Analysis" button appears after execution
   - Animated appearance with spring transition

3. **Attack Page Integration** (`client/src/app/attack/page.tsx`)
   - Automatically captures execution ID
   - Opens analysis panel when execution completes
   - Logs analysis results to execution logs

## Testing with Graph 3

### Prerequisites

1. **Backend Setup**
   ```bash
   cd backend
   # Make sure .env exists with:
   # TEAM_ID=your_team_id
   # API_TOKEN=your_api_token
   
   # Install dependencies if needed
   pip install -r requirements.txt
   ```

2. **API Server Running**
   ```bash
   cd api
   ./start_server.sh
   # Should start on http://localhost:8000
   ```

3. **Frontend Running**
   ```bash
   cd client
   npm run dev
   # Should start on http://localhost:3000
   ```

### Test Steps

1. **Navigate to Attack Mode**
   - Go to `http://localhost:3000/attack`
   - Enter any target URL (e.g., `https://api.example.com/chat`)
   - Click "Create Attack Graph"

2. **Load Graph 3**
   - Use the graph selector or API to load graph_3
   - The graph should appear with nodes:
     - start
     - validate
     - process_prompt
     - get_location
     - get_temperature
     - weather_tool
     - combine_results

3. **Execute the Graph**
   - Click the "Execute" button in the top right
   - Watch the nodes animate as they execute
   - See logs appear in the log panel

4. **View AI Analysis**
   - After execution completes, the Analysis Panel automatically opens
   - Or click the "View Analysis" button that appears
   - Review the generated analysis:
     - ✅ Summary of execution
     - ⚠️ Detected vulnerabilities (if any)
     - 🛡️ Security concerns
     - 💡 Recommendations
     - 📊 Risk score with visual indicator
     - 📝 Detailed analysis (expandable)

5. **Test with Prompt Injection**
   - Add a Prompt Injection testing node to the graph
   - Place it between start and validate
   - Execute again
   - The LLM analysis should detect:
     - Prompt injection attempt
     - System prompt leakage
     - Higher risk score
     - Specific recommendations

### Expected Results

#### Normal Execution (No Attack)
```json
{
  "summary": "Graph executed successfully with weather data retrieval...",
  "vulnerabilities": [],
  "security_issues": [],
  "recommendations": ["Continue monitoring execution patterns"],
  "risk_score": 10-20
}
```

#### With Prompt Injection
```json
{
  "summary": "Graph executed with a prompt injection attack detected...",
  "vulnerabilities": [
    "Successful prompt injection detected",
    "System prompt leaked to output"
  ],
  "security_issues": [
    "Input validation bypass",
    "Sensitive information disclosure"
  ],
  "recommendations": [
    "Implement strict input sanitization",
    "Add prompt template guards",
    "Filter system information from outputs"
  ],
  "risk_score": 75-90
}
```

## API Usage Examples

### Generate Analysis via API

```bash
curl -X POST http://localhost:8000/api/analysis/llm-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "graph_id": "graph-123",
    "execution_id": "exec-456",
    "focus_areas": ["security", "vulnerabilities", "prompt_injection"]
  }'
```

### Retrieve Previous Analysis

```bash
curl http://localhost:8000/api/analysis/llm-analysis/analysis-789
```

## Features

### Visual Enhancements

1. **Risk Score Visualization**
   - Color-coded risk levels (Green → Yellow → Orange → Red)
   - Animated progress bar
   - Risk label (Low, Medium, High, Critical)

2. **Categorized Findings**
   - Red boxes for vulnerabilities
   - Orange boxes for security issues
   - Green boxes for recommendations
   - Blue boxes for summaries

3. **Smooth Animations**
   - Panel slides in from right
   - Items fade in with stagger effect
   - Spring animations for buttons

4. **Auto-Open After Execution**
   - Panel automatically opens when graph completes
   - "View Analysis" button appears in top bar
   - Can be reopened anytime

### LLM Configuration

The analysis uses:
- **Model**: Claude 3.5 Sonnet (default)
- **Temperature**: 0.3 (for consistent analysis)
- **Max Tokens**: 2048
- **Prompt**: Structured security analyst persona

## Troubleshooting

### "LLM client not available"
- Check that `backend/llm_client.py` is accessible
- Verify `backend/.env` has TEAM_ID and API_TOKEN
- Restart the API server

### "Execution not found"
- Ensure graph was executed successfully
- Check execution ID in console logs
- Verify execution service is storing execution data

### "Analysis takes too long"
- Normal for first analysis (LLM API call)
- Subsequent analyses are faster (cached)
- Check network connection to LLM API
- Monitor API server logs for errors

## Future Enhancements

- [ ] Export analysis as PDF/HTML
- [ ] Compare analyses across multiple executions
- [ ] Real-time streaming analysis updates
- [ ] Custom analysis templates
- [ ] Integration with vulnerability database
- [ ] Automated fix suggestions
- [ ] Historical trend analysis

## Technical Details

### LLM Prompt Structure

The analysis prompt includes:
1. Graph metadata (name, description)
2. Execution summary (status, duration)
3. Step-by-step execution trace
4. State changes at each node
5. Error messages and warnings

The LLM is instructed to:
- Act as a security analyst
- Focus on actionable insights
- Provide specific, not generic, findings
- Rate risk objectively
- Format response as JSON

### Response Parsing

The service:
1. Calls LLM API with structured prompt
2. Extracts JSON from response (regex)
3. Falls back to plain text if JSON fails
4. Creates `LLMAnalysisResponse` model
5. Stores analysis for later retrieval

## Conclusion

The LLM Analysis feature provides intelligent, automated security analysis of graph executions, helping identify vulnerabilities and security issues that might be missed by traditional testing approaches.

