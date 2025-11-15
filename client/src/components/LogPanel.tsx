"use client";

import { useState, useEffect } from 'react';

interface Log {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source?: string;
}

// Dummy log data
const generateDummyLogs = (): Log[] => {
  return [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5000),
      level: 'info',
      message: 'Supervisor node initialized successfully',
      source: 'supervisor'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 4500),
      level: 'info',
      message: 'Agent network connected: 4 agents online',
      source: 'system'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 4000),
      level: 'success',
      message: 'Excel agent executed task successfully',
      source: 'Excel'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 3500),
      level: 'info',
      message: 'Browser agent processing web request',
      source: 'Browser'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 3000),
      level: 'warning',
      message: 'High memory usage detected: 78%',
      source: 'system'
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 2500),
      level: 'success',
      message: 'PowerPoint agent completed presentation generation',
      source: 'PowerPoint'
    },
    {
      id: '7',
      timestamp: new Date(Date.now() - 2000),
      level: 'info',
      message: 'Research agent started data collection',
      source: 'Research'
    },
    {
      id: '8',
      timestamp: new Date(Date.now() - 1500),
      level: 'error',
      message: 'Failed to connect to external API endpoint',
      source: 'Browser'
    },
    {
      id: '9',
      timestamp: new Date(Date.now() - 1000),
      level: 'info',
      message: 'Supervisor routing task to Excel agent',
      source: 'supervisor'
    },
    {
      id: '10',
      timestamp: new Date(Date.now() - 500),
      level: 'success',
      message: 'All agents ready for new tasks',
      source: 'system'
    }
  ];
};

interface LogPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function LogPanel({ isOpen, onToggle }: LogPanelProps) {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    // Initialize with dummy logs
    setLogs(generateDummyLogs());

    // Simulate new logs coming in every 5 seconds
    const interval = setInterval(() => {
      const newLog: Log = {
        id: Date.now().toString(),
        timestamp: new Date(),
        level: ['info', 'warning', 'error', 'success'][Math.floor(Math.random() * 4)] as Log['level'],
        message: [
          'Processing new task...',
          'Agent communication established',
          'Task completed successfully',
          'Waiting for supervisor response',
          'Resource allocation updated',
          'Network latency detected'
        ][Math.floor(Math.random() * 6)],
        source: ['supervisor', 'Excel', 'PowerPoint', 'Browser', 'Research', 'system'][Math.floor(Math.random() * 6)]
      };

      setLogs((prevLogs) => [newLog, ...prevLogs].slice(0, 50)); // Keep last 50 logs
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getLevelColor = (level: Log['level']) => {
    switch (level) {
      case 'info':
        return 'bg-gray-50 text-gray-800 border-gray-300';
      case 'warning':
        return 'bg-gray-100 text-gray-900 border-gray-400';
      case 'error':
        return 'bg-gray-200 text-gray-900 border-gray-500';
      case 'success':
        return 'bg-gray-50 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelIcon = (level: Log['level']) => {
    switch (level) {
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      default:
        return '📋';
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
      {/* Toggle Button - Fixed on the right side */}
      <button
        onClick={onToggle}
        className="fixed top-1/2 right-0 -translate-y-1/2 bg-gray-800 hover:bg-gray-900 text-white px-3 py-8 rounded-l-lg shadow-lg transition-all z-[1000] flex items-center gap-2"
        style={{ right: isOpen ? '400px' : '0' }}
      >
        <span className="text-sm font-medium" style={{ writingMode: 'vertical-rl' }}>
          {isOpen ? '→ Logs' : '← Logs'}
        </span>
      </button>

      {/* Log Panel */}
      <div
        className={`fixed top-0 right-0 h-full bg-white border-l border-gray-300 shadow-2xl transition-transform duration-300 ease-in-out z-[999] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '400px' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <h2 className="text-lg font-semibold">System Logs</h2>
            </div>
            <button
              onClick={onToggle}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 p-3 border-b border-gray-200">
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-gray-600 font-medium">Filters:</span>
              <button className="text-xs px-2 py-1 rounded bg-gray-800 text-white hover:bg-gray-900">
                All
              </button>
              <button className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">
                Errors
              </button>
              <button className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">
                Warnings
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border ${getLevelColor(log.level)} transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getLevelIcon(log.level)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase">
                        {log.level}
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{log.message}</p>
                    {log.source && (
                      <span className="text-xs text-gray-600">
                        Source: <span className="font-mono">{log.source}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{logs.length} logs</span>
              <button className="font-medium text-gray-800 hover:text-gray-900 transition-colors">
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
