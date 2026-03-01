interface ExportButtonsProps {
  onExport: (format: 'csv' | 'json') => void;
}

export default function ExportButtons({ onExport }: ExportButtonsProps) {
  return (
    <div className="flex space-x-2">
      <button
        onClick={() => onExport('csv')}
        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
      >
        📥 Export CSV
      </button>
      <button
        onClick={() => onExport('json')}
        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
      >
        📥 Export JSON
      </button>
    </div>
  );
}
