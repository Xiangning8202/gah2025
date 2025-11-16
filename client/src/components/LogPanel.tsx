"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, AlertCircle, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

export interface Log {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source?: string;
}

interface LogPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  logs: Log[];
  onClearLogs: () => void;
}

export default function LogPanel({ isOpen, onToggle, logs, onClearLogs }: LogPanelProps) {
  const getLevelStyles = (level: Log['level']) => {
    switch (level) {
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      default:
        return 'bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800';
    }
  };

  const getLevelIcon = (level: Log['level']) => {
    switch (level) {
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        animate={{ right: isOpen ? '400px' : '0' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-1/2 -translate-y-1/2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white px-3 py-8 rounded-l-xl shadow-xl transition-colors z-[1000] flex items-center gap-2"
      >
        <span className="text-sm font-medium" style={{ writingMode: 'vertical-rl' }}>
          {isOpen ? '→ Logs' : '← Logs'}
        </span>
      </motion.button>

      {/* Log Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-[999]"
            style={{ width: '400px' }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Execution Logs</h2>
                </div>
                <Button
                  onClick={onToggle}
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Logs List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600">
                    <FileText className="w-12 h-12 mb-2" />
                    <p className="text-sm">No logs yet</p>
                    <p className="text-xs mt-1">Execute the graph to see logs</p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-lg border ${getLevelStyles(log.level)} transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5">{getLevelIcon(log.level)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase">
                              {log.level}
                            </span>
                            <span className="text-xs opacity-70">
                              {formatTime(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-1">{log.message}</p>
                          {log.source && (
                            <span className="text-xs opacity-70">
                              <span className="font-mono">{log.source}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {logs.length} {logs.length === 1 ? 'log' : 'logs'}
                  </span>
                  <Button 
                    onClick={onClearLogs}
                    size="sm"
                    variant="ghost"
                    className="text-zinc-700 dark:text-zinc-300"
                    disabled={logs.length === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
