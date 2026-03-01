import { useState, useEffect } from 'react';
import { propertiesAPI, usersAPI } from '../../services/api';
import ConfirmDialog from '../shared/ConfirmDialog';
import PromptDialog from '../shared/PromptDialog';
import SelectDialog from '../shared/SelectDialog';
import Toast from '../shared/Toast';
import type { Property, User } from '../../types';
import type { PropertyUpdateData } from '../../types/api';
import { PropertyFormData } from '../../types/forms';
import { useDialog } from '../../hooks/useDialog';
import { getUser } from '../../utils/session';

const AdminProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState<PropertyFormData>({
    title: '',
    type: 'House',
    price: 0,
    location: '',
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    description: '',
    features: [],
    status: 'available',
    imageUrl: ''
  });
  const {
    dialogState,
    toastState,
    openConfirm,
    openPrompt,
    openSelect,
    showToast,
    handleConfirm,
    handleCancel,
    handlePromptSubmit,
    handlePromptCancel,
    handleSelectSubmit,
    handleSelectCancel,
    closeToast
  } = useDialog();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [propertiesRes, usersRes] = await Promise.all([
        propertiesAPI.getAll(),
        usersAPI.getAll()
      ]);
      setProperties(propertiesRes.data);
      setAgents(usersRes.data.filter((u: User) => u.role === 'agent'));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await propertiesAPI.getAll();
      setProperties(response.data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await propertiesAPI.uploadImages(formData);
      const newUrls = response.data.imageUrls;
      setUploadedImageUrls(prev => [...prev, ...newUrls]);
      
      // Set first image as primary imageUrl if not set
      if (!createForm.imageUrl && newUrls.length > 0) {
        setCreateForm({ ...createForm, imageUrl: newUrls[0] });
      }
      
      showToast({ type: 'success', message: `Uploaded ${files.length} image(s) successfully!` });
    } catch (error) {
      console.error('Failed to upload images:', error);
      showToast({ type: 'error', message: 'Failed to upload images' });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeUploadedImage = (urlToRemove: string) => {
    setUploadedImageUrls(prev => prev.filter(url => url !== urlToRemove));
    // If removing the primary image, set a new one
    if (createForm.imageUrl === urlToRemove) {
      const remaining = uploadedImageUrls.filter(url => url !== urlToRemove);
      setCreateForm({ ...createForm, imageUrl: remaining[0] || '' });
    }
  };

  const handleCreateProperty = async () => {
    try {
      if (!createForm.title || !createForm.price || !createForm.location || !createForm.description) {
        showToast({ type: 'error', message: 'Title, price, location, and description are required' });
        return;
      }
      
      // Use first uploaded image as primary if imageUrl is not set
      const primaryImage = createForm.imageUrl || (uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : '');
      
      const payload: Partial<Property> = {
        title: createForm.title,
        type: createForm.type,
        price: createForm.price,
        location: createForm.location,
        bedrooms: createForm.bedrooms,
        bathrooms: createForm.bathrooms,
        area: createForm.area,
        description: createForm.description,
        features: createForm.features,
        status: 'available',
        imageUrl: primaryImage,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : (primaryImage ? [primaryImage] : []),
        statusHistory: [],
        viewCount: 0,
        viewHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        soldBy: undefined,
        soldByAgentId: undefined,
        soldAt: undefined
      };
      await propertiesAPI.create(payload);
      await loadProperties();
      setShowCreate(false);
      setUploadedImageUrls([]);
      setCreateForm({
        title: '',
        type: 'House',
        price: 0,
        location: '',
        bedrooms: 0,
        bathrooms: 0,
        area: 0,
        description: '',
        features: [],
        status: 'available',
        imageUrl: ''
      });
      showToast({ type: 'success', message: 'Property created successfully!' });
    } catch (error) {
      console.error('Failed to create property:', error);
      showToast({ type: 'error', message: 'Failed to create property' });
    }
  };

  const handleStatusChange = async (property: Property, newStatus: Property['status']) => {
    const admin = getUser('admin') || getUser('superadmin') || { id: 'system', name: 'Admin' };
    
    try {
      let updateData: PropertyUpdateData = {
        status: newStatus,
        statusHistory: [
          ...(property.statusHistory || []),
          {
            status: newStatus,
            changedBy: admin.id,
            changedByName: admin.name,
            changedAt: new Date().toISOString()
          }
        ]
      };
      
      // If changing to "sold", require agent selection and sale details
      if (newStatus === 'sold') {
        const agentId = await openPrompt({
          title: 'Select Agent',
          message: `Enter agent ID who sold this property:`,
          placeholder: `Available agents: ${agents.map(a => `${a.name} (${a.id})`).join(', ')}`
        });
        
        if (!agentId) {
          showToast({ type: 'error', message: 'Agent ID is required for sold properties' });
          return;
        }
        
        const selectedAgent = agents.find(a => a.id === agentId);
        if (!selectedAgent) {
          showToast({ type: 'error', message: 'Invalid agent ID' });
          return;
        }
        
        const salePriceStr = await openPrompt({
          title: 'Enter Sale Price',
          message: `Enter final sale price (default: ₱${property.price.toLocaleString()}):`,
          defaultValue: property.price.toString(),
          inputType: 'number'
        });
        
        const salePrice = salePriceStr ? parseFloat(salePriceStr) : property.price;
        
        updateData = {
          ...updateData,
          soldBy: selectedAgent.name,
          soldByAgentId: selectedAgent.id,
          soldAt: new Date().toISOString(),
          salePrice: salePrice,
          statusHistory: [
            ...(property.statusHistory || []),
            {
              status: newStatus,
              changedBy: admin.id,
              changedByName: admin.name,
              changedAt: new Date().toISOString(),
              reason: `Sold by ${selectedAgent.name} for ₱${salePrice.toLocaleString()}`
            }
          ]
        };
      }
      
      await propertiesAPI.update(property.id, updateData);
      await loadProperties();
      showToast({ type: 'success', message: 'Property status updated successfully!' });
    } catch (error) {
      console.error('Failed to update property status:', error);
      showToast({ type: 'error', message: 'Failed to update property status' });
    }
  };

  const handleSetReservation = async (property: Property) => {
    if (property.status !== 'available') {
      showToast({ type: 'error', message: 'Only available properties can be reserved' });
      return;
    }

    const agentId = await openSelect({
      title: 'Reserve Property',
      message: 'Select agent to reserve this property for:',
      options: agents.map(agent => ({
        value: agent.id,
        label: `${agent.name} (${agent.email})`
      }))
    });
    
    if (!agentId) return;
    
    const selectedAgent = agents.find(a => a.id === agentId);
    if (!selectedAgent) {
      showToast({ type: 'error', message: 'Invalid agent ID' });
      return;
    }

    const hoursStr = await openPrompt({
      title: 'Reservation Duration',
      message: 'How many hours should this reservation last?',
      defaultValue: '24',
      inputType: 'number'
    });

    const hours = hoursStr ? parseInt(hoursStr) : 24;
    const reservedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    const admin = getUser('admin') || getUser('superadmin') || { id: 'system', name: 'Admin' };

    try {
      const updateData: PropertyUpdateData = {
        status: 'reserved',
        reservedBy: selectedAgent.name,
        reservedAt: new Date().toISOString(),
        reservedUntil: reservedUntil,
        statusHistory: [
          ...(property.statusHistory || []),
          {
            status: 'reserved',
            changedBy: admin.id,
            changedByName: admin.name,
            changedAt: new Date().toISOString(),
            reason: `Reserved for ${selectedAgent.name} for ${hours} hours`
          }
        ]
      };

      await propertiesAPI.update(property.id, updateData);
      await loadProperties();
      showToast({ type: 'success', message: `Property reserved for ${selectedAgent.name} until ${new Date(reservedUntil).toLocaleString()}` });
    } catch (error) {
      console.error('Failed to set reservation:', error);
      showToast({ type: 'error', message: 'Failed to set reservation' });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await openConfirm({
      title: 'Delete Property',
      message: 'Are you sure you want to delete this property?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    
    if (!confirmed) return;

    try {
      await propertiesAPI.delete(id);
      await loadProperties();
      showToast({ type: 'success', message: 'Property deleted successfully' });
    } catch (error) {
      console.error('Failed to delete property:', error);
      showToast({ type: 'error', message: 'Failed to delete property' });
    }
  };

  if (loading) {
    return <div className="p-8">Loading properties...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📋 Property Management</h1>
        <button
          onClick={() => setShowCreate(s => !s)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md transition"
        >
          {showCreate ? '✕ Close' : '+ Add New Property'}
        </button>
      </div>
      
      {showCreate && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Add New Property</h2>
          <p className="text-gray-600 mb-6 text-sm">
            ✨ Create a new property listing that will be immediately available for customers to view and agents to manage.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="e.g., Luxury Condo in BGC"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="House">House</option>
                <option value="Condominium">Condominium</option>
                <option value="Villa">Villa</option>
                <option value="Apartment">Apartment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (PHP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={createForm.price}
                onChange={(e) => setCreateForm({ ...createForm, price: Number(e.target.value) })}
                placeholder="e.g., 12000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createForm.location}
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                placeholder="e.g., Bonifacio Global City, Taguig"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bedrooms</label>
              <input
                type="number"
                value={createForm.bedrooms}
                onChange={(e) => setCreateForm({ ...createForm, bedrooms: Number(e.target.value) })}
                placeholder="e.g., 2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bathrooms</label>
              <input
                type="number"
                value={createForm.bathrooms}
                onChange={(e) => setCreateForm({ ...createForm, bathrooms: Number(e.target.value) })}
                placeholder="e.g., 2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Area (square meters)</label>
              <input
                type="number"
                value={createForm.area}
                onChange={(e) => setCreateForm({ ...createForm, area: Number(e.target.value) })}
                placeholder="e.g., 85"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Image Upload Section */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property Images</label>
              
              <div className="space-y-4">
                {/* Upload Button */}
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-semibold transition flex items-center justify-center gap-2">
                      {uploadingImages ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Upload Images</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImages}
                    />
                  </label>
                  
                  <input
                    type="text"
                    value={createForm.imageUrl}
                    onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                    placeholder="Or paste image URL"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <p className="text-xs text-gray-600">
                  📸 Upload multiple images (JPG, PNG, WEBP). Max 5MB per image. First image will be the cover photo.
                </p>
                
                {/* Uploaded Images Preview */}
                {uploadedImageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {uploadedImageUrls.map((url, index) => (
                      <div key={url} className="relative group">
                        <img
                          src={url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-300"
                        />
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Cover
                          </div>
                        )}
                        <button
                          onClick={() => removeUploadedImage(url)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Detailed description of the property, including key features, nearby amenities, and unique selling points..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleCreateProperty}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-md transition"
            >
              ✓ Create Property
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 bg-blue-50 border-b border-blue-200">
          <h2 className="text-lg font-bold text-gray-800 mb-2">📊 All Properties</h2>
          <p className="text-sm text-gray-600">
            <strong>💡 Quick Actions:</strong><br/>
            • <strong>Status Dropdown:</strong> Change property status (Draft → Available → Reserved → Sold)<br/>
            • <strong>Reserve Button:</strong> Temporarily hold an Available property for a specific agent (prevents others from claiming it)<br/>
            • <strong>Delete:</strong> Permanently remove property from system
          </p>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {properties.map((property) => (
              <tr key={property.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{property.title}</div>
                      <div className="text-sm text-gray-500">{property.bedrooms} bed • {property.bathrooms} bath</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {property.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₱{property.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {property.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={property.status}
                    onChange={(e) => handleStatusChange(property, e.target.value as Property['status'])}
                    className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
                      property.status === 'available' ? 'bg-green-100 text-green-800' :
                      property.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                      property.status === 'under-contract' ? 'bg-blue-100 text-blue-800' :
                      property.status === 'sold' ? 'bg-purple-100 text-purple-800' :
                      property.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      property.status === 'withdrawn' ? 'bg-orange-100 text-orange-800' :
                      property.status === 'off-market' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <option value="draft">Draft</option>
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="under-contract">Under Contract</option>
                    <option value="sold">Sold</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="off-market">Off Market</option>
                  </select>
                  {property.reservedBy && property.status === 'reserved' && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-500">
                        Reserved by: {property.reservedBy}
                      </p>
                      {property.reservedUntil && (
                        <p className="text-xs text-gray-500">
                          Until: {new Date(property.reservedUntil).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                  {property.soldBy && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-500">
                        Sold by: {property.soldBy}
                      </p>
                      {property.salePrice && (
                        <p className="text-xs text-gray-500">
                          Sale Price: ₱{property.salePrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {property.status === 'available' && (
                    <button
                      onClick={() => handleSetReservation(property)}
                      className="text-blue-600 hover:text-blue-900 mr-4 font-semibold"
                      title="⏰ Reserve this property for a specific agent for a limited time (default 24 hours). This prevents other agents from claiming it while your designated agent works on it."
                    >
                      🔒 Reserve
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(property.id)}
                    className="text-red-600 hover:text-red-900 font-semibold"
                    title="Permanently delete this property"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      
      {dialogState.type === 'prompt' && dialogState.config && 'placeholder' in dialogState.config && (
        <PromptDialog
          isOpen={dialogState.isOpen}
          title={dialogState.config.title}
          message={dialogState.config.message}
          placeholder={dialogState.config.placeholder}
          defaultValue={dialogState.config.defaultValue}
          inputType={dialogState.config.inputType}
          onSubmit={handlePromptSubmit}
          onCancel={handlePromptCancel}
        />
      )}
      
      {dialogState.type === 'select' && dialogState.config && 'options' in dialogState.config && (
        <SelectDialog
          isOpen={dialogState.isOpen}
          title={dialogState.config.title}
          message={dialogState.config.message}
          options={dialogState.config.options}
          onSubmit={handleSelectSubmit}
          onCancel={handleSelectCancel}
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
};

export default AdminProperties;
