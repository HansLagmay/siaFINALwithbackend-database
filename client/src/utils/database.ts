import { databaseAPI } from '../services/api';
import { getUser } from './session';

/**
 * Handle database export to CSV or JSON format
 */
export const handleDatabaseExport = async (
  filename: string,
  format: 'csv' | 'json',
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    const response = format === 'csv' 
      ? await databaseAPI.exportCSV(filename)
      : await databaseAPI.exportJSON(filename);
    
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.json', `.${format}`);
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Failed to export:', error);
    if (onError) {
      onError(error as Error);
    } else {
      throw error;
    }
  }
};

/**
 * Clear new tracking for properties, inquiries, or agents
 */
export const handleClearNewTracking = async (
  type: 'properties' | 'inquiries' | 'agents',
  userName: string,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    await databaseAPI.clearNew(type, userName);
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error(`Failed to clear new ${type}:`, error);
    if (onError) {
      onError(error as Error);
    } else {
      throw error;
    }
  }
};

/**
 * Get user information from localStorage
 */
export const getUserFromStorage = (): { name: string; id?: string } => {
  try {
    const user = getUser('admin') || getUser('superadmin');
    if (user) {
      return {
        name: user.name || 'Admin',
        id: user.id
      };
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const legacyUser = JSON.parse(userStr);
      return {
        name: legacyUser.name || 'Admin',
        id: legacyUser.id
      };
    }
  } catch (e) {
    console.error('Error parsing user data:', e);
  }
  return { name: 'Admin' };
};
