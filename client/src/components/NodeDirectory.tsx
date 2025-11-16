"use client";

import { useState, useEffect } from 'react';
import { graphApiClient, TestingNodeTemplate } from '@/lib/api/graphApi';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface NodeDirectoryProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeAdd: (nodeData: { id: string; title: string; icon: string; type: string; description: string; nodeType: string }) => void;
}

export default function NodeDirectory({ isOpen, onClose, onNodeAdd }: NodeDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [testingNodes, setTestingNodes] = useState<TestingNodeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && testingNodes.length === 0) {
      setIsLoading(true);
      setError(null);
      
      graphApiClient.getTestingNodeTemplates()
        .then(templates => {
          setTestingNodes(templates);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch testing nodes:', err);
          setError('Failed to load testing nodes');
          setIsLoading(false);
        });
    }
  }, [isOpen, testingNodes.length]);

  const allNodes = testingNodes.map(template => ({
    id: template.node_type,
    title: template.display_name,
    description: template.description,
    icon: template.icon,
    nodeType: template.node_type,
  }));

  const filteredNodes = searchQuery
    ? allNodes.filter(node =>
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allNodes;

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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-100"
          />

          {/* Modal */}
          <motion.div
            initial={{ x: -100, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-8 top-40 w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-101"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-linear-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Add Test Node
                </h2>
                <Button
                  onClick={onClose}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>
            </div>

            {/* Nodes List */}
            <div className="overflow-y-auto max-h-[60vh] p-3">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-sm">Loading testing nodes...</p>
                </div>
              )}
              
              {error && (
                <div className="text-center py-12 text-red-500 dark:text-red-400">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              {!isLoading && !error && filteredNodes.length === 0 && (
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                  <p className="text-sm">No nodes found</p>
                </div>
              )}
              
              {!isLoading && !error && filteredNodes.map((node, index) => (
                <motion.button
                  key={node.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onNodeAdd({
                      id: node.id,
                      title: node.title,
                      icon: node.icon,
                      type: 'testing',
                      description: node.description,
                      nodeType: node.nodeType
                    });
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-left border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 mb-2 group"
                >
                  <div className="shrink-0 text-2xl group-hover:scale-110 transition-transform">
                    {node.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-0.5">
                      {node.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {node.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
