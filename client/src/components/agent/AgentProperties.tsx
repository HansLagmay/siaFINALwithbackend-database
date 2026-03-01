import { useState, useEffect } from 'react';
import { propertiesAPI } from '../../services/api';
import type { Property, User } from '../../types';
import { PropertyFormData } from '../../types/forms';
import { getUser } from '../../utils/session';

const AgentProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [draftForm, setDraftForm] = useState<PropertyFormData>({
    title: '',
    type: 'House',
    price: 0,
    location: '',
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    description: '',
    features: [],
    status: 'draft',
    imageUrl: ''
  });

  useEffect(() => {
    const u = getUser();
    if (u) setUser(u);
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await propertiesAPI.getAll();
      setProperties(response.data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraft = async () => {
    try {
      if (!draftForm.title) {
        alert('Property title is required');
        return;
      }
      const payload: Partial<Property> = {
        title: draftForm.title,
        type: draftForm.type,
        price: draftForm.price,
        location: draftForm.location,
        bedrooms: draftForm.bedrooms,
        bathrooms: draftForm.bathrooms,
        area: draftForm.area,
        description: draftForm.description,
        features: draftForm.features,
        status: 'draft',
        imageUrl: draftForm.imageUrl,
        statusHistory: [],
        viewCount: 0,
        viewHistory: []
      };
      await propertiesAPI.createDraft(payload);
      await loadProperties();
      setShowCreate(false);
      setDraftForm({
        title: '',
        type: 'House',
        price: 0,
        location: '',
        bedrooms: 0,
        bathrooms: 0,
        area: 0,
        description: '',
        features: [],
        status: 'draft',
        imageUrl: ''
      });
      alert('✓ Draft property created successfully! Admin will review and publish it.');
    } catch (error) {
      console.error('Failed to create draft property:', error);
      alert('Failed to create draft property');
    }
  };

  if (loading) {
    return <div className="p-8">Loading properties...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📋 Properties</h1>
        <button
          onClick={() => setShowCreate(s => !s)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md transition"
        >
          {showCreate ? '✕ Close' : '+ Create Draft Property'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Draft Property</h2>
          <p className="text-gray-600 mb-6 text-sm">
            📝 Create a draft property listing. Admin will review and publish it to make it visible to customers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={draftForm.title}
                onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })}
                placeholder="e.g., Modern Family Home in Manila"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
              <select
                value={draftForm.type}
                onChange={(e) => setDraftForm({ ...draftForm, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="House">House</option>
                <option value="Condominium">Condominium</option>
                <option value="Villa">Villa</option>
                <option value="Apartment">Apartment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price (PHP)</label>
              <input
                type="number"
                value={draftForm.price}
                onChange={(e) => setDraftForm({ ...draftForm, price: Number(e.target.value) })}
                placeholder="e.g., 8500000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={draftForm.location}
                onChange={(e) => setDraftForm({ ...draftForm, location: e.target.value })}
                placeholder="e.g., Quezon City, Metro Manila"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bedrooms</label>
              <input
                type="number"
                value={draftForm.bedrooms}
                onChange={(e) => setDraftForm({ ...draftForm, bedrooms: Number(e.target.value) })}
                placeholder="e.g., 4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bathrooms</label>
              <input
                type="number"
                value={draftForm.bathrooms}
                onChange={(e) => setDraftForm({ ...draftForm, bathrooms: Number(e.target.value) })}
                placeholder="e.g., 3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Area (square meters)</label>
              <input
                type="number"
                value={draftForm.area}
                onChange={(e) => setDraftForm({ ...draftForm, area: Number(e.target.value) })}
                placeholder="e.g., 180"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
              <input
                type="text"
                value={draftForm.imageUrl}
                onChange={(e) => setDraftForm({ ...draftForm, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={draftForm.description}
                onChange={(e) => setDraftForm({ ...draftForm, description: e.target.value })}
                placeholder="Describe the property features, location benefits, and unique selling points..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleCreateDraft}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-md transition"
            >
              💾 Save Draft
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-800 mb-4">🏘️ Available Properties</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {properties.filter((p: Property) => p.status === 'available').map((property) => (
          <div 
            key={property.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
            onClick={() => setSelectedProperty(property)}
          >
            <img
              src={property.imageUrl}
              alt={property.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-800">{property.title}</h3>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                  {property.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">📍 {property.location}</p>
              <p className="text-2xl font-bold text-blue-600 mb-3">
                ₱{property.price.toLocaleString()}
              </p>
              <div className="flex items-center gap-4 text-gray-600 text-sm">
                <span>🛏️ {property.bedrooms} Beds</span>
                <span>🚿 {property.bathrooms} Baths</span>
                <span>📐 {property.area} sqm</span>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                <span>👁️ {property.viewCount || 0} views</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-4">📝 My Drafts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties
          .filter((p: Property) => p.status === 'draft' && (!user || p.createdBy === user.name))
          .map((property) => (
          <div 
            key={property.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
            onClick={() => setSelectedProperty(property)}
          >
            <img
              src={property.imageUrl}
              alt={property.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-800">{property.title}</h3>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">
                  Draft
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">📍 {property.location}</p>
              <div className="flex items-center gap-4 text-gray-600 text-sm">
                <span>🛏️ {property.bedrooms} Beds</span>
                <span>🚿 {property.bathrooms} Baths</span>
                <span>📐 {property.area} sqm</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {properties.filter((p: Property) => p.status === 'available').length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No available properties at the moment.
        </div>
      )}

      {/* Property Detail Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img
                src={selectedProperty.imageUrl}
                alt={selectedProperty.title}
                className="w-full h-96 object-cover"
              />
              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-800">{selectedProperty.title}</h2>
                <div className="flex gap-2">
                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                    {selectedProperty.type}
                  </span>
                  <span className={`px-4 py-2 rounded-full font-semibold ${
                    selectedProperty.status === 'available' ? 'bg-green-100 text-green-800' :
                    selectedProperty.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                    selectedProperty.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedProperty.status}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 mb-2 flex items-center text-lg">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {selectedProperty.location}
              </p>

              <div className="flex items-center justify-between mb-6">
                <p className="text-4xl font-bold text-blue-600">
                  ₱{selectedProperty.price.toLocaleString()}
                </p>
                <div className="text-right text-sm text-gray-500">
                  <p>👁️ {selectedProperty.viewCount || 0} views</p>
                  {selectedProperty.createdAt && (
                    <p>📅 Listed {new Date(selectedProperty.createdAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{selectedProperty.bedrooms}</div>
                  <div className="text-gray-600">Bedrooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{selectedProperty.bathrooms}</div>
                  <div className="text-gray-600">Bathrooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{selectedProperty.area}</div>
                  <div className="text-gray-600">sqm</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">{selectedProperty.description || 'No description available.'}</p>
              </div>

              {selectedProperty.features && selectedProperty.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Features</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProperty.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProperty.reservedBy && selectedProperty.status === 'reserved' && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-lg font-bold text-yellow-800 mb-2">⏰ Reservation Info</h3>
                  <p className="text-yellow-700">Reserved by: <strong>{selectedProperty.reservedBy}</strong></p>
                  {selectedProperty.reservedUntil && (
                    <p className="text-yellow-700">Until: {new Date(selectedProperty.reservedUntil).toLocaleString()}</p>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentProperties;
