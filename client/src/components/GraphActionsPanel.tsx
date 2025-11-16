"use client";

import { Node, Edge, useReactFlow } from 'reactflow';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toPng } from 'html-to-image';
import { autoLayoutGraph } from '@/lib/utils/autoLayout';
import { Save, FolderOpen, Camera, Sparkles, Undo2, Redo2 } from 'lucide-react';

interface GraphActionsPanelProps {
  nodes: Node[];
  edges: Edge[];
  onLoadGraph: (nodes: Node[], edges: Edge[]) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  currentGraphId: string | null;
  onAutoLayout: (nodes: Node[], edges: Edge[]) => void;
}

export default function GraphActionsPanel({
  nodes,
  edges,
  onLoadGraph,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  currentGraphId,
  onAutoLayout,
}: GraphActionsPanelProps) {
  const { getNodes } = useReactFlow();
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLayouting, setIsLayouting] = useState(false);

  const saveGraph = () => {
    setIsSaving(true);
    const graphData = {
      nodes,
      edges,
      timestamp: new Date().toISOString(),
      graphId: currentGraphId,
    };

    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `graph-${currentGraphId || 'export'}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsSaving(false), 1000);
  };

  const loadGraph = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const graphData = JSON.parse(event.target?.result as string);
            onLoadGraph(graphData.nodes, graphData.edges);
          } catch (error) {
            console.error('Failed to load graph:', error);
            alert('Failed to load graph file. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const exportAsImage = async () => {
    setIsExporting(true);
    try {
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (viewport) {
        const dataUrl = await toPng(viewport, {
          backgroundColor: '#ffffff',
          width: viewport.offsetWidth,
          height: viewport.offsetHeight,
        });

        const link = document.createElement('a');
        link.download = `graph-${currentGraphId || 'export'}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('Failed to export image:', error);
      alert('Failed to export graph as image.');
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  const applyAutoLayout = () => {
    setIsLayouting(true);
    try {
      const { nodes: layoutedNodes, edges: layoutedEdges } = autoLayoutGraph(nodes, edges, {
        direction: 'TB',
        nodeWidth: 250,
        nodeHeight: 100,
        rankSep: 120,
        nodeSep: 100,
      });
      onAutoLayout(layoutedNodes, layoutedEdges);
    } catch (error) {
      console.error('Failed to apply auto-layout:', error);
      alert('Failed to apply auto-layout to graph.');
    } finally {
      setTimeout(() => setIsLayouting(false), 500);
    }
  };

  const actions = [
    {
      icon: Save,
      label: 'Save',
      onClick: saveGraph,
      disabled: isSaving,
      tooltip: 'Save graph as JSON',
      colorClass: 'hover:text-green-600 dark:hover:text-green-400',
    },
    {
      icon: FolderOpen,
      label: 'Load',
      onClick: loadGraph,
      disabled: false,
      tooltip: 'Load graph from JSON',
      colorClass: 'hover:text-blue-600 dark:hover:text-blue-400',
    },
    {
      icon: Camera,
      label: 'Export',
      onClick: exportAsImage,
      disabled: isExporting,
      tooltip: 'Export as PNG image',
      colorClass: 'hover:text-purple-600 dark:hover:text-purple-400',
    },
    {
      icon: Sparkles,
      label: 'Layout',
      onClick: applyAutoLayout,
      disabled: isLayouting,
      tooltip: 'Auto-arrange nodes',
      colorClass: 'hover:text-violet-600 dark:hover:text-violet-400',
    },
    {
      icon: Undo2,
      label: 'Undo',
      onClick: onUndo,
      disabled: !canUndo,
      tooltip: 'Undo last change (Cmd/Ctrl+Z)',
      colorClass: 'hover:text-orange-600 dark:hover:text-orange-400',
    },
    {
      icon: Redo2,
      label: 'Redo',
      onClick: onRedo,
      disabled: !canRedo,
      tooltip: 'Redo last change (Cmd/Ctrl+Shift+Z)',
      colorClass: 'hover:text-orange-600 dark:hover:text-orange-400',
    },
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="absolute bottom-4 left-4 z-10"
    >
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-2.5">
        <div className="flex items-center gap-1.5">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.05, type: 'spring', stiffness: 300 }}
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.tooltip}
                className={`
                  relative w-10 h-10 rounded-xl flex items-center justify-center
                  transition-all duration-200
                  text-zinc-600 dark:text-zinc-400
                  ${action.disabled
                    ? 'opacity-30 cursor-not-allowed'
                    : `hover:scale-110 active:scale-95 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${action.colorClass}`
                  }
                `}
              >
                <Icon className="w-5 h-5" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

