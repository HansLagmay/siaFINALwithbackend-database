import { useState, useEffect } from 'react';
import { propertiesAPI, usersAPI } from '../../services/api';
import ConfirmDialog from '../shared/ConfirmDialog';
import PromptDialog from '../shared/PromptDialog';
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
    showToast,
    handleConfirm,
    handleCancel,
    handlePromptSubmit,
    handlePromptCancel,
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

  const handleCreateProperty = async () => {
    try {
      if (!createForm.title || !createForm.price || !createForm.location || !createForm.description) {
        showToast({ type: 'error', message: 'Title, price, location, and description are required' });
        return;
      }
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
        imageUrl: createForm.imageUrl,
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
        
        // Get commission rate
        const commissionRateStr = await openPrompt({
          title: 'Enter Commission Rate',
          message: 'Enter commission rate percentage (e.g., 3 for 3%):',
          defaultValue: '3',
          inputType: 'number'
        });
        
        const commissionRate = commissionRateStr ? parseFloat(commissionRateStr) : 3;
        const commissionAmount = (salePrice * commissionRate) / 100;
        
        updateData = {
          ...updateData,
          soldBy: selectedAgent.name,
          soldByAgentId: selectedAgent.id,
          soldAt: new Date().toISOString(),
          salePrice: salePrice,
          commission: {
            rate: commissionRate,
            amount: commissionAmount,
            status: 'pending',
            paidAt: undefined,
            paidBy: undefined
          },
          statusHistory: [
            ...(property.statusHistory || []),
            {
              status: newStatus,
              changedBy: admin.id,
              changedByName: admin.name,
              changedAt: new Date().toISOString(),
              reason: `Sold by ${selectedAgent.name} for ₱${salePrice.toLocaleString()} (Commission: ${commissionRate}% = ₱${commissionAmount.toLocaleString()})`
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

  const handleMarkCommissionPaid = async (property: Property) => {
    if (!property.commission || property.commission.status === 'paid') {
      showToast({ type: 'error', message: 'Commission already paid or not available' });
      return;
    }

    const confirmed = await openConfirm({
      title: 'Mark Commission as Paid',
      message: `Mark commission of ₱${property.commission.amount.toLocaleString()} for ${property.title} as paid?`,
      confirmText: 'Mark as Paid',
      cancelText: 'Cancel',
      variant: 'info'
    });
    
    if (!confirmed) return;

    const admin = getUser('admin') || getUser('superadmin') || { id: 'system', name: 'Admin' };

    try {
      const updateData: PropertyUpdateData = {
        commission: {
          ...property.commission,
          status: 'paid',
          paidAt: new Date().toISOString(),
          paidBy: admin.name
        }
      };

      await propertiesAPI.update(property.id, updateData);
      await loadProperties();
      showToast({ type: 'success', message: 'Commission marked as paid successfully!' });
    } catch (error) {
      console.error('Failed to mark commission as paid:', error);
      showToast({ type: 'error', message: 'Failed to update commission status' });
    }
  };

  const handleSetReservation = async (property: Property) => {
    if (property.status !== 'available') {
      showToast({ type: 'error', message: 'Only available properties can be reserved' });
      return;
    }

    const agentId = await openPrompt({
      title: 'Reserve Property',
      message: `Select agent to reserve this property for:`,
      placeholder: `Available agents: ${agents.map(a => `${a.name} (${a.id})`).join(', ')}`
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
              <input
                type="text"
                value={createForm.imageUrl}
                onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                placeholder="https://example.com/property.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
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
            • <strong>Pay Commission:</strong> Mark commission as paid after a successful sale<br/>
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
                      {property.commission && (
                        <p className="text-xs text-gray-500">
                          Commission: ₱{property.commission.amount.toLocaleString()} ({property.commission.rate}%)
                          {' - '}
                          <span className={property.commission.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
                            {property.commission.status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
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
                  {property.commission && property.commission.status === 'pending' && (
                    <button
                      onClick={() => handleMarkCommissionPaid(property)}
                      className="text-green-600 hover:text-green-900 mr-4 font-semibold"
                      title="Mark commission as paid to the agent"
                    >
                      💵 Pay
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
