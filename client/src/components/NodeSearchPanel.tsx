"use client";

import { Node } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

interface NodeSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  onNodeSelect: (nodeId: string) => void;
}

export default function NodeSearchPanel({
  isOpen,
  onClose,
  nodes,
  onNodeSelect,
}: NodeSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Get unique node types
  const nodeTypes = useMemo(() => {
    const types = new Set(nodes.map(node => node.type || 'default'));
    return ['all', ...Array.from(types)];
  }, [nodes]);

  // Filter nodes based on search query and type
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const matchesSearch = !searchQuery || 
        node.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.data?.label || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === 'all' || node.type === selectedType || (!node.type && selectedType === 'default');

      return matchesSearch && matchesType;
    });
  }, [nodes, searchQuery, selectedType]);

  const handleNodeClick = (nodeId: string) => {
    onNodeSelect(nodeId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-zinc-900 shadow-2xl z-50 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Search Nodes
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by node ID or label..."
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Type Filter */}
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {nodeTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      selectedType === type
                        ? 'bg-white text-violet-600'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {type === 'all' ? 'All Types' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-4">
              {filteredNodes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500 dark:text-zinc-400">No nodes found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNodes.map((node, index) => (
                    <motion.button
                      key={node.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleNodeClick(node.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {node.data?.icon || '🔵'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {node.data?.label || node.id}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                          {node.id} • {node.type || 'default'}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-zinc-400 group-hover:text-violet-500 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                Found {filteredNodes.length} of {nodes.length} nodes
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

