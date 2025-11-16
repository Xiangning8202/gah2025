"""Node-related data models."""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime


class NodeExecuteRequest(BaseModel):
    """Request to execute a single node."""
    graph_id: str = Field(..., description="ID of the graph containing the node")
    node_id: str = Field(..., description="ID of the node to execute")
    input_state: Dict[str, Any] = Field(default_factory=dict, description="Input state for the node")
    mock_previous_state: Optional[Dict[str, Any]] = Field(None, description="Mock state from previous nodes")
    config: Dict[str, Any] = Field(default_factory=dict, description="Execution configuration")


class NodeExecuteResponse(BaseModel):
    """Response after executing a node."""
    execution_id: str
    graph_id: str
    node_id: str
    node_name: str
    status: str
    input_state: Dict[str, Any]
    output_state: Dict[str, Any]
    logs: List[str] = []
    duration_ms: float
    executed_at: datetime = Field(default_factory=datetime.now)
    error: Optional[str] = None


class NodeStateResponse(BaseModel):
    """Response with node state information."""
    graph_id: str
    node_id: str
    node_name: str
    current_state: Dict[str, Any]
    input: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    execution_count: int
    last_executed: Optional[datetime] = None

