"use client";

import { useState, useCallback } from 'react';
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

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];



export default function Home() {
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeAdd = useCallback((nodeData: { id: string; title: string; icon: string; type: string }) => {
    const newNode: Node = {
      id: `${nodeData.id}-${Date.now()}`,
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
  }, [setNodes]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* React Flow Canvas - Full Viewport */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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
        className="fixed top-24 left-8 bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all font-medium flex items-center justify-center z-[1000]"
      >
        <span className="text-2xl">+</span>
      </button>

      {/* Top Bar */}
      <TopBar />

      {/* Node Directory Modal */}
      <NodeDirectory
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        onNodeAdd={handleNodeAdd}
      />
    </div>
  );
}
