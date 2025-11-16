"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ExecutionRecord {
  id: string;
  timestamp: string;
  duration?: number;
  nodeCount: number;
  status: 'completed' | 'failed' | 'running';
  riskScore?: number;
}

interface ExecutionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExecution: (executionId: string) => void;
}

export default function ExecutionHistoryPanel({
  isOpen,
  onClose,
  onSelectExecution,
}: ExecutionHistoryPanelProps) {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load execution history from localStorage
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      try {
        const stored = localStorage.getItem('execution_history');
        if (stored) {
          const history = JSON.parse(stored);
          setExecutions(history);
        }
      } catch (error) {
        console.error('Failed to load execution history:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isOpen]);

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all execution history?')) {
      localStorage.removeItem('execution_history');
      setExecutions([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'running':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700';
    }
  };

  const getRiskScoreColor = (score?: number) => {
    if (!score) return 'text-zinc-500';
    if (score < 30) return 'text-green-600 dark:text-green-400';
    if (score < 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
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
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-96 bg-white dark:bg-zinc-900 shadow-2xl z-50 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Execution History
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    View past test runs
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

              {executions.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="w-full px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                >
                  Clear History
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    No execution history yet
                  </p>
                  <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-2">
                    Run a test to see results here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {executions.map((execution, index) => (
                    <motion.button
                      key={execution.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        onSelectExecution(execution.id);
                        onClose();
                      }}
                      className="w-full text-left p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 transition-all group"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400 truncate">
                            {execution.id.slice(0, 12)}...
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                            {new Date(execution.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(execution.status)}`}>
                          {execution.status}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-white dark:bg-zinc-900 rounded-lg p-2 border border-zinc-200 dark:border-zinc-700">
                          <p className="text-zinc-500 dark:text-zinc-400">Nodes</p>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">
                            {execution.nodeCount}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-lg p-2 border border-zinc-200 dark:border-zinc-700">
                          <p className="text-zinc-500 dark:text-zinc-400">Duration</p>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">
                            {execution.duration ? `${execution.duration}s` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-lg p-2 border border-zinc-200 dark:border-zinc-700">
                          <p className="text-zinc-500 dark:text-zinc-400">Risk</p>
                          <p className={`font-bold ${getRiskScoreColor(execution.riskScore)}`}>
                            {execution.riskScore !== undefined ? execution.riskScore : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Arrow indicator */}
                      <div className="mt-3 flex justify-end">
                        <svg
                          className="w-4 h-4 text-zinc-400 group-hover:text-violet-500 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

