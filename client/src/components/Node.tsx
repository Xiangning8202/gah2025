interface NodeProps {
  id: string;
  title: string;
  description?: string;
  position: { x: number; y: number };
}

export default function Node({ id, title, description, position }: NodeProps) {
  return (
    <div
      className="absolute bg-white border-2 border-gray-800 rounded-lg shadow-lg p-4 min-w-[200px] hover:shadow-xl hover:border-gray-900 transition-all cursor-pointer"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
        <span className="text-xs text-gray-400">ID: {id}</span>
      </div>
    </div>
  );
}
