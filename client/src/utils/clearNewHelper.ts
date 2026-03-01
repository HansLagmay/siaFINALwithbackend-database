import { databaseAPI } from '../services/api';
import { getUser } from './session';

/**
 * Gets the current user's name from localStorage
 * @returns User name or 'Admin' as default
 */
const getUserName = (): string => {
  try {
    const user = getUser('admin') || getUser('superadmin');
    if (user) {
      return user.name || 'Admin';
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const legacyUser = JSON.parse(userStr);
      return legacyUser.name || 'Admin';
    }
  } catch (e) {
    console.error('Error parsing user data:', e);
  }
  return 'Admin';
};

/**
 * Handles clearing new items list
 * @param type - Type of items to clear ('properties', 'inquiries', or 'agents')
 * @param onSuccess - Callback function to execute on success
 * @returns Promise that resolves when clear operation is complete
 */
export const handleClearNewItems = async (
  type: 'properties' | 'inquiries' | 'agents',
  onSuccess: () => void
): Promise<void> => {
  try {
    const userName = getUserName();
    await databaseAPI.clearNew(type, userName);
    onSuccess();
  } catch (error) {
    console.error(`Failed to clear new ${type}:`, error);
    throw error;
  }
};
