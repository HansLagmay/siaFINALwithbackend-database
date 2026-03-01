import type { TableRow } from '../../types/api';

interface DataTableProps {
  data: TableRow[];
  maxRows?: number;
}

const MAX_DISPLAY_LENGTH = 100;

export default function DataTable({ data, maxRows = 10 }: DataTableProps) {
  const safeData = (data || []).filter((row) => row && typeof row === 'object');
  if (safeData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        No data available
      </div>
    );
  }

  const displayData = maxRows ? safeData.slice(0, maxRows) : safeData;
  const headers = Object.keys(safeData[0] as Record<string, unknown>);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {headers.map((header) => {
                  const value = row[header];
                  let displayValue = '';
                  
                  if (typeof value === 'object' && value !== null) {
                    const jsonStr = JSON.stringify(value);
                    // Truncate long JSON strings for performance
                    displayValue = jsonStr.length > MAX_DISPLAY_LENGTH 
                      ? jsonStr.substring(0, MAX_DISPLAY_LENGTH) + '...' 
                      : jsonStr;
                  } else {
                    displayValue = String(value ?? '');
                  }
                  
                  return (
                    <td key={header} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {maxRows && safeData.length > maxRows && (
        <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600 text-center border-t">
          Showing {maxRows} of {safeData.length} records
        </div>
      )}
    </div>
  );
}
