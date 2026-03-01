import { useState, useEffect } from 'react';
import { databaseAPI } from '../../services/api';
import FileMetadataComponent from './FileMetadata';
import ExportButtons from './ExportButtons';
import DataTable from './DataTable';
import ConfirmDialog from '../shared/ConfirmDialog';
import Toast from '../shared/Toast';
import type { FileMetadata, Property } from '../../types';
import { useDialog } from '../../hooks/useDialog';
import { handleDatabaseExport, handleClearNewTracking, getUserFromStorage } from '../../utils/database';
import type { TableRow } from '../../types/api';

export default function PropertiesSection() {
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [newMetadata, setNewMetadata] = useState<FileMetadata | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [newProperties, setNewProperties] = useState<Property[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [showNewProperties, setShowNewProperties] = useState(false);
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
      const [metaRes, newMetaRes, propsRes, newPropsRes] = await Promise.all([
        databaseAPI.getFileMetadata('properties.json'),
        databaseAPI.getFileMetadata('new-properties.json'),
        databaseAPI.getFile('properties.json'),
        databaseAPI.getRecent('properties')
      ]);
      
      setMetadata(metaRes.data);
      setNewMetadata(newMetaRes.data);
      setProperties(propsRes.data as Property[]);
      setNewProperties(newPropsRes.data as Property[]);
    } catch (error) {
      console.error('Failed to fetch properties data:', error);
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
      title: 'Clear New Properties',
      message: 'Are you sure you want to clear the new properties list?',
      confirmText: 'Clear',
      cancelText: 'Cancel',
      variant: 'warning'
    });
    
    if (!confirmed) return;
    
    const user = getUserFromStorage();
    await handleClearNewTracking(
      'properties',
      user.name,
      () => {
        showToast({ type: 'success', message: 'New properties list cleared successfully' });
        fetchData();
      },
      () => {
        showToast({ type: 'error', message: 'Failed to clear new properties list' });
      }
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading properties data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* All Properties Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">🏠 All Properties (properties.json)</h3>
          <ExportButtons onExport={(format) => handleExport('properties.json', format)} />
        </div>
        
        <FileMetadataComponent metadata={metadata} />
        
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
            <DataTable data={properties as unknown as TableRow[]} maxRows={10} />
          </div>
        )}
      </div>

      {/* New Properties Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">⭐ Recently Added Properties (new-properties.json)</h3>
          {newProperties.length > 0 && (
            <button
              onClick={handleClearNew}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
            >
              🗑️ Clear New Properties List
            </button>
          )}
        </div>
        
        <FileMetadataComponent metadata={newMetadata} />

        {newProperties.length === 0 ? (
          <div className="mt-4 text-center py-8 text-gray-500">
            No new properties to display
          </div>
        ) : (
          <>
            <div className="mt-4">
              <button
                onClick={() => setShowNewProperties(!showNewProperties)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {showNewProperties ? '📋 Hide List' : '📋 View List'}
              </button>
            </div>

            {showNewProperties && (
              <div className="mt-4 space-y-4">
                {newProperties.map((property) => (
                  <div key={property.id} className="border border-gray-200 rounded p-4">
                    <div className="font-semibold text-lg text-gray-900">
                      {property.id} | {property.title}
                    </div>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <div>Added: {new Date(property.createdAt).toLocaleString()}</div>
                      <div>Price: ₱{property.price.toLocaleString()}</div>
                      <div>Location: {property.location}</div>
                      <div>Type: {property.type}</div>
                      <div>Status: {property.status}</div>
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
