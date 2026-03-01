import { useState, useEffect } from 'react';
import { databaseAPI } from '../../services/api';
import FileMetadataComponent from './FileMetadata';
import ExportButtons from './ExportButtons';
import DataTable from './DataTable';
import ConfirmDialog from '../shared/ConfirmDialog';
import Toast from '../shared/Toast';
import type { FileMetadata, User } from '../../types';
import { useDialog } from '../../hooks/useDialog';
import { handleDatabaseExport, handleClearNewTracking, getUserFromStorage } from '../../utils/database';
import type { TableRow } from '../../types/api';

export default function UsersSection() {
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [newMetadata, setNewMetadata] = useState<FileMetadata | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [newAgents, setNewAgents] = useState<User[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [showNewAgents, setShowNewAgents] = useState(false);
  const [loading, setLoading] = useState(true);
  const {
    dialogState,
    toastState,
    openConfirm,
    showToast,
    handleConfirm,
    handleCancel,
    closeToast
  } = useDialog();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metaRes, newMetaRes, usersRes, newAgentsRes] = await Promise.all([
        databaseAPI.getFileMetadata('users.json'),
        databaseAPI.getFileMetadata('new-agents.json'),
        databaseAPI.getFile('users.json'),
        databaseAPI.getRecent('agents')
      ]);
      
      setMetadata(metaRes.data);
      setNewMetadata(newMetaRes.data);
      setUsers(usersRes.data as User[]);
      setNewAgents(newAgentsRes.data as User[]);
    } catch (error) {
      console.error('Failed to fetch users data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (filename: string, format: 'csv' | 'json') => {
    await handleDatabaseExport(filename, format, () => {
      showToast({ type: 'error', message: 'Failed to export file' });
    });
  };

  const handleClearNew = async () => {
    const confirmed = await openConfirm({
      title: 'Clear New Agents',
      message: 'Are you sure you want to clear the new agents list?',
      confirmText: 'Clear',
      cancelText: 'Cancel',
      variant: 'warning'
    });
    
    if (!confirmed) return;
    
    const user = getUserFromStorage();
    await handleClearNewTracking(
      'agents',
      user.name,
      () => {
        showToast({ type: 'success', message: 'New agents list cleared successfully' });
        fetchData();
      },
      () => {
        showToast({ type: 'error', message: 'Failed to clear new agents list' });
      }
    );
  };

  const getRoleBreakdown = () => {
    const admins = users.filter(u => u.role === 'admin').length;
    const agents = users.filter(u => u.role === 'agent').length;
    return { admins, agents };
  };

  if (loading) {
    return <div className="text-center py-8">Loading users data...</div>;
  }

  const { admins, agents } = getRoleBreakdown();

  return (
    <div className="space-y-6">
      {/* All Users Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">👥 All Users (users.json)</h3>
          <ExportButtons onExport={(format) => handleExport('users.json', format)} />
        </div>
        
        <FileMetadataComponent metadata={metadata} />
        
        <div className="mt-4 bg-gray-50 rounded p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Breakdown:</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Admin:</span>
              <span className="font-semibold text-gray-900">{admins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Agents:</span>
              <span className="font-semibold text-gray-900">{agents}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={() => setShowTable(!showTable)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {showTable ? '📋 Hide Table' : '📋 View Table'}
          </button>
        </div>

        {showTable && (
          <div className="mt-4">
            <DataTable data={users as unknown as TableRow[]} maxRows={10} />
          </div>
        )}
      </div>

      {/* New Agents Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">⭐ Recently Added Agents (new-agents.json)</h3>
          {newAgents.length > 0 && (
            <button
              onClick={handleClearNew}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
            >
              🗑️ Clear New Agents List
            </button>
          )}
        </div>
        
        <FileMetadataComponent metadata={newMetadata} />

        {newAgents.length === 0 ? (
          <div className="mt-4 text-center py-8 text-gray-500">
            No new agents to display
          </div>
        ) : (
          <>
            <div className="mt-4">
              <button
                onClick={() => setShowNewAgents(!showNewAgents)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {showNewAgents ? '📋 Hide List' : '📋 View List'}
              </button>
            </div>

            {showNewAgents && (
              <div className="mt-4 space-y-4">
                {newAgents.map((agent, idx) => (
                  <div key={idx} className="border border-gray-200 rounded p-4">
                    <div className="font-semibold text-lg text-gray-900">
                      {agent.id ? `${agent.id} | ${agent.name}` : agent.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <div>Created: {new Date(agent.createdAt || Date.now()).toLocaleString()}</div>
                      <div>Email: {agent.email}</div>
                      <div>Role: {agent.role}</div>
                      {agent.phone && <div>Phone: {agent.phone}</div>}
                      {agent.employmentData && (
                        <>
                          <div>Position: {agent.employmentData.position}</div>
                          <div>Department: {agent.employmentData.department}</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Dialogs */}
      {dialogState.type === 'confirm' && dialogState.config && 'confirmText' in dialogState.config && (
        <ConfirmDialog
          isOpen={dialogState.isOpen}
          title={dialogState.config.title}
          message={dialogState.config.message}
          confirmText={dialogState.config.confirmText}
          cancelText={dialogState.config.cancelText}
          variant={dialogState.config.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      
      {toastState.isVisible && (
        <Toast
          message={toastState.message}
          type={toastState.type}
          duration={toastState.duration}
          onClose={closeToast}
        />
      )}
    </div>
  );
}
