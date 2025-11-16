"use client";

import { Handle, Position, type NodeProps } from 'reactflow';
import { AlertTriangle } from 'lucide-react';

interface PromptInjectNodeData {
  icon: string;
  title: string;
  nodeType?: string;
  config?: Record<string, any>;
}

export default function PromptInjectNode({ id, data }: NodeProps<PromptInjectNodeData>) {
  return (
    <div className="group relative">
      {/* Input handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white dark:!border-zinc-900 transition-all hover:!scale-150" 
      />

      {/* Node Content */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 border-2 border-red-400 dark:border-red-600 rounded-xl shadow-lg hover:shadow-xl transition-all p-4 min-w-[220px] backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
            <span className="text-2xl">{data.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                Test Node
              </span>
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm truncate">
              {data.title}
            </h3>
          </div>
        </div>
        
        {data.nodeType && (
          <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800/50">
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
              {data.nodeType}
            </span>
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white dark:!border-zinc-900 transition-all hover:!scale-150" 
      />
    </div>
  );
}
