"use client";

import { Node, Edge } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';

interface GraphStatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  executionCount: number;
  testingNodeCount: number;
}

export default function GraphStatsPanel({
  isOpen,
  onClose,
  nodes,
  edges,
  executionCount,
  testingNodeCount,
}: GraphStatsPanelProps) {
  const stats = [
    { label: 'Total Nodes', value: nodes.length, icon: '🔵' },
    { label: 'Testing Nodes', value: testingNodeCount, icon: '⚠️' },
    { label: 'Regular Nodes', value: nodes.length - testingNodeCount, icon: '⚙️' },
    { label: 'Edges', value: edges.length, icon: '🔗' },
    { label: 'Executions', value: executionCount, icon: '▶️' },
    { label: 'Avg Connections', value: edges.length > 0 ? (edges.length / nodes.length).toFixed(1) : '0', icon: '📊' },
  ];

  // Calculate node type distribution
  const nodeTypes = nodes.reduce((acc, node) => {
    const type = node.type || 'default';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-zinc-900 shadow-2xl z-50 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Graph Statistics
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Overview of your graph structure
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{stat.icon}</span>
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                        {stat.label}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {stat.value}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Node Types Distribution */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Node Types
                </h3>
                <div className="space-y-3">
                  {Object.entries(nodeTypes).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-violet-500" />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                          {type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / nodes.length) * 100}%` }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                          />
                        </div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-[2rem] text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graph Health */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Graph Health
                </h3>
                <div className="space-y-3">
                  <HealthIndicator
                    label="Node Coverage"
                    value={testingNodeCount > 0 ? 'Good' : 'No testing nodes'}
                    status={testingNodeCount > 0 ? 'success' : 'warning'}
                  />
                  <HealthIndicator
                    label="Connectivity"
                    value={edges.length >= nodes.length - 1 ? 'Connected' : 'Disconnected'}
                    status={edges.length >= nodes.length - 1 ? 'success' : 'error'}
                  />
                  <HealthIndicator
                    label="Complexity"
                    value={nodes.length < 20 ? 'Simple' : nodes.length < 50 ? 'Moderate' : 'Complex'}
                    status={nodes.length < 50 ? 'success' : 'warning'}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function HealthIndicator({ label, value, status }: { label: string; value: string; status: 'success' | 'warning' | 'error' }) {
  const colors = {
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${colors[status]}`}>
        {value}
      </span>
    </div>
  );
}

