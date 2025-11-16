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
import { motion } from 'framer-motion';
import { Loader2, X, ArrowRight } from 'lucide-react';

import NodeDirectory from '@/components/NodeDirectory';
import TopBar from '@/components/TopBar';
import LogPanel from '@/components/LogPanel';
import PromptInjectNode from '@/components/PromptInjectNode';
import GraphCanvas from '@/components/GraphCanvas';
import GraphControls from '@/components/GraphControls';
import NodeDataPanel from '@/components/NodeDataPanel';
import { Button } from '@/components/ui/button';

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
    <div className="w-full flex-1 relative min-h-0">
      {/* URL Input Modal - shows when URL not set */}
      {!isUrlSet && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-zinc-900 p-8 rounded-2xl min-w-[550px] shadow-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl"
                >
                  <span className="text-3xl">🎯</span>
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Attack Mode
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Deploy autonomous testing agents
                  </p>
                </div>
              </div>
              
              <p className="mb-6 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Enter the URL of the API endpoint you want to test. 
                We'll create a graph that calls your API and allows you to add adversarial testing nodes.
              </p>
              
              <label className="block mb-2 font-semibold text-zinc-700 dark:text-zinc-300">
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
                className={`
                  w-full px-4 py-3 rounded-xl text-base mb-2 outline-none transition-all
                  bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50
                  placeholder-zinc-400 dark:placeholder-zinc-500
                  ${urlError 
                    ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500' 
                    : 'border border-zinc-200 dark:border-zinc-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                  }
                `}
              />
              
              {urlError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 dark:text-red-400 text-sm mb-4 flex items-center gap-2"
                >
                  <span>⚠️</span>
                  {urlError}
                </motion.p>
              )}

              <Button
                onClick={handleSetTargetUrl}
                disabled={isLoadingGraph}
                className="w-full py-6 rounded-xl text-base font-semibold bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                {isLoadingGraph ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creating Graph...
                  </>
                ) : (
                  <>
                    Create Attack Graph
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </>
      )}

      {/* Loading overlay */}
      {isLoadingGraph && isUrlSet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-zinc-900 p-8 rounded-2xl text-center shadow-2xl"
          >
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-violet-600" />
            <div className="text-zinc-900 dark:text-zinc-50 font-medium">Loading attack graph...</div>
          </motion.div>
        </motion.div>
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
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-20 left-5 bg-white dark:bg-zinc-900 px-4 py-3 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 z-10 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95"
        >
          <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
            <span className="text-xl">🎯</span>
          </div>
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
              Target API
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 max-w-[200px] truncate">
              {targetUrl}
            </div>
          </div>
          <Button
            onClick={() => {
              setIsUrlSet(false);
              setTargetUrl('');
              setCurrentGraphId(null);
              setNodes([]);
              setEdges([]);
            }}
            size="icon"
            variant="ghost"
            className="h-8 w-8 ml-2"
            title="Change URL"
          >
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
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

