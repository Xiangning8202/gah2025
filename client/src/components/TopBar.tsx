"use client";

import { Button } from './ui/button';
import { Play, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopBarProps {
  onRun: () => void;
  isExecuting?: boolean;
}

export default function TopBar({ onRun, isExecuting = false }: TopBarProps) {
  const handleRunClick = () => {
    console.log('[TopBar] Run button clicked');
    console.log('[TopBar] isExecuting:', isExecuting);
    onRun();
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="absolute top-5 right-5 z-50"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg px-4 py-2 flex items-center gap-3 border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        <Button
          onClick={handleRunClick}
          disabled={isExecuting}
          size="sm"
          className={`
            rounded-lg px-6 py-2 font-medium transition-all
            ${isExecuting 
              ? 'bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
            }
          `}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2 fill-current" />
              <span>Execute</span>
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
