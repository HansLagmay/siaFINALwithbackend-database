import { useState, useEffect } from 'react';
import { inquiriesAPI } from '../../services/api';
import type { Inquiry } from '../../types';
import AssignAgentModal from './AssignAgentModal';

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    try {
      const response = await inquiriesAPI.getAll();
      setInquiries(response.data);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: Inquiry['status']) => {
    try {
      await inquiriesAPI.update(id, { status: newStatus, updatedAt: new Date().toISOString() });
      await loadInquiries();
    } catch (error) {
      console.error('Failed to update inquiry:', error);
      alert('Failed to update inquiry status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;

    try {
      await inquiriesAPI.delete(id);
      await loadInquiries();
    } catch (error) {
      console.error('Failed to delete inquiry:', error);
      alert('Failed to delete inquiry');
    }
  };

  const openAssignModal = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowAssignModal(true);
  };

  const handleAssignComplete = () => {
    loadInquiries(); // Refresh list after assignment
  };

  const filteredInquiries = filter === 'all' 
    ? inquiries 
    : inquiries.filter(i => i.status === filter);

  if (loading) {
    return <div className="p-8">Loading inquiries...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Inquiries</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            New
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'assigned' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Assigned
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'in-progress' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('viewing-scheduled')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'viewing-scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Viewing Scheduled
          </button>
          <button
            onClick={() => setFilter('successful')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'successful' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Successful
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'closed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Closed
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {filteredInquiries.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No inquiries found.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredInquiries.map((inquiry) => (
              <div key={inquiry.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{inquiry.name}</h3>
                      <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {inquiry.ticketNumber || 'No Ticket'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        inquiry.status === 'new' ? 'bg-purple-100 text-purple-800' :
                        inquiry.status === 'claimed' ? 'bg-cyan-100 text-cyan-800' :
                        inquiry.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        inquiry.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                        inquiry.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        inquiry.status === 'negotiating' ? 'bg-orange-100 text-orange-800' :
                        inquiry.status === 'viewing-scheduled' ? 'bg-indigo-100 text-indigo-800' :
                        inquiry.status === 'viewed-interested' ? 'bg-green-100 text-green-800' :
                        inquiry.status === 'viewed-not-interested' ? 'bg-gray-300 text-gray-800' :
                        inquiry.status === 'deal-successful' ? 'bg-green-600 text-white' :
                        inquiry.status === 'deal-cancelled' ? 'bg-red-600 text-white' :
                        inquiry.status === 'no-response' ? 'bg-gray-400 text-white' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {inquiry.status === 'deal-successful' ? '✓ Deal Successful' :
                         inquiry.status === 'deal-cancelled' ? '✗ Deal Cancelled' :
                         inquiry.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p>📧 {inquiry.email}</p>
                      <p>📱 {inquiry.phone}</p>
                      <p>🏠 <strong>Property:</strong> {inquiry.propertyTitle}</p>
                      {inquiry.assignedTo && (
                        <p>👤 <strong>Assigned to:</strong> Agent ID {inquiry.assignedTo}</p>
                      )}
                      {inquiry.message && <p>💬 <strong>Message:</strong> {inquiry.message}</p>}
                      <p className="text-xs text-gray-500">
                        📅 Created: {new Date(inquiry.createdAt).toLocaleString()}
                      </p>
                      {inquiry.assignedAt && (
                        <p className="text-xs text-gray-500">
                          ✅ Assigned: {new Date(inquiry.assignedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => openAssignModal(inquiry)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          inquiry.assignedTo 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        {inquiry.assignedTo ? '🔄 Reassign Agent' : '➕ Assign Agent'}
                      </button>
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusUpdate(inquiry.id, e.target.value as Inquiry['status'])}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                      >
                        <option value="new">New</option>
                        <option value="claimed">Claimed</option>
                        <option value="assigned">Assigned</option>
                        <option value="contacted">Contacted</option>
                        <option value="in-progress">In Progress</option>
                        <option value="viewing-scheduled">Viewing Scheduled</option>
                        <option value="negotiating">Negotiating</option>
                        <option value="viewed-interested">Viewed - Interested</option>
                        <option value="viewed-not-interested">Viewed - Not Interested</option>
                        <option value="deal-successful">✓ Deal Successful</option>
                        <option value="deal-cancelled">✗ Deal Cancelled</option>
                        <option value="no-response">No Response</option>
                      </select>
                      <button
                        onClick={() => handleDelete(inquiry.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-3"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Agent Modal */}
      {showAssignModal && selectedInquiry && (
        <AssignAgentModal
          inquiry={selectedInquiry}
          onAssign={handleAssignComplete}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedInquiry(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminInquiries;
