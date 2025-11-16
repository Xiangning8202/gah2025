"""Attack mode endpoints for testing external APIs."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from services.graph_service import get_graph_service
from services.execution_service import get_execution_service
from models.graph import GraphLoadResponse, GraphExecuteRequest
from fastapi.responses import StreamingResponse
import json

router = APIRouter(prefix="/api/graphs/attack", tags=["attack"])


class AttackGraphCreateRequest(BaseModel):
    """Request to create an attack graph."""
    target_url: str
    graph_name: str
    description: Optional[str] = None


class AttackGraphCreateResponse(BaseModel):
    """Response after creating an attack graph."""
    graph_id: str
    name: str
    description: Optional[str]
    target_url: str
    structure: Dict[str, Any]
    created_at: str


@router.post("/create", response_model=AttackGraphCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_attack_graph(request: AttackGraphCreateRequest):
    """
    Create a new attack graph targeting an external API.
    
    This creates a simple graph with:
    - Start node
    - Validate node
    - API call node (calls the target URL)
    - End node
    
    Testing nodes can be added on top of this graph.
    """
    try:
        graph_service = get_graph_service()
        
        # Create the attack graph by loading from attack_graph.py
        # We'll use a temporary Python code approach to inject the target URL
        attack_graph_path = backend_dir / "attack_graph.py"
        
        # Load the graph with the target URL
        load_response = graph_service.load_graph_from_module(
            file_path=str(attack_graph_path),
            graph_name=request.graph_name,
            description=request.description or f"Attack graph for {request.target_url}",
            build_kwargs={"target_url": request.target_url}
        )
        
        # Store the target URL in the graph metadata
        if load_response.graph_id in graph_service.graphs:
            graph_service.graphs[load_response.graph_id]["metadata"] = {
                "target_url": request.target_url,
                "mode": "attack"
            }
        
        return AttackGraphCreateResponse(
            graph_id=load_response.graph_id,
            name=load_response.name,
            description=load_response.description,
            target_url=request.target_url,
            structure=load_response.structure,
            created_at=load_response.created_at,
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create attack graph: {str(e)}"
        )


@router.post("/{graph_id}/execute/stream")
async def stream_execute_attack_graph(graph_id: str, request: GraphExecuteRequest):
    """
    Execute an attack graph with streaming updates via Server-Sent Events.
    
    This is similar to the regular graph execution but specifically for attack mode graphs.
    """
    graph_service = get_graph_service()
    execution_service = get_execution_service()
    
    # Verify graph exists and is an attack graph
    if graph_id not in graph_service.graphs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Graph not found: {graph_id}"
        )
    
    # Get target URL from metadata
    graph_data = graph_service.graphs[graph_id]
    metadata = graph_data.get("metadata", {})
    target_url = metadata.get("target_url")
    
    if not target_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Graph is not an attack graph (missing target_url)"
        )
    
    # Add target URL to initial state if not present
    if "target_url" not in request.initial_state:
        request.initial_state["target_url"] = target_url
    
    async def event_generator():
        """Generate Server-Sent Events."""
        try:
            for event in execution_service.stream_full_graph_execution(
                graph_id,
                request,
                graph_service
            ):
                # Convert event to dict and then to JSON
                event_dict = event.dict()
                # Convert datetime to ISO format string
                if 'timestamp' in event_dict and event_dict['timestamp']:
                    event_dict['timestamp'] = event_dict['timestamp'].isoformat()
                
                # Format as SSE
                yield f"data: {json.dumps(event_dict)}\n\n"
        except Exception as e:
            # Send error event
            error_event = {
                "event_type": "error",
                "error": str(e),
                "message": f"Stream error: {str(e)}"
            }
            yield f"data: {json.dumps(error_event)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

