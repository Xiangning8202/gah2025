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
      id: 'extract-data',
      title: 'Extract Data',
      description: 'Extract key piece...',
      icon: '📤',
      color: 'bg-pink-50'
    },
    {
      id: 'output',
      title: 'Output',
      description: 'Exit point for...',
      icon: '⬆️',
      color: 'bg-gray-50'
    },
    {
      id: 'categorizer',
      title: 'Categorizer',
      description: 'Categorize data...',
      icon: '🎯',
      color: 'bg-pink-50'
    },
    {
      id: 'router',
      title: 'Router',
      description: 'Control workflow...',
      icon: '🔀',
      color: 'bg-gray-50'
    }
  ];

  const integrations = [
    {
      id: 'airtable',
      title: 'Airtable',
      description: 'Manage data in Airtable bases',
      icon: '🔷',
      badge: 'MCP',
      badgeColor: 'bg-blue-200 text-blue-700'
    },
    {
      id: 'gmail',
      title: 'Gmail',
      description: 'Read and send Gmail messages',
      icon: '📧',
      badge: 'MCP',
      badgeColor: 'bg-red-200 text-red-700'
    },
    {
      id: 'google-sheets',
      title: 'Google Sheets',
      description: 'Read and write Google Sheets data',
      icon: '📊',
      badge: 'MCP',
      badgeColor: 'bg-green-200 text-green-700'
    },
    {
      id: 'google-drive',
      title: 'Google Drive',
      description: 'Manage files in Google Drive',
      icon: '📁',
      badge: 'MCP',
      badgeColor: 'bg-blue-200 text-blue-700'
    },
    {
      id: 'google-calendar',
      title: 'Google Calendar',
      description: 'Manage Google Calendar events',
      icon: '📅',
      badge: 'MCP',
      badgeColor: 'bg-blue-200 text-blue-700'
    },
    {
      id: 'google-docs',
      title: 'Google Docs',
      description: 'Create and edit Google Docs',
      icon: '📄',
      badge: 'MCP',
      badgeColor: 'bg-blue-200 text-blue-700'
    },
    {
      id: 'google-ads',
      title: 'Google Ads',
      description: 'Manage Google Ads',
      icon: '📣',
      badge: 'MCP',
      badgeColor: 'bg-yellow-200 text-yellow-700'
    }
  ];

  const allNodes = [...coreNodes, ...integrations];

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Nodes</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <span className="text-xl text-gray-600">×</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
          />
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
              {'badge' in node && (
                <span className={`${node.badgeColor} px-2 py-0.5 rounded text-xs font-medium flex-shrink-0`}>
                  {node.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
