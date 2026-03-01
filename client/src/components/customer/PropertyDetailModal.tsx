import { useEffect } from 'react';
import type { Property } from '../../types';
import { propertiesAPI } from '../../services/api';
import ImageGallery from './ImageGallery';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
  onInquire: () => void;
}

const PropertyDetailModal = ({ property, onClose, onInquire }: PropertyDetailModalProps) => {
  // Increment view count when modal opens
  useEffect(() => {
    const incrementViewCount = async () => {
      try {
        await propertiesAPI.update(property.id, {
          viewCount: (property.viewCount || 0) + 1,
          lastViewedAt: new Date().toISOString(),
          viewHistory: [
            ...(property.viewHistory || []),
            {
              viewedAt: new Date().toISOString()
            }
          ]
        });
      } catch (error) {
        console.error('Failed to increment view count:', error);
      }
    };
    
    incrementViewCount();
  }, [property.id]);

  // Calculate days on market
  const daysOnMarket = () => {
    const created = new Date(property.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get all images (use images array if available, otherwise fallback to single imageUrl)
  const allImages = property.images && property.images.length > 0 
    ? property.images 
    : [property.imageUrl];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <ImageGallery images={allImages} title={property.title} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 shadow-lg z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-gray-800">{property.title}</h2>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                {property.type}
              </span>
              {daysOnMarket() <= 7 && (
                <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold">
                  🔥 New Listing
                </span>
              )}
              {daysOnMarket() > 90 && (
                <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold text-sm">
                  ⏳ {daysOnMarket()} days on market
                </span>
              )}
            </div>
          </div>

          <p className="text-gray-600 mb-2 flex items-center text-lg">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {property.location}
          </p>

          <div className="flex items-center justify-between mb-6">
            <p className="text-4xl font-bold text-blue-600">
              ₱{property.price.toLocaleString()}
            </p>
            <div className="text-right text-sm text-gray-500">
              <p>👁️ {property.viewCount || 0} views</p>
              <p>📅 Listed {daysOnMarket()} days ago</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{property.bedrooms}</div>
              <div className="text-gray-600">Bedrooms</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{property.bathrooms}</div>
              <div className="text-gray-600">Bathrooms</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{property.area}</div>
              <div className="text-gray-600">sqm</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Description</h3>
            <p className="text-gray-600 leading-relaxed">{property.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Features</h3>
            <div className="grid grid-cols-2 gap-2">
              {property.features.map((feature, index) => (
                <div key={index} className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Close
            </button>
            <button
              onClick={onInquire}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
            >
              ✉️ Send Inquiry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;
