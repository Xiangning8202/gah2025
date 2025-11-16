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
import AnalysisPanel from '@/components/AnalysisPanel';
import GraphStatsPanel from '@/components/GraphStatsPanel';
import GraphActionsPanel from '@/components/GraphActionsPanel';
import NodeSearchPanel from '@/components/NodeSearchPanel';
import ExecutionHistoryPanel from '@/components/ExecutionHistoryPanel';
import { motion } from 'framer-motion';

import { mockGraphStructure } from '@/lib/data/mockGraphData';
import { convertGraphStructure } from '@/lib/utils/graphConverter';
import { convertApiGraphToReactFlow } from '@/lib/utils/apiGraphConverter';
import { graphApiClient } from '@/lib/api/graphApi';
import { useGraphEditor } from '@/hooks/useGraphEditor';
import { useNodeSelection } from '@/hooks/useNodeSelection';
import { useNodeDragAndDrop } from '@/hooks/useNodeDragAndDrop';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGraphHistory } from '@/hooks/useGraphHistory';
import { BarChart3, Search, Clock } from 'lucide-react';

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
  
  // Analysis panel state
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);
  const [lastExecutionId, setLastExecutionId] = useState<string | null>(null);
  
  // New feature states
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [executionCount, setExecutionCount] = useState(0);
  const [testingNodeCount, setTestingNodeCount] = useState(0);

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
    lastExecutionId: hookLastExecutionId,
  } = useGraphEditor();

  // Update execution ID when available from hook and auto-open analysis panel
  useEffect(() => {
    if (hookLastExecutionId && hookLastExecutionId !== lastExecutionId) {
      setLastExecutionId(hookLastExecutionId);
      // Automatically open analysis panel after execution completes
      setIsAnalysisPanelOpen(true);
    }
  }, [hookLastExecutionId, lastExecutionId]);

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
  
  // Graph history (undo/redo)
  const { canUndo, canRedo, undo, redo, saveSnapshot } = useGraphHistory(setNodes, setEdges);
  
  // Save snapshot whenever nodes or edges change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveSnapshot(nodes, edges);
    }, 500);
    return () => clearTimeout(timeout);
  }, [nodes, edges, saveSnapshot]);
  
  // Count testing nodes
  useEffect(() => {
    const testingCount = nodes.filter(node => node.data?.isTesting || node.type === 'promptInject').length;
    setTestingNodeCount(testingCount);
  }, [nodes]);
  
  // Keyboard shortcuts for new features
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // Ctrl/Cmd + F for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchPanelOpen(true);
      }
      // Ctrl/Cmd + I for stats
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setIsStatsPanelOpen(true);
      }
      // Ctrl/Cmd + H for history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setIsHistoryPanelOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [undo, redo]);

  // Load graph from API on mount
  useEffect(() => {
    let cancelled = false;

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
        if (!cancelled) {
          setNodes(apiNodes);
          setEdges(apiEdges);
        }
        
        // Fit view after a short delay to ensure nodes are rendered
        setTimeout(() => {
          fitView({ padding: 0.2 });
        }, 100);
        
      } catch (error) {
        console.error('Failed to load graph from API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (!cancelled) {
          setGraphLoadError(errorMessage);
        }
        addLog({ 
          level: 'error', 
          message: `Failed to connect to API: ${errorMessage}. Using mock data.`,
          source: 'API'
        });
        // Keep using fallback mock data
      } finally {
        await new Promise((resolve) => setTimeout(resolve, 5500));
        if (!cancelled) {
          setIsLoadingGraph(false);
        }
      }
    };

    loadGraphFromApi();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  
  // Load graph from JSON
  const handleLoadGraph = useCallback((loadedNodes: any[], loadedEdges: any[]) => {
    setNodes(loadedNodes);
    setEdges(loadedEdges);
    addLog({ level: 'success', message: 'Graph loaded successfully', source: 'System' });
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [setNodes, setEdges, addLog, fitView]);
  
  // Focus on a specific node (from search)
  const handleNodeFocus = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      fitView({ 
        nodes: [node],
        duration: 800,
        padding: 0.3 
      });
      // Highlight the node temporarily
      setNodes(nds => nds.map(n => 
        n.id === nodeId 
          ? { ...n, style: { ...n.style, boxShadow: '0 0 30px rgba(139, 92, 246, 0.8)' } }
          : n
      ));
      setTimeout(() => {
        setNodes(nds => nds.map(n => 
          n.id === nodeId 
            ? { ...n, style: { ...n.style, boxShadow: undefined } }
            : n
        ));
      }, 2000);
    }
  }, [nodes, fitView, setNodes]);
  
  // Clone selected node
  const handleCloneNode = useCallback(() => {
    if (selectedNode) {
      const { cloneNode } = require('@/lib/utils/autoLayout');
      const clonedNode = cloneNode(selectedNode);
      setNodes(nds => [...nds, clonedNode]);
      addLog({ 
        level: 'success', 
        message: `Cloned node: ${selectedNode.data?.label || selectedNode.id}`, 
        source: 'System' 
      });
    }
  }, [selectedNode, setNodes, addLog]);

  const isContentReady = !isLoadingGraph && !graphLoadError;

  return (
    <div className="relative flex-1 min-h-0 w-full">
      {/* Loading overlay */}
      {isLoadingGraph && (
        <div className="absolute inset-0 z-50 bg-gradient-to-b from-zinc-950/90 via-zinc-900/90 to-zinc-950/90 backdrop-blur-md flex items-center justify-center">
          <div className="relative w-full max-w-2xl mx-auto px-10 py-12 rounded-3xl border border-white/10 shadow-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 overflow-hidden">
            <div className="absolute inset-0 opacity-60">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.1),_transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.15),_transparent_60%)]" />
            </div>

            <div className="relative space-y-8 text-center animate-fade-in">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/20 bg-white/5 text-violet-100 text-sm uppercase tracking-[0.3em]">
                Loading Agent Graph
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
                  <div className="absolute inset-1 rounded-full border border-white/10 animate-ping" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold text-white">Preparing the Test Editor</h2>
                  <p className="text-zinc-400">
                    Fetching LangGraph nodes, stitching execution edges, and wiring up test instrumentation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-left">
                {[
                  { title: 'Live Graph', detail: 'Syncing with backend blueprint' },
                  { title: 'Testing Nodes', detail: 'Injecting security probes' },
                  { title: 'Execution Stream', detail: 'Priming real-time runner' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <p className="text-xs uppercase tracking-widest text-violet-300">{item.title}</p>
                    <p className="text-sm text-zinc-200 mt-2">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-violet-500 via-purple-400 to-pink-400 animate-[shimmer_2.2s_linear_infinite]" />
                </div>
                <p className="text-xs text-zinc-500 tracking-[0.4em] uppercase">
                  Securing agent · Orchestrating canvas · Wiring instrumentation
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* React Flow Canvas */}
      <motion.div
        key={isContentReady ? 'graph-ready' : 'graph-loading'}
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: isContentReady ? 1 : 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="h-full w-full"
      >
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
      </motion.div>

      {/* Graph Controls (Add, Delete, Clone, Hints) */}
      <GraphControls
        selectedNode={selectedNode}
        draggedNode={draggedNode}
        hoveredEdge={hoveredEdge}
        edges={edges}
        onAddNodeClick={() => setIsDirectoryOpen(true)}
        onDeleteNode={handleDeleteNode}
        onCloneNode={handleCloneNode}
      />

      {/* Top Bar with new action buttons */}
      <TopBar 
        onRun={() => {
          console.log('[Page] TopBar onRun triggered');
          console.log('[Page] Current isExecuting state:', isExecuting);
          console.log('[Page] Number of nodes:', nodes.length);
          console.log('[Page] Number of edges:', edges.length);
          console.log('[Page] Current graph ID:', currentGraphId);
          setExecutionCount(prev => prev + 1);
          handleRun(selectedNode, nodes, edges, currentGraphId, (executionId) => {
            console.log('[Test Page] Execution completed with ID:', executionId);
            setLastExecutionId(executionId);
            setIsAnalysisPanelOpen(true);
            
            // Save execution to history
            const history = JSON.parse(localStorage.getItem('execution_history') || '[]');
            history.unshift({
              id: executionId,
              timestamp: new Date().toISOString(),
              nodeCount: nodes.length,
              status: 'completed',
            });
            // Keep only last 20 executions
            localStorage.setItem('execution_history', JSON.stringify(history.slice(0, 20)));
          });
        }} 
        isExecuting={isExecuting}
        onViewAnalysis={() => setIsAnalysisPanelOpen(true)}
        hasExecutionCompleted={!!lastExecutionId}
      />
      
      {/* Floating action buttons */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-4 right-4 z-10"
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-2.5 flex flex-col gap-1.5">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
            onClick={() => setIsStatsPanelOpen(true)}
            title="Graph Statistics (Cmd/Ctrl + I)"
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center hover:scale-110 active:scale-95"
          >
            <BarChart3 className="w-5 h-5" />
          </motion.button>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.45, type: 'spring', stiffness: 300 }}
            onClick={() => setIsSearchPanelOpen(true)}
            title="Search Nodes (Cmd/Ctrl + F)"
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center hover:scale-110 active:scale-95"
          >
            <Search className="w-5 h-5" />
          </motion.button>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            onClick={() => setIsHistoryPanelOpen(true)}
            title="Execution History (Cmd/Ctrl + H)"
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center hover:scale-110 active:scale-95"
          >
            <Clock className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
      
      {/* Graph Actions Panel (Save/Load/Export/Undo/Redo/Auto-Layout) */}
      <GraphActionsPanel
        nodes={nodes}
        edges={edges}
        onLoadGraph={handleLoadGraph}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        currentGraphId={currentGraphId}
        onAutoLayout={(layoutedNodes, layoutedEdges) => {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          addLog({ level: 'success', message: 'Auto-layout applied', source: 'System' });
        }}
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

      {/* Analysis Panel */}
      <AnalysisPanel
        isOpen={isAnalysisPanelOpen}
        onClose={() => setIsAnalysisPanelOpen(false)}
        graphId={currentGraphId}
        executionId={lastExecutionId}
        onAnalysisGenerated={(analysis) => {
          console.log('[Test Page] Analysis generated:', analysis);
          addLog({
            level: 'success',
            message: `AI Analysis complete: Risk Score ${analysis.risk_score}/100`,
            source: 'Analysis'
          });
          
          // Update execution history with risk score
          const history = JSON.parse(localStorage.getItem('execution_history') || '[]');
          const updatedHistory = history.map((exec: any) => 
            exec.id === lastExecutionId 
              ? { ...exec, riskScore: analysis.risk_score }
              : exec
          );
          localStorage.setItem('execution_history', JSON.stringify(updatedHistory));
        }}
      />
      
      {/* Graph Stats Panel */}
      <GraphStatsPanel
        isOpen={isStatsPanelOpen}
        onClose={() => setIsStatsPanelOpen(false)}
        nodes={nodes}
        edges={edges}
        executionCount={executionCount}
        testingNodeCount={testingNodeCount}
      />
      
      {/* Node Search Panel */}
      <NodeSearchPanel
        isOpen={isSearchPanelOpen}
        onClose={() => setIsSearchPanelOpen(false)}
        nodes={nodes}
        onNodeSelect={handleNodeFocus}
      />
      
      {/* Execution History Panel */}
      <ExecutionHistoryPanel
        isOpen={isHistoryPanelOpen}
        onClose={() => setIsHistoryPanelOpen(false)}
        onSelectExecution={(executionId) => {
          setLastExecutionId(executionId);
          setIsAnalysisPanelOpen(true);
        }}
      />
    </div>
  );
}

export default function TestPage() {
  const [selectedAgentFile, setSelectedAgentFile] = useState<File | null>(null);
  const [agentReady, setAgentReady] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedAgentFile(file);
    }
  };

  const handleSimulateUpload = () => {
    if (!selectedAgentFile) return;
    // In a future version this is where we'd parse the uploaded agent
    // For the demo we just mark it as ready so the graph can be displayed
    setAgentReady(true);
  };

  if (!agentReady) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-[80vh] p-8 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-8 space-y-6 animate-slide-up">
          <div className="space-y-2 text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-zinc-400">Step 1</p>
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Upload an Agent</h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Start by dropping in your LangGraph agent file. Once it’s staged, the visual editor unlocks automatically.
            </p>
          </div>

          <label
            htmlFor="agent-upload"
            className="block cursor-pointer rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center transition hover:border-violet-500 dark:hover:border-violet-400 bg-zinc-50 dark:bg-zinc-900/50"
          >
            <input
              id="agent-upload"
              type="file"
              accept=".py,.ts,.js,.json"
              className="sr-only"
              onChange={handleFileChange}
            />
            <div className="space-y-3">
              <p className="text-lg font-medium text-zinc-800 dark:text-zinc-100">
                Drag & drop your agent file
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Supports LangGraph Python modules, JSON manifests, or mock files for the demo.
              </p>
              {selectedAgentFile ? (
                <div className="rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-200 px-4 py-2 inline-flex items-center gap-2 text-sm justify-center">
                  <span className="font-medium">{selectedAgentFile.name}</span>
                  <span className="text-xs uppercase tracking-wide">ready</span>
                </div>
              ) : (
                <div className="rounded-full bg-zinc-200 dark:bg-zinc-800 inline-flex px-4 py-1 text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                  Click to browse
                </div>
              )}
            </div>
          </label>

          <button
            type="button"
            disabled={!selectedAgentFile}
            onClick={handleSimulateUpload}
            className={`w-full rounded-xl px-6 py-3 text-base font-semibold transition ${
              selectedAgentFile
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700'
                : 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {selectedAgentFile ? 'Unlock Graph Editor' : 'Select an agent file first'}
          </button>

          <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
            Prefer a quick start? Use any file — this demo skips validation and jumps straight to the editor.
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="graph-stage"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex-1 flex flex-col min-h-0 w-full"
    >
      <ReactFlowProvider>
        <motion.div
          key="graph-wrapper"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 min-h-0 flex flex-col"
        >
          <GraphEditor />
        </motion.div>
      </ReactFlowProvider>
    </motion.div>
  );
}

