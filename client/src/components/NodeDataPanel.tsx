import { useEffect, useState } from 'react';

interface NodeData {
  graph_id: string;
  node_id: string;
  node_name: string;
  current_state: Record<string, any>;
  input?: Record<string, any>;
  output?: Record<string, any>;
  execution_count: number;
  last_executed?: string;
}

interface NodeDataPanelProps {
  isOpen: boolean;
  nodeId: string | null;
  nodeName: string | null;
  graphId: string | null;
  onClose: () => void;
  onFetchData: (graphId: string, nodeId: string) => Promise<NodeData>;
}

export default function NodeDataPanel({
  isOpen,
  nodeId,
  nodeName,
  graphId,
  onClose,
  onFetchData,
}: NodeDataPanelProps) {
  const [nodeData, setNodeData] = useState<NodeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && nodeId && graphId) {
      setIsLoading(true);
      setError(null);
      
      onFetchData(graphId, nodeId)
        .then((data) => {
          setNodeData(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch node data:', err);
          setError(err.message || 'Failed to fetch node data');
          setNodeData(null);
          setIsLoading(false);
        });
    }
  }, [isOpen, nodeId, graphId, onFetchData]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-[1001] overflow-hidden flex flex-col border-l-4 border-blue-600">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Node Data</h2>
            <p className="text-sm text-blue-100 mt-1">{nodeName || nodeId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading node data...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-600 mr-2 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && nodeData && (
            <div className="space-y-4">
              {/* Execution Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Execution Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Execution Count:</span>
                    <span className="font-medium text-gray-900">
                      {nodeData.execution_count}
                    </span>
                  </div>
                  {nodeData.last_executed && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Executed:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(nodeData.last_executed).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`font-medium ${
                        nodeData.execution_count > 0
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {nodeData.execution_count > 0 ? 'Executed' : 'Not Run'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input */}
              {nodeData.input && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    Input
                  </h3>
                  {Object.keys(nodeData.input).length === 0 ? (
                    <p className="text-sm text-green-600 italic">No input data</p>
                  ) : (
                    <div className="bg-gray-900 rounded text-gray-100 p-3 overflow-x-auto">
                      <pre className="text-xs font-mono">
                        {JSON.stringify(nodeData.input, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Output */}
              {nodeData.output && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-700 mb-3 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    Output
                  </h3>
                  {Object.keys(nodeData.output).length === 0 ? (
                    <p className="text-sm text-purple-600 italic">No output data</p>
                  ) : (
                    <div className="bg-gray-900 rounded text-gray-100 p-3 overflow-x-auto">
                      <pre className="text-xs font-mono">
                        {JSON.stringify(nodeData.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Current State */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Current State
                </h3>
                {Object.keys(nodeData.current_state).length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    {nodeData.execution_count === 0
                      ? 'No data yet. Run the graph to populate.'
                      : 'No state data available.'}
                  </p>
                ) : (
                  <div className="bg-gray-900 rounded text-gray-100 p-3 overflow-x-auto">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(nodeData.current_state, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Node Details */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  Node Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Node ID:</span>
                    <div className="text-blue-900 bg-blue-100 rounded px-2 py-1 mt-1 font-mono text-xs break-all">
                      {nodeData.node_id}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Graph ID:</span>
                    <div className="text-blue-900 bg-blue-100 rounded px-2 py-1 mt-1 font-mono text-xs break-all">
                      {nodeData.graph_id}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && !nodeData && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p>Click on a node to view its data</p>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

