"use client";

import type { Node, Edge } from 'reactflow';
import { Button } from './ui/button';
import { Plus, Trash2, Info, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GraphControlsProps {
  selectedNode: Node | null;
  draggedNode: Node | null;
  hoveredEdge: string | null;
  edges: Edge[];
  onAddNodeClick: () => void;
  onDeleteNode: () => void;
  onCloneNode?: () => void;
}

/**
 * Floating controls for the graph editor with n8n-inspired design
 */
export default function GraphControls({
  selectedNode,
  draggedNode,
  hoveredEdge,
  edges,
  onAddNodeClick,
  onDeleteNode,
  onCloneNode,
}: GraphControlsProps) {
  const isNodeConnected = draggedNode 
    ? edges.some(e => e.target === draggedNode.id) && edges.some(e => e.source === draggedNode.id)
    : false;

  return (
    <>
      {/* Floating Add Node Button */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="fixed top-24 left-8 z-[1000]"
      >
        <Button
          onClick={onAddNodeClick}
          size="icon"
          className="w-14 h-14 rounded-full shadow-xl bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 transition-all hover:scale-110"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Node Actions Panel */}
      <AnimatePresence>
        {selectedNode && selectedNode.type === 'promptInject' && (
          <motion.div
            initial={{ x: 100, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-24 right-8 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-4 z-[1000]"
          >
            <p className="text-sm font-semibold mb-3 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Test Node Selected
            </p>
            <div className="space-y-2">
              {onCloneNode && (
                <Button
                  onClick={onCloneNode}
                  variant="outline"
                  className="w-full rounded-lg flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Clone Node</span>
                </Button>
              )}
              <Button
                onClick={onDeleteNode}
                variant="destructive"
                className="w-full rounded-lg flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Node</span>
              </Button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px]">Delete</kbd> to delete
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag and Drop Hint */}
      <AnimatePresence>
        {draggedNode && !isNodeConnected && (
          <motion.div
            initial={{ x: 100, opacity: 0, y: 20 }}
            animate={{ x: 0, opacity: 1, y: 0 }}
            exit={{ x: 100, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`
              fixed top-44 right-8 border-2 rounded-xl shadow-xl p-4 z-[1000] transition-all
              ${hoveredEdge 
                ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700' 
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
              }
            `}
          >
            <p className={`
              text-sm font-semibold flex items-center gap-2
              ${hoveredEdge 
                ? 'text-green-700 dark:text-green-400' 
                : 'text-blue-700 dark:text-blue-400'
              }
            `}>
              <span>{hoveredEdge ? '✓' : '💡'}</span>
              <span>{hoveredEdge ? 'Valid drop location!' : 'Drop on any edge to inject'}</span>
            </p>
            {!hoveredEdge && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Hover over a connection line
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
