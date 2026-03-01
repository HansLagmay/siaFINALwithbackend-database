import { useState, useEffect } from 'react';
import { databaseAPI } from '../../services/api';
import { handleFileExport } from '../../utils/exportHelper';
import FileMetadataComponent from './FileMetadata';
import ExportButtons from './ExportButtons';
import Toast from '../shared/Toast';
import type { ToastProps } from '../shared/Toast';
import type { FileMetadata, ActivityLog } from '../../types';

export default function ActivityLogViewer() {
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [displayLogs, setDisplayLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastProps['type']; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metaRes, logsRes] = await Promise.all([
        databaseAPI.getFileMetadata('activity-log.json'),
        databaseAPI.getFile('activity-log.json')
      ]);
      
      setMetadata(metaRes.data);
      setLogs(logsRes.data as ActivityLog[]);
      // Show last 10 by default
      setDisplayLogs((logsRes.data as ActivityLog[]).slice(-10).reverse());
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      await handleFileExport('activity-log.json', format);
    } catch (error) {
      setToast({ message: 'Failed to export file', type: 'error', isVisible: true });
    }
  };

  const toggleShowAll = () => {
    if (showAll) {
      setDisplayLogs(logs.slice(-10).reverse());
    } else {
      setDisplayLogs([...logs].reverse());
    }
    setShowAll(!showAll);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return '🔐';
    if (action.includes('ADD') || action.includes('CREATE')) return '➕';
    if (action.includes('DELETE') || action.includes('REMOVE')) return '🗑️';
    if (action.includes('UPDATE') || action.includes('EDIT')) return '✏️';
    if (action.includes('ASSIGN')) return '👤';
    if (action.includes('CLEAR')) return '🧹';
    return '📋';
  };

  const getRelativeTime = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading activity log...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">📋 Activity Log (activity-log.json)</h3>
          <ExportButtons onExport={handleExport} />
        </div>
        
        <FileMetadataComponent metadata={metadata} />
        
        <div className="mt-4 flex space-x-2">
          <button
            onClick={toggleShowAll}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {showAll ? '📋 Show Last 10' : '📋 Show All'}
          </button>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold text-gray-900 mb-4">
            {showAll ? 'All Activities' : 'Recent Activities (Last 10)'}
          </h4>
          
          {displayLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded">
              No activity logs available
            </div>
          ) : (
            <div className="space-y-4">
              {displayLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-2xl">{getActionIcon(log.action)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{log.action}</span>
                          <span className="text-xs text-gray-500">{getRelativeTime(log.timestamp)}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{log.details}</div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>👤 {log.user}</span>
                          <span>🕐 {new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, isVisible: false })}
        />
      )}
    </div>
  );
}
