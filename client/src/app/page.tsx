"use client";

import { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  BackgroundVariant,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import NodeDirectory from '@/components/NodeDirectory';
import TopBar from '@/components/TopBar';
import LogPanel from '@/components/LogPanel';
import PromptInjectNode from '@/components/PromptInjectNode';

// LangGraph Structure - Supervisor Pattern
const initialNodes: Node[] = [
  // Start Node
  {
    id: '__start__',
    type: 'input',
    position: { x: 400, y: 50 },
    data: {
      label: (
        <div className="flex items-center gap-2">
          <span>▶️</span>
          <span className="font-semibold">Start</span>
        </div>
      )
    },
    style: {
      background: '#f9fafb',
      border: '2px solid #1f2937',
      borderRadius: '8px',
      padding: '10px'
    }
  },
  // Supervisor Node (Central Router)
  {
    id: 'supervisor',
    type: 'default',
    position: { x: 350, y: 200 },
    data: {
      label: (
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">👨‍💼</span>
          <span className="font-bold">Supervisor</span>
          <span className="text-xs text-gray-500">Routes tasks</span>
        </div>
      )
    },
    style: {
      background: '#ffffff',
      border: '3px solid #1f2937',
      borderRadius: '12px',
      padding: '15px',
      minWidth: '150px'
    }
  },
  // Agent Nodes
  {
    id: 'Excel',
    type: 'default',
    position: { x: 100, y: 400 },
    data: {
      label: (
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">📊</span>
          <span className="font-semibold">Excel</span>
        </div>
      )
    },
    style: {
      background: '#f9fafb',
      border: '2px solid #4b5563',
      borderRadius: '8px',
      padding: '12px'
    }
  },
  {
    id: 'PowerPoint',
    type: 'default',
    position: { x: 300, y: 400 },
    data: {
      label: (
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">📽️</span>
          <span className="font-semibold">PowerPoint</span>
        </div>
      )
    },
    style: {
      background: '#f9fafb',
      border: '2px solid #4b5563',
      borderRadius: '8px',
      padding: '12px'
    }
  },
  {
    id: 'Browser',
    type: 'default',
    position: { x: 500, y: 400 },
    data: {
      label: (
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">🌐</span>
          <span className="font-semibold">Browser</span>
        </div>
      )
    },
    style: {
      background: '#f9fafb',
      border: '2px solid #4b5563',
      borderRadius: '8px',
      padding: '12px'
    }
  },
  {
    id: 'Research',
    type: 'default',
    position: { x: 700, y: 400 },
    data: {
      label: (
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">🔬</span>
          <span className="font-semibold">Research</span>
        </div>
      )
    },
    style: {
      background: '#f9fafb',
      border: '2px solid #4b5563',
      borderRadius: '8px',
      padding: '12px'
    }
  },
  // End Node
  {
    id: '__end__',
    type: 'output',
    position: { x: 400, y: 600 },
    data: {
      label: (
        <div className="flex items-center gap-2">
          <span>⏹️</span>
          <span className="font-semibold">End</span>
        </div>
      )
    },
    style: {
      background: '#f9fafb',
      border: '2px solid #1f2937',
      borderRadius: '8px',
      padding: '10px'
    }
  }
];

const initialEdges: Edge[] = [
  // Start to Supervisor (non-conditional)
  {
    id: 'e-start-supervisor',
    source: '__start__',
    target: 'supervisor',
    animated: false,
    style: { stroke: '#1f2937', strokeWidth: 2 }
  },
  // Supervisor to Agents (conditional - dashed lines)
  {
    id: 'e-supervisor-excel',
    source: 'supervisor',
    target: 'Excel',
    animated: true,
    style: { stroke: '#1f2937', strokeWidth: 2, strokeDasharray: '5,5' },
    label: 'route'
  },
  {
    id: 'e-supervisor-powerpoint',
    source: 'supervisor',
    target: 'PowerPoint',
    animated: true,
    style: { stroke: '#1f2937', strokeWidth: 2, strokeDasharray: '5,5' },
    label: 'route'
  },
  {
    id: 'e-supervisor-browser',
    source: 'supervisor',
    target: 'Browser',
    animated: true,
    style: { stroke: '#1f2937', strokeWidth: 2, strokeDasharray: '5,5' },
    label: 'route'
  },
  {
    id: 'e-supervisor-research',
    source: 'supervisor',
    target: 'Research',
    animated: true,
    style: { stroke: '#1f2937', strokeWidth: 2, strokeDasharray: '5,5' },
    label: 'route'
  },
  {
    id: 'e-supervisor-end',
    source: 'supervisor',
    target: '__end__',
    animated: true,
    style: { stroke: '#1f2937', strokeWidth: 2, strokeDasharray: '5,5' },
    label: 'finish'
  },
  // Agents back to Supervisor (non-conditional - solid lines)
  {
    id: 'e-excel-supervisor',
    source: 'Excel',
    target: 'supervisor',
    animated: false,
    style: { stroke: '#6b7280', strokeWidth: 2 },
    label: 'return'
  },
  {
    id: 'e-powerpoint-supervisor',
    source: 'PowerPoint',
    target: 'supervisor',
    animated: false,
    style: { stroke: '#6b7280', strokeWidth: 2 },
    label: 'return'
  },
  {
    id: 'e-browser-supervisor',
    source: 'Browser',
    target: 'supervisor',
    animated: false,
    style: { stroke: '#6b7280', strokeWidth: 2 },
    label: 'return'
  },
  {
    id: 'e-research-supervisor',
    source: 'Research',
    target: 'supervisor',
    animated: false,
    style: { stroke: '#6b7280', strokeWidth: 2 },
    label: 'return'
  }
];



export default function Home() {
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [promptData, setPromptData] = useState<Record<string, string>>({});
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeCounter, setNodeCounter] = useState<Record<string, number>>({});

  // Define custom node types
  const nodeTypes = useMemo(() => ({
    promptInject: PromptInjectNode,
  }), []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handler for node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    // console.log('Selected node:', node);

    // Log prompt inject node data specifically
    if (node.type === 'promptInject') {
      const storedPrompt = promptData[node.id] || '';
    //   console.log('Prompt Inject Node Data:', {
    //     nodeId: node.id,
    //     prompt: node.data.prompt,
    //     storedPrompt: storedPrompt,
    //     title: node.data.title,
    //     icon: node.data.icon
    //   });
    //   console.log('Stored prompt input for this node:', storedPrompt);
    }
  }, [promptData]);

  // Handler for updating prompt data
  const handlePromptChange = useCallback((nodeId: string, prompt: string) => {
    setPromptData((prev) => {
      const updated = { ...prev, [nodeId]: prompt };
      // console.log('Prompt data updated:', { nodeId, prompt });
      // console.log('All prompt data:', updated);
      return updated;
    });
  }, []);

  // Handler for run button
  const handleRun = useCallback(async () => {
    console.log('=== RUN BUTTON CLICKED ===');
    console.log('Selected Node:', selectedNode);
    console.log('All Prompt Data:', promptData);

    if (selectedNode) {
      const storedPrompt = promptData[selectedNode.id] || '';
      console.log('Selected Prompt Inject Node Data:', {
        nodeId: selectedNode.id,
        title: selectedNode.data.title,
        storedPrompt: storedPrompt
      });

      try {
        // Make POST request to the API
        const response = await fetch('http://localhost:8000/graph', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            node_name: selectedNode.data.title || selectedNode.id,
            input_data: promptData,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('API Response:', result);
      } catch (error) {
        console.error('Error calling API:', error);
      }
    }
  }, [selectedNode, promptData]);

  const handleNodeAdd = useCallback((nodeData: { id: string; title: string; icon: string; type: string }) => {
    // Get current counter for this node type, default to 1 if not exists
    const currentCount = nodeCounter[nodeData.id] || 1;
    const nodeId = `${nodeData.id}-${currentCount}`;

    // Update counter for next node of this type
    setNodeCounter(prev => ({
      ...prev,
      [nodeData.id]: currentCount + 1
    }));

    // Use custom node type for prompt-inject
    if (nodeData.id === 'prompt-inject') {
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
          prompt: '',
          onPromptChange: handlePromptChange,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    } else {
      // Default node for other types
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
  }, [setNodes, handlePromptChange, nodeCounter]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* React Flow Canvas - Full Viewport */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        attributionPosition="bottom-right"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#d1d5db"
        />
        <Controls
          className="!bg-white !border !border-gray-200 !shadow-lg [&>button]:!bg-white [&>button]:!border-gray-200 [&>button:hover]:!bg-gray-100"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Floating Add Node Button */}
      <button
        onClick={() => setIsDirectoryOpen(true)}
        className="fixed top-24 left-8 text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all font-medium flex items-center justify-center z-[1000]"
        style={{ background: '#1f2937' }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#111827'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#1f2937'}
      >
        <span className="text-2xl">+</span>
      </button>

      {/* Top Bar */}
      <TopBar onRun={handleRun} />

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
      />
    </div>
  );
}
