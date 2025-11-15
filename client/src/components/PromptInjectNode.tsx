"use client";

import { Handle, Position, type NodeProps } from 'reactflow';
import { useState, useCallback } from 'react';

interface PromptInjectNodeData {
  icon: string;
  title: string;
  prompt?: string;
  onPromptChange?: (nodeId: string, prompt: string) => void;
}

export default function PromptInjectNode({ id, data }: NodeProps<PromptInjectNodeData>) {
  const [prompt, setPrompt] = useState(data.prompt || '');

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    if (data.onPromptChange) {
      data.onPromptChange(id, newPrompt);
    }
  }, [id, data]);

  const handleTextareaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="bg-white border-2 border-gray-800 rounded-lg shadow-lg p-4 min-w-[300px]">
      {/* Input handle at top */}
      <Handle type="target" position={Position.Top} className="!bg-gray-800" />

      {/* Node Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{data.icon}</span>
        <span className="font-semibold text-gray-800">{data.title}</span>
      </div>

      {/* Prompt Input */}
      <textarea
        value={prompt}
        onChange={handlePromptChange}
        placeholder="Enter your prompt here..."
        className="w-full min-h-[100px] p-2 text-sm border border-gray-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Output handle at bottom */}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-800" />
    </div>
  );
}
