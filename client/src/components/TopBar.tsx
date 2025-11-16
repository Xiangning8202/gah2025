"use client";

interface TopBarProps {
  onRun: () => void;
  isExecuting?: boolean;
}

export default function TopBar({
  onRun,
  isExecuting = false,
}: TopBarProps) {
  const handleRunClick = () => {
    console.log('[TopBar] Run button clicked');
    console.log('[TopBar] isExecuting:', isExecuting);
    onRun();
  };

  return (
    <div className="absolute top-5 right-5 z-50">
      <div className="bg-white rounded-lg shadow-md px-4 py-2 flex items-center gap-3 border border-gray-200">
        <button
          onClick={handleRunClick}
          disabled={isExecuting}
          className={`${
            isExecuting
              ? 'bg-gray-500 cursor-not-allowed'
              : 'cursor-pointer'
          } text-white px-5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2`}
          style={{
            background: isExecuting ? '#6b7280' : '#111827',
            opacity: isExecuting ? 0.6 : 1,
          }}
        >
          {isExecuting ? (
            <>
              <span className="animate-spin">⚙️</span>
              <span>Running...</span>
            </>
          ) : (
            <>
              <span>▶</span>
              <span>Run</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
