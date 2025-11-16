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

import { graphApiClient } from '@/lib/api/graphApi';
import { convertApiGraphToReactFlow } from '@/lib/utils/apiGraphConverter';
import { useGraphEditor } from '@/hooks/useGraphEditor';
import { useNodeSelection } from '@/hooks/useNodeSelection';
import { useNodeDragAndDrop } from '@/hooks/useNodeDragAndDrop';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function AttackEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [currentGraphId, setCurrentGraphId] = useState<string | null>(null);
  const [isNodeDataPanelOpen, setIsNodeDataPanelOpen] = useState(false);
  const [selectedNodeForData, setSelectedNodeForData] = useState<{ id: string; name: string } | null>(null);
  
  // Attack-specific state
  const [targetUrl, setTargetUrl] = useState('');
  const [isUrlSet, setIsUrlSet] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

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
    originalOnNodeClick(event, node);
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
  } = useNodeDragAndDrop(nodes, edges, [], setNodes, setEdges, fitView, currentGraphId, addLog);

  // Keyboard shortcuts
  useKeyboardShortcuts(selectedNode, handleDeleteNode);

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

  // Update node styles when executing or completed
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
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
        } else if (completedNodeIds.includes(node.id)) {
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

  // Update edge styles when executing
  useEffect(() => {
    if (executingNodeIds.length > 0) {
      setEdges((eds) =>
        eds.map((edge) => {
          const originalStyle = (edge as any).originalStyle || edge.style;
          if (executingNodeIds.includes(edge.target)) {
            return {
              ...edge,
              animated: true,
              style: {
                ...originalStyle,
                stroke: '#3b82f6',
                strokeWidth: 3,
                strokeDasharray: '5, 5',
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

  // Handle URL submission to create attack graph
  const handleSetTargetUrl = useCallback(async () => {
    if (!targetUrl.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(targetUrl);
    } catch {
      setUrlError('Please enter a valid URL');
      return;
    }

    setIsLoadingGraph(true);
    setUrlError(null);

    try {
      // Call API to create attack graph
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/graphs/attack/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_url: targetUrl,
          graph_name: `Attack: ${targetUrl}`,
          description: `Attack graph for ${targetUrl}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'Failed to create attack graph');
      }

      const data = await response.json();
      setCurrentGraphId(data.graph_id);
      
      // Convert API graph structure to React Flow format
      const { nodes: apiNodes, edges: apiEdges } = convertApiGraphToReactFlow(data.structure);
      
      setNodes(apiNodes);
      setEdges(apiEdges);
      setIsUrlSet(true);
      
      addLog({
        level: 'success',
        message: `Attack graph created for ${targetUrl}`,
        source: 'API'
      });

      // Fit view after a short delay
      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 100);
      
    } catch (error) {
      console.error('Failed to create attack graph:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUrlError(errorMessage);
      addLog({
        level: 'error',
        message: `Failed to create attack graph: ${errorMessage}`,
        source: 'API'
      });
    } finally {
      setIsLoadingGraph(false);
    }
  }, [targetUrl, setNodes, setEdges, fitView, addLog]);

  return (
    <div style={{ width: '100%', flex: 1, position: 'relative', minHeight: 0 }}>
      {/* URL Input Modal - shows when URL not set */}
      {!isUrlSet && (
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
            borderRadius: '12px',
            minWidth: '500px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              marginBottom: '1rem',
              fontWeight: 600,
              color: '#1f2937',
            }}>
              🎯 Attack Mode
            </h2>
            <p style={{ 
              marginBottom: '1.5rem',
              color: '#6b7280',
              lineHeight: '1.5',
            }}>
              Enter the URL of the API endpoint you want to test. 
              We'll create a simple graph that calls your API and allows you to add testing nodes on top.
            </p>
            
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 500,
              color: '#374151',
            }}>
              Target API URL
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSetTargetUrl();
                }
              }}
              placeholder="https://api.example.com/chat"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: urlError ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                marginBottom: '0.5rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                if (!urlError) {
                  e.target.style.borderColor = '#3b82f6';
                }
              }}
              onBlur={(e) => {
                if (!urlError) {
                  e.target.style.borderColor = '#d1d5db';
                }
              }}
            />
            
            {urlError && (
              <p style={{ 
                color: '#ef4444', 
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}>
                {urlError}
              </p>
            )}

            <button
              onClick={handleSetTargetUrl}
              disabled={isLoadingGraph}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: isLoadingGraph ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: isLoadingGraph ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isLoadingGraph) {
                  e.currentTarget.style.background = '#2563eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoadingGraph) {
                  e.currentTarget.style.background = '#3b82f6';
                }
              }}
            >
              {isLoadingGraph ? 'Creating Graph...' : 'Create Attack Graph'}
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoadingGraph && isUrlSet && (
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
            <div>Loading attack graph...</div>
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

      {/* Top Bar with URL display */}
      <TopBar 
        onRun={() => {
          console.log('[Attack Page] TopBar onRun triggered');
          console.log('[Attack Page] Current graph ID:', currentGraphId);
          handleRun(selectedNode, nodes, edges, currentGraphId);
        }} 
        isExecuting={isExecuting}
      />

      {/* URL Display Badge */}
      {isUrlSet && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '20px',
          background: 'white',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 10,
        }}>
          <span style={{ fontSize: '1.25rem' }}>🎯</span>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Target API
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1f2937' }}>
              {targetUrl}
            </div>
          </div>
          <button
            onClick={() => {
              setIsUrlSet(false);
              setTargetUrl('');
              setCurrentGraphId(null);
              setNodes([]);
              setEdges([]);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '1.25rem',
              padding: '0.25rem',
            }}
            title="Change URL"
          >
            ✕
          </button>
        </div>
      )}

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

export default function AttackPage() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ReactFlowProvider>
        <AttackEditor />
      </ReactFlowProvider>
    </div>
  );
}

