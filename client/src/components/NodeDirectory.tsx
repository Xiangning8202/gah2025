"use client";

import { useState } from 'react';

interface NodeDirectoryProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeAdd: (nodeData: { id: string; title: string; icon: string; type: string }) => void;
}

export default function NodeDirectory({ isOpen, onClose, onNodeAdd }: NodeDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const coreNodes = [
    {
      id: 'prompt-inject',
      title: 'Prompt Inject',
      description: 'Inject prompts into the workflow',
      icon: '💬',
      color: 'bg-gray-50'
    }
  ];

  const allNodes = coreNodes;

  const filteredNodes = searchQuery
    ? allNodes.filter(node =>
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allNodes;

  return (
    <div className="fixed left-8 top-40 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-40">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Nodes</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <span className="text-xl text-gray-600">×</span>
          </button>
        </div>
      </div>

      {/* Nodes List */}
      <div className="overflow-y-auto max-h-[calc(60vh-200px)] top-20">
        <div className="p-2">
          {filteredNodes.map((node) => (
            <button
              key={node.id}
              onClick={() => {
                onNodeAdd({
                  id: node.id,
                  title: node.title,
                  icon: node.icon,
                  type: 'badge' in node ? 'integration' : 'core'
                });
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left border border-transparent hover:border-gray-200 mb-1"
            >
              <div className="flex-shrink-0 text-2xl">
                {node.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {node.title}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {node.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
