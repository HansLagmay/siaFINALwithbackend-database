import type { Property } from '../../types';

interface PropertyListProps {
  properties: Property[];
  onViewDetails: (property: Property) => void;
  onInquire: (property: Property) => void;
}

const PropertyList = ({ properties, onViewDetails, onInquire }: PropertyListProps) => {
  const daysOnMarket = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">No properties found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <div
          key={property.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
          <div className="relative h-48">
            <img
              src={property.imageUrl}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {property.type}
              </div>
              {daysOnMarket(property.createdAt) <= 7 && (
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  🔥 New!
                </div>
              )}
            </div>
            {daysOnMarket(property.createdAt) > 90 && (
              <div className="absolute bottom-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                ⏳ {daysOnMarket(property.createdAt)} days
              </div>
            )}
          </div>

          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{property.title}</h3>
            <p className="text-gray-600 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {property.location}
            </p>
            <p className="text-2xl font-bold text-blue-600 mb-4">
              ₱{property.price.toLocaleString()}
            </p>

            <div className="flex items-center gap-4 text-gray-600 text-sm mb-4">
              <span>{property.bedrooms} Beds</span>
              <span>{property.bathrooms} Baths</span>
              <span>{property.area} sqm</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onViewDetails(property)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                View Details
              </button>
              <button
                onClick={() => onInquire(property)}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Inquire
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertyList;
