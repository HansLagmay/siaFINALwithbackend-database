import type { FileMetadata } from '../../types';

interface FileMetadataProps {
  metadata: FileMetadata | null;
}

export default function FileMetadataComponent({ metadata }: FileMetadataProps) {
  if (!metadata) {
    return (
      <div className="text-sm text-gray-500">Loading metadata...</div>
    );
  }

  return (
    <div className="bg-gray-50 rounded p-4 space-y-2">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">📁 File:</span>
          <span className="ml-2 font-semibold">{metadata.filename}</span>
        </div>
        <div>
          <span className="text-gray-600">📊 Records:</span>
          <span className="ml-2 font-semibold">{metadata.recordCount}</span>
        </div>
        <div>
          <span className="text-gray-600">💾 Size:</span>
          <span className="ml-2 font-semibold">{metadata.sizeFormatted}</span>
        </div>
        <div>
          <span className="text-gray-600">🕐 Modified:</span>
          <span className="ml-2 font-semibold">
            {metadata.lastModified ? new Date(metadata.lastModified).toLocaleString() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
