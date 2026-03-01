import { databaseAPI } from '../services/api';

/**
 * Handles file export in CSV or JSON format
 * @param filename - The name of the file to export (e.g., 'properties.json')
 * @param format - The export format ('csv' or 'json')
 * @returns Promise that resolves when export is complete
 */
export const handleFileExport = async (
  filename: string, 
  format: 'csv' | 'json'
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
    throw new Error('Failed to export file');
  }
};
