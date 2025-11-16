import { useCallback, useRef, useState } from 'react';
import { Node, Edge } from 'reactflow';

interface GraphSnapshot {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

interface UseGraphHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  saveSnapshot: (nodes: Node[], edges: Edge[]) => void;
  clearHistory: () => void;
  historyLength: number;
}

export function useGraphHistory(
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void,
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void,
  maxHistorySize: number = 50
): UseGraphHistoryReturn {
  const [history, setHistory] = useState<GraphSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isApplyingHistory = useRef(false);

  const saveSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
    // Don't save if we're currently applying history
    if (isApplyingHistory.current) {
      return;
    }

    setHistory((prevHistory) => {
      // Remove any future history if we're not at the end
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      
      // Add new snapshot
      const snapshot: GraphSnapshot = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        timestamp: Date.now(),
      };
      
      newHistory.push(snapshot);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        setCurrentIndex((prev) => prev - 1);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
      
      return newHistory;
    });
  }, [currentIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isApplyingHistory.current = true;
      const snapshot = history[currentIndex - 1];
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setCurrentIndex((prev) => prev - 1);
      setTimeout(() => {
        isApplyingHistory.current = false;
      }, 100);
    }
  }, [currentIndex, history, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isApplyingHistory.current = true;
      const snapshot = history[currentIndex + 1];
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => {
        isApplyingHistory.current = false;
      }, 100);
    }
  }, [currentIndex, history, setNodes, setEdges]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    undo,
    redo,
    saveSnapshot,
    clearHistory,
    historyLength: history.length,
  };
}

