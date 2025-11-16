import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import { graphApiClient, type StreamExecutionEvent } from '@/lib/api/graphApi';

export interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source?: string;
}

/**
 * Hook to manage graph editor state and operations
 */
export function useGraphEditor() {
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);
  const [nodeCounter, setNodeCounter] = useState<Record<string, number>>({});
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingNodeIds, setExecutingNodeIds] = useState<string[]>([]);
  const [completedNodeIds, setCompletedNodeIds] = useState<string[]>([]);
  const streamCleanupRef = useRef<(() => void) | null>(null);

  // Add a log entry
  const addLog = useCallback((log: Omit<ExecutionLog, 'id' | 'timestamp'>) => {
    const newLog: ExecutionLog = {
      ...log,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };
    setExecutionLogs((prev) => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  }, []);

  // Clear logs
  const clearLogs = useCallback(() => {
    setExecutionLogs([]);
  }, []);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamCleanupRef.current) {
        console.log('[useGraphEditor] Cleaning up stream on unmount');
        streamCleanupRef.current();
      }
    };
  }, []);

  // Execution layers for supervisor pattern
  const getSupervisorExecutionLayers = useCallback((
    nodes: Node[], 
    edges: Edge[], 
    startNode: Node, 
    supervisorNode: Node,
    addLog: (log: { level: string; message: string; source?: string }) => void
  ): string[][] => {
    const layers: string[][] = [];
    const endNode = nodes.find(n => n.id === '__end__');
    
    // Layer 1: Start node
    layers.push([startNode.id]);
    
    // Layer 2: Find nodes connected to start (typically supervisor)
    const fromStart = edges
      .filter(e => e.source === startNode.id)
      .map(e => e.target);
    if (fromStart.length > 0) {
      layers.push(fromStart);
    }
    
    // Layer 3: Find all agent nodes (nodes with conditional edges from supervisor)
    const agentNodes = edges
      .filter(e => {
        const isConditional = e.conditional || e.data?.conditional;
        return e.source === 'supervisor' && isConditional && e.target !== '__end__';
      })
      .map(e => e.target);
    
    if (agentNodes.length > 0) {
      layers.push(agentNodes); // Agents run concurrently
      
      // Layer 4: Supervisor again (to collect results)
      layers.push(['supervisor']);
    }
    
    // Layer 5: End node
    if (endNode) {
      layers.push([endNode.id]);
    }

    console.log('[getSupervisorExecutionLayers] Execution layers:', layers);
    return layers;
  }, []);

  // Execution layers for sequential/DAG graphs using topological sort
  const getTopologicalExecutionLayers = useCallback((
    nodes: Node[], 
    edges: Edge[], 
    startNode: Node,
    addLog: (log: { level: string; message: string; source?: string }) => void
  ): string[][] => {
    const layers: string[][] = [];
    const nodeIds = new Set(nodes.map(n => n.id));
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();
    
    // Calculate in-degree for each node
    nodeIds.forEach(id => inDegree.set(id, 0));
    edges.forEach(edge => {
      if (nodeIds.has(edge.target)) {
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });
    
    console.log('[getTopologicalExecutionLayers] In-degrees:', Object.fromEntries(inDegree));
    
    // Process nodes layer by layer
    let currentLayer = [startNode.id];
    
    while (currentLayer.length > 0) {
      layers.push([...currentLayer]);
      currentLayer.forEach(nodeId => visited.add(nodeId));
      
      // Find next layer: nodes whose all predecessors have been visited
      const nextLayer = new Set<string>();
      
      currentLayer.forEach(nodeId => {
        // Find all nodes that this node connects to
        const outgoingEdges = edges.filter(e => e.source === nodeId);
        outgoingEdges.forEach(edge => {
          const targetId = edge.target;
          if (!visited.has(targetId) && nodeIds.has(targetId)) {
            // Check if all predecessors of targetId have been visited
            const predecessors = edges.filter(e => e.target === targetId);
            const allPredecessorsVisited = predecessors.every(e => visited.has(e.source));
            
            if (allPredecessorsVisited) {
              nextLayer.add(targetId);
            }
          }
        });
      });
      
      currentLayer = Array.from(nextLayer);
    }
    
    // Check if all nodes were visited
    if (visited.size < nodeIds.size) {
      const unvisited = Array.from(nodeIds).filter(id => !visited.has(id));
      console.warn('[getTopologicalExecutionLayers] Some nodes were not reached:', unvisited);
      addLog({ 
        level: 'warning', 
        message: `Some nodes are not connected to the start node: ${unvisited.join(', ')}`, 
        source: 'system' 
      });
    }
    
    console.log('[getTopologicalExecutionLayers] Execution layers:', layers);
    return layers;
  }, []);

  // Find execution layers - groups of nodes that can run concurrently
  const getExecutionLayers = useCallback((nodes: Node[], edges: Edge[]): string[][] => {
    console.log('[getExecutionLayers] Finding execution order for nodes:', nodes.map(n => n.id));
    console.log('[getExecutionLayers] Edges:', edges.map(e => `${e.source} -> ${e.target}`));
    
    // Find the start node
    const startNode = nodes.find(n => n.id === '__start__');
    if (!startNode) {
      addLog({ level: 'error', message: 'No start node found in graph', source: 'system' });
      return [];
    }

    // Check if this is a supervisor pattern (has 'supervisor' node with conditional edges)
    const supervisorNode = nodes.find(n => n.id === 'supervisor');
    const hasConditionalEdges = edges.some(e => e.conditional || e.data?.conditional);
    
    if (supervisorNode && hasConditionalEdges) {
      console.log('[getExecutionLayers] Detected supervisor pattern');
      return getSupervisorExecutionLayers(nodes, edges, startNode, supervisorNode, addLog);
    }
    
    // Otherwise, use topological sort for sequential/DAG execution
    console.log('[getExecutionLayers] Using topological sort for sequential execution');
    return getTopologicalExecutionLayers(nodes, edges, startNode, addLog);
  }, [addLog, getSupervisorExecutionLayers, getTopologicalExecutionLayers]);

  // Handler for run button - Stream execution from backend
  const handleRun = useCallback(async (
    selectedNode: Node | null,
    allNodes: Node[],
    allEdges: Edge[],
    graphId: string | null
  ) => {
    console.log('[useGraphEditor] handleRun called');
    console.log('[useGraphEditor] isExecuting:', isExecuting);
    console.log('[useGraphEditor] graphId:', graphId);
    
    // Prevent concurrent executions
    if (isExecuting) {
      console.warn('[useGraphEditor] Execution already in progress - blocking concurrent run');
      addLog({ level: 'warning', message: 'Execution already in progress. Please wait for current execution to complete.', source: 'system' });
      return;
    }
    
    if (!graphId) {
      addLog({ level: 'error', message: 'No graph loaded. Please load a graph first.', source: 'system' });
      return;
    }
    
    console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #3b82f6; font-weight: bold;');
    console.log('%c║  🎯 RUN BUTTON CLICKED - Starting Graph Execution             ║', 'color: #3b82f6; font-weight: bold; font-size: 13px;');
    console.log('%c║  Graph ID: ' + graphId?.substring(0, 30) + '...                    ║', 'color: #3b82f6;');
    console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #3b82f6; font-weight: bold;');
    console.log('');
    
    console.log('[useGraphEditor] Starting streaming execution...');
    setIsExecuting(true);
    setCompletedNodeIds([]); // Clear completed nodes on new execution
    clearLogs();

    // Queue for events to process with delay
    const eventQueue: StreamExecutionEvent[] = [];
    let isProcessingQueue = false;
    let currentLayer: string[] = [];
    let layerNumber = 0;
    let pendingNodeStarts: StreamExecutionEvent[] = [];

    // Process events from queue with delay
    const processEventQueue = async () => {
      if (isProcessingQueue) return;
      isProcessingQueue = true;

      while (eventQueue.length > 0) {
        const event = eventQueue.shift()!;
        
        // If this is a node_start, check if more are coming (concurrent execution)
        if (event.event_type === 'node_start') {
          pendingNodeStarts.push(event);
          
          // Collect all pending node_start events (no delay needed)
          while (eventQueue.length > 0 && eventQueue[0].event_type === 'node_start') {
            pendingNodeStarts.push(eventQueue.shift()!);
          }
          
          // Now process all the collected node_start events as a single layer
          if (pendingNodeStarts.length > 0) {
            // This is a new layer
            layerNumber++;
            console.log('');
            console.log(`%c┌─ Layer ${layerNumber} ─────────────────────────────────────────`, 'color: #8b5cf6; font-weight: bold;');
            
            addLog({
              level: 'info',
              message: '',
              source: 'System',
            });
      addLog({
        level: 'info',
              message: `┌─ Layer ${layerNumber} ─────────────────────────────────`,
              source: 'System',
            });
            
            // Process all node starts in this layer
            for (const startEvent of pendingNodeStarts) {
              currentLayer.push(startEvent.node_id || '');
              
              if (startEvent.node_id) {
                setExecutingNodeIds(prev => [...prev, startEvent.node_id!]);
              }
              
              console.log(`%c│  ▶️  Running: %c${startEvent.node_name || startEvent.node_id}`, 'color: #8b5cf6;', 'color: #10b981; font-weight: bold;');
              console.log(`%c│     Node ID: %c${startEvent.node_id}`, 'color: #8b5cf6;', 'color: #6b7280;');
              console.log(`%c│     Timestamp: %c${new Date(startEvent.timestamp).toLocaleTimeString()}`, 'color: #8b5cf6;', 'color: #6b7280;');
              
        addLog({
                level: 'info',
                message: `│  ▶️  Running: ${startEvent.node_name || startEvent.node_id}`,
                source: 'Execution',
              });
            }
            
            // Clear the buffer
            pendingNodeStarts = [];
          }
          
          // Continue to process node_complete events
          continue;
        }
        
        // Handle different event types
        switch (event.event_type) {
          case 'start':
            console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #3b82f6; font-weight: bold;');
            console.log('%c🚀 GRAPH EXECUTION STARTED', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
            console.log('%cExecution ID:', 'color: #3b82f6; font-weight: bold;', event.execution_id);
            console.log('%cGraph ID:', 'color: #3b82f6; font-weight: bold;', event.graph_id);
            console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #3b82f6; font-weight: bold;');
    
    addLog({
      level: 'info',
              message: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              source: 'System',
            });
            addLog({
              level: 'info',
              message: '🚀 GRAPH EXECUTION STARTED',
              source: 'System',
            });
            addLog({
              level: 'info',
              message: `Execution ID: ${event.execution_id}`,
              source: 'System',
    });
    addLog({
      level: 'info',
              message: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              source: 'System',
            });
            layerNumber = 0;
            break;

          case 'node_start':
            // This is now handled above in the buffering logic
            break;

          case 'node_complete':
            if (event.node_id) {
              setExecutingNodeIds(prev => prev.filter(id => id !== event.node_id));
              setCompletedNodeIds(prev => [...prev, event.node_id!]); // Add to completed nodes
              currentLayer = currentLayer.filter(id => id !== event.node_id);
            }
            
            const level = event.status === 'success' ? 'success' : 
                         event.status === 'error' ? 'error' : 'info';
            
            const statusIcon = event.status === 'success' ? '✓' : 
                              event.status === 'error' ? '✗' : '○';
            
            const statusColor = event.status === 'success' ? '#10b981' : 
                               event.status === 'error' ? '#ef4444' : '#6b7280';
            
            let message = `│  ${statusIcon} ${event.node_name || event.node_id}`;
            if (event.duration_ms) {
              message += ` • ${event.duration_ms.toFixed(2)}ms`;
            }
            
            console.log(`%c│  ${statusIcon} %c${event.node_name || event.node_id}`, 
              'color: #8b5cf6;', 
              `color: ${statusColor}; font-weight: bold;`);
            if (event.duration_ms) {
              console.log(`%c│     Duration: %c${event.duration_ms.toFixed(2)}ms`, 
                'color: #8b5cf6;', 
                'color: #f59e0b; font-weight: bold;');
            }
            console.log(`%c│     Status: %c${event.status}`, 
              'color: #8b5cf6;', 
              `color: ${statusColor};`);
            
            addLog({
              level,
              message,
              source: 'Result',
            });
            
            if (event.error) {
              console.log(`%c│     ↳ Error: %c${event.error}`, 'color: #8b5cf6;', 'color: #ef4444; font-weight: bold;');
              addLog({
                level: 'error',
                message: `│     ↳ Error: ${event.error}`,
                source: 'Error',
              });
            }
            
            // If this was the last node in the layer, close the layer
            if (currentLayer.length === 0) {
              console.log(`%c└────────────────────────────────────────────────────────────────`, 'color: #8b5cf6; font-weight: bold;');
          addLog({
            level: 'info',
                message: `└────────────────────────────────────────────`,
                source: 'System',
              });
            }
            
            // Add 2 second delay after each node completion
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;

          case 'complete':
            setExecutingNodeIds([]);
            
            console.log('');
            console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #10b981; font-weight: bold;');
            console.log('%c✅ GRAPH EXECUTION COMPLETED', 'color: #10b981; font-weight: bold; font-size: 14px;');
            if (event.duration_ms) {
              console.log('%c⏱️  Total Time: %c' + event.duration_ms.toFixed(2) + 'ms', 
                'color: #10b981; font-weight: bold;', 
                'color: #f59e0b; font-weight: bold;');
            }
            console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #10b981; font-weight: bold;');
        
        addLog({
          level: 'info',
              message: '',
              source: 'System',
            });
            addLog({
              level: 'success',
              message: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              source: 'System',
            });
            addLog({
              level: 'success',
              message: '✅ GRAPH EXECUTION COMPLETED',
              source: 'System',
            });
            
            if (event.duration_ms) {
              addLog({
                level: 'info',
                message: `⏱️  Total Time: ${event.duration_ms.toFixed(2)}ms`,
                source: 'System',
              });
            }
        
        addLog({
          level: 'success',
              message: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              source: 'System',
            });
            break;

          case 'error':
            setExecutingNodeIds([]);
            
            console.log('');
            console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ef4444; font-weight: bold;');
            console.log('%c❌ GRAPH EXECUTION FAILED', 'color: #ef4444; font-weight: bold; font-size: 14px;');
            console.log('%cError:', 'color: #ef4444; font-weight: bold;', event.message || 'Execution failed');
            if (event.error) {
              console.log('%cDetails:', 'color: #ef4444; font-weight: bold;', event.error);
            }
            console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ef4444; font-weight: bold;');

    addLog({
              level: 'error',
              message: '',
              source: 'System',
            });
            addLog({
              level: 'error',
              message: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              source: 'System',
    });
    addLog({
              level: 'error',
              message: '❌ GRAPH EXECUTION FAILED',
              source: 'System',
    });
    addLog({
              level: 'error',
              message: event.message || 'Execution failed',
              source: 'Error',
            });
            if (event.error) {
              addLog({
                level: 'error',
                message: `Details: ${event.error}`,
                source: 'Error',
              });
            }
            addLog({
              level: 'error',
              message: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              source: 'System',
            });
            break;
        }
      }

      isProcessingQueue = false;
    };

    // Start streaming execution
    const cleanup = graphApiClient.streamExecuteGraph(
      graphId,
      { initial_state: {} },
      (event: StreamExecutionEvent) => {
        // Log raw event received from stream
        console.log(`%c[Stream] Event Received: %c${event.event_type}`, 
          'color: #6366f1; font-weight: bold;', 
          'color: #8b5cf6; font-weight: bold;');
        console.log('[useGraphEditor] Received event:', event);
        
        // Add event to queue and start processing
        eventQueue.push(event);
        processEventQueue();
      },
      (error: Error) => {
        console.error('[useGraphEditor] Stream error:', error);
        setExecutingNodeIds([]);
        addLog({
          level: 'error',
          message: `Execution failed: ${error.message}`,
      source: 'system',
    });
        setIsExecuting(false);
      },
      () => {
        console.log('[useGraphEditor] Stream completed');
        console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #6b7280; font-weight: bold;');
        console.log('%c║  📡 Stream Closed - Connection Terminated                     ║', 'color: #6b7280; font-weight: bold;');
        console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #6b7280; font-weight: bold;');
        console.log('');
    setIsExecuting(false);
        streamCleanupRef.current = null;
      }
    );

    streamCleanupRef.current = cleanup;
  }, [isExecuting, addLog, clearLogs]);

  // Handler for adding nodes
  const handleNodeAdd = useCallback((
    nodeData: { id: string; title: string; icon: string; type: string; description?: string; nodeType?: string },
    setNodes: (callback: (nodes: Node[]) => Node[]) => void
  ) => {
    const currentCount = nodeCounter[nodeData.id] || 1;
    const nodeId = `${nodeData.id}-${currentCount}`;

    setNodeCounter(prev => ({
      ...prev,
      [nodeData.id]: currentCount + 1
    }));

    // Check if it's a testing node (prompt injection or other testing types)
    if (nodeData.type === 'testing' || nodeData.id === 'prompt-inject' || nodeData.nodeType === 'prompt_injection') {
      const newNode: Node = {
        id: nodeId,
        type: 'promptInject',
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: {
          icon: nodeData.icon,
          title: nodeData.title,
          nodeType: nodeData.nodeType || nodeData.id, // Store the node type for API calls
        },
        draggable: true,
      };
      setNodes((nds) => [...nds, newNode]);
    } else {
      const newNode: Node = {
        id: nodeId,
        type: 'default',
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: {
          label: (
            <div className="flex items-center gap-2">
              <span>{nodeData.icon}</span>
              <span>{nodeData.title}</span>
            </div>
          ),
        },
      };
      setNodes((nds) => [...nds, newNode]);
    }
  }, [nodeCounter, setNodeCounter]);

  return {
    isDirectoryOpen,
    setIsDirectoryOpen,
    isLogPanelOpen,
    setIsLogPanelOpen,
    handleRun,
    handleNodeAdd,
    executionLogs,
    isExecuting,
    executingNodeIds,
    completedNodeIds,
    clearLogs,
    addLog,
  };
}

