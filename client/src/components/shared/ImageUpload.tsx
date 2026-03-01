import { useState, useRef } from 'react';
import { propertiesAPI } from '../../services/api';

interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
}

const ImageUpload = ({ onUploadComplete, maxFiles = 10 }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file count
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
        setError(`File ${file.name} is not a valid image format`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} exceeds 5MB size limit`);
        return;
      }
      validFiles.push(file);
    }

    // Show previews
    const previewUrls = validFiles.map(f => URL.createObjectURL(f));
    setPreviews(previewUrls);
    setError(null);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      validFiles.forEach(file => formData.append('images', file));

      const response = await propertiesAPI.uploadImages(formData);
      onUploadComplete(response.data.imageUrls);
      
      // Clean up previews
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviews([]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      setError(error.response?.data?.error || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const clearPreviews = () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setPreviews([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Images (Max {maxFiles}, 5MB each)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          max={maxFiles}
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: JPG, JPEG, PNG, WEBP
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {uploading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <p className="font-semibold">Uploading...</p>
          <p>Please wait while images are being uploaded</p>
        </div>
      )}

      {previews.length > 0 && !uploading && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Preview ({previews.length} image{previews.length > 1 ? 's' : ''})
            </p>
            <button
              onClick={clearPreviews}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((url, i) => (
              <div key={i} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-200"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
