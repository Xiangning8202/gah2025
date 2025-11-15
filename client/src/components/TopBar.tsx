export default function TopBar() {
  return (
    <div className="absolute top-5 right-5 z-50">
      <div className="bg-white rounded-lg shadow-md px-4 py-2 flex items-center gap-3 border border-gray-200">
        <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
          <span>▶</span>
          Run
        </button>
        <button className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-1.5 rounded-md text-sm font-medium transition-colors">
          Clear
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-md text-sm font-medium transition-colors">
          Save
        </button>
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-1.5 rounded-md text-sm font-medium transition-colors">
          Export
        </button>
      </div>
    </div>
  );
}
