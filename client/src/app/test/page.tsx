"use client";

import { useMemo, useCallback, useEffect, useState } from 'react';
import {
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import NodeDirectory from '@/components/NodeDirectory';
import TopBar from '@/components/TopBar';
import LogPanel from '@/components/LogPanel';
import PromptInjectNode from '@/components/PromptInjectNode';
import GraphCanvas from '@/components/GraphCanvas';
import GraphControls from '@/components/GraphControls';
import NodeDataPanel from '@/components/NodeDataPanel';

import { mockGraphStructure } from '@/lib/data/mockGraphData';
import { convertGraphStructure } from '@/lib/utils/graphConverter';
import { convertApiGraphToReactFlow } from '@/lib/utils/apiGraphConverter';
import { graphApiClient } from '@/lib/api/graphApi';
import { useGraphEditor } from '@/hooks/useGraphEditor';
import { useNodeSelection } from '@/hooks/useNodeSelection';
import { useNodeDragAndDrop } from '@/hooks/useNodeDragAndDrop';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Convert the mock graph structure as fallback
const { nodes: fallbackNodes, edges: fallbackEdges } = convertGraphStructure(mockGraphStructure);

function GraphEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(fallbackNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(fallbackEdges);
  const { fitView } = useReactFlow();
  const [isLoadingGraph, setIsLoadingGraph] = useState(true);
  const [graphLoadError, setGraphLoadError] = useState<string | null>(null);
  const [currentGraphId, setCurrentGraphId] = useState<string | null>(null);
  const [isNodeDataPanelOpen, setIsNodeDataPanelOpen] = useState(false);
  const [selectedNodeForData, setSelectedNodeForData] = useState<{ id: string; name: string } | null>(null);

  // Custom hooks for managing state and behavior
  const {
    isDirectoryOpen,
    setIsDirectoryOpen,
    isLogPanelOpen,
    setIsLogPanelOpen,
    handleRun,
    handleNodeAdd: handleNodeAddBase,
    executionLogs,
    isExecuting,
    executingNodeIds,
    completedNodeIds,
    clearLogs,
    addLog,
  } = useGraphEditor();

  const {
    selectedNode,
    onNodeClick: originalOnNodeClick,
    handleDeleteNode,
  } = useNodeSelection(edges, setNodes, setEdges);

  // Enhanced node click handler to also open data panel
  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    // Call original handler for selection
    originalOnNodeClick(event, node);
    
    // Open data panel with node info
    setSelectedNodeForData({ id: node.id, name: node.data?.label || node.id });
    setIsNodeDataPanelOpen(true);
  }, [originalOnNodeClick]);

  // Handler to fetch node data
  const handleFetchNodeData = useCallback(async (graphId: string, nodeId: string) => {
    return await graphApiClient.getNodeState(graphId, nodeId);
  }, []);

  const {
    draggedNode,
    hoveredEdge,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  } = useNodeDragAndDrop(nodes, edges, fallbackEdges, setNodes, setEdges, fitView, currentGraphId, addLog);

  // Keyboard shortcuts
  useKeyboardShortcuts(selectedNode, handleDeleteNode);

  // Load graph from API on mount
  useEffect(() => {
    const loadGraphFromApi = async () => {
      setIsLoadingGraph(true);
      setGraphLoadError(null);
      
      try {
        // First check if API is healthy
        await graphApiClient.healthCheck();
        
        let graphData;
        let loadedGraphId: string | null = null;
        
        // Always try to load a fresh graph from backend
        console.log('Loading graph from backend...');
        try {
          const loadResponse = await graphApiClient.loadGraph({
            file_path: '../backend/graph_3.py',
            graph_name: 'Graph 3 Workflow',
            description: 'Graph 3 loaded from backend'
          });
          graphData = loadResponse.structure;
          loadedGraphId = loadResponse.graph_id;
          console.log('Loaded graph from backend with ID:', loadedGraphId);
          addLog({ 
            level: 'success', 
            message: `Loaded graph: ${loadResponse.name} (ID: ${loadedGraphId})`,
            source: 'API'
          });
        } catch (loadError) {
          console.error('Failed to load graph from backend:', loadError);
          
          // Try to list existing graphs as fallback
          const graphList = await graphApiClient.listGraphs();
          
          if (graphList.graphs.length > 0) {
            // Load the first available graph
            const firstGraph = graphList.graphs[0];
            const graphResponse = await graphApiClient.getGraph(firstGraph.graph_id);
            graphData = graphResponse.structure;
            loadedGraphId = firstGraph.graph_id;
            console.log('Loaded existing graph:', firstGraph.name);
            addLog({ 
              level: 'success', 
              message: `Loaded existing graph: ${firstGraph.name}`,
              source: 'API'
            });
          } else {
            addLog({ 
              level: 'warning', 
              message: 'Could not load graph from backend, using mock data',
              source: 'API'
            });
            // Use mock data as fallback
            setIsLoadingGraph(false);
            setCurrentGraphId(null);
            return;
          }
        }
        
        setCurrentGraphId(loadedGraphId);
        
        // Convert API graph structure to React Flow format
        console.log('Raw graph data from API:', graphData);
        console.log('Nodes in graphData:', Object.keys(graphData.nodes || {}));
        console.log('Edges in graphData:', graphData.edges);
        
        const { nodes: apiNodes, edges: apiEdges } = convertApiGraphToReactFlow(graphData);
        
        console.log('Converted to React Flow - Nodes:', apiNodes.length, apiNodes);
        console.log('Converted to React Flow - Edges:', apiEdges.length, apiEdges);
        
        // Update nodes and edges
        setNodes(apiNodes);
        setEdges(apiEdges);
        
        // Fit view after a short delay to ensure nodes are rendered
        setTimeout(() => {
          fitView({ padding: 0.2 });
        }, 100);
        
      } catch (error) {
        console.error('Failed to load graph from API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setGraphLoadError(errorMessage);
        addLog({ 
          level: 'error', 
          message: `Failed to connect to API: ${errorMessage}. Using mock data.`,
          source: 'API'
        });
        // Keep using fallback mock data
      } finally {
        setIsLoadingGraph(false);
      }
    };

    loadGraphFromApi();
  }, [fitView, setNodes, setEdges]);

  // Update node styles when executing or completed
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        // Currently executing - blue pulsing border
        if (executingNodeIds.includes(node.id)) {
          return {
            ...node,
            style: {
              ...node.style,
              borderWidth: '3px',
              borderStyle: 'solid',
              borderColor: '#3b82f6',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              backgroundColor: '#eff6ff',
            },
          };
        }
        // Completed - green border
        else if (completedNodeIds.includes(node.id)) {
          return {
            ...node,
            style: {
              ...node.style,
              borderWidth: '3px',
              borderStyle: 'solid',
              borderColor: '#10b981',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
              backgroundColor: '#f0fdf4',
              animation: undefined,
            },
          };
        }
        // Default - no special styling
        return {
          ...node,
          style: {
            ...node.style,
            borderWidth: undefined,
            borderStyle: undefined,
            borderColor: undefined,
            boxShadow: undefined,
            animation: undefined,
            backgroundColor: undefined,
          },
        };
      })
    );
  }, [executingNodeIds, completedNodeIds, setNodes]);

  // Update edge styles when executing - animate edges connected to executing nodes
  useEffect(() => {
    if (executingNodeIds.length > 0) {
      setEdges((eds) =>
        eds.map((edge) => {
          // Store original style if not already stored
          const originalStyle = (edge as any).originalStyle || edge.style;
          
          // Animate edges that connect TO currently executing nodes
          if (executingNodeIds.includes(edge.target)) {
            return {
              ...edge,
              animated: true,
              style: {
                ...originalStyle,
                stroke: '#3b82f6',
                strokeWidth: 3,
                strokeDasharray: '5, 5', // Dotted line pattern
              },
              originalStyle,
            } as any;
          }
          return {
            ...edge,
            animated: false,
            style: originalStyle,
            originalStyle,
          } as any;
        })
      );
    } else {
      // Reset all edge styles when not executing
      setEdges((eds) =>
        eds.map((edge) => {
          const originalStyle = (edge as any).originalStyle || edge.style;
          return {
            ...edge,
            animated: false,
            style: originalStyle,
            originalStyle,
          } as any;
        })
      );
    }
  }, [executingNodeIds, setEdges]);

  // Define custom node types
  const nodeTypes = useMemo(() => ({
    promptInject: PromptInjectNode,
  }), []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Wrap handleNodeAdd to pass setNodes
  const handleNodeAdd = useCallback((nodeData: { id: string; title: string; icon: string; type: string; description?: string; nodeType?: string }) => {
    handleNodeAddBase(nodeData, setNodes);
  }, [handleNodeAddBase, setNodes]);

  return (
    <div style={{ width: '100%', flex: 1, position: 'relative', minHeight: 0 }}>
      {/* Loading overlay */}
      {isLoadingGraph && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⏳</div>
            <div>Loading graph from API...</div>
          </div>
        </div>
      )}

      {/* React Flow Canvas */}
      <GraphCanvas
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
      />

      {/* Graph Controls (Add, Delete, Hints) */}
      <GraphControls
        selectedNode={selectedNode}
        draggedNode={draggedNode}
        hoveredEdge={hoveredEdge}
        edges={edges}
        onAddNodeClick={() => setIsDirectoryOpen(true)}
        onDeleteNode={handleDeleteNode}
      />

      {/* Top Bar */}
      <TopBar 
        onRun={() => {
          console.log('[Page] TopBar onRun triggered');
          console.log('[Page] Current isExecuting state:', isExecuting);
          console.log('[Page] Number of nodes:', nodes.length);
          console.log('[Page] Number of edges:', edges.length);
          console.log('[Page] Current graph ID:', currentGraphId);
          handleRun(selectedNode, nodes, edges, currentGraphId);
        }} 
        isExecuting={isExecuting}
      />

      {/* Node Directory Modal */}
      <NodeDirectory
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        onNodeAdd={handleNodeAdd}
      />

      {/* Log Panel */}
      <LogPanel
        isOpen={isLogPanelOpen}
        onToggle={() => setIsLogPanelOpen(!isLogPanelOpen)}
        logs={executionLogs}
        onClearLogs={clearLogs}
      />

      {/* Node Data Panel */}
      <NodeDataPanel
        isOpen={isNodeDataPanelOpen}
        nodeId={selectedNodeForData?.id || null}
        nodeName={selectedNodeForData?.name || null}
        graphId={currentGraphId}
        onClose={() => setIsNodeDataPanelOpen(false)}
        onFetchData={handleFetchNodeData}
      />
    </div>
  );
}

export default function TestPage() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ReactFlowProvider>
        <GraphEditor />
      </ReactFlowProvider>
    </div>
  );
}

