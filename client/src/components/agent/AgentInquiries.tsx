import { useState, useEffect } from 'react';
import { inquiriesAPI } from '../../services/api';
import type { Inquiry, User } from '../../types';

interface AgentInquiriesProps {
  user: User | null;
}

const AgentInquiries = ({ user }: AgentInquiriesProps) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    loadInquiries();
  }, [user]);

  const loadInquiries = async () => {
    try {
      const response = await inquiriesAPI.getAll();
      
      if (!user) {
        setInquiries([]);
        return;
      }
      
      // Show assigned tickets + all unassigned tickets (available to claim)
      const myInquiries = response.data.filter((inquiry: any) => {
        // Show if assigned to me
        if (inquiry.assignedTo === user.id) return true;
        
        // Show if unassigned (available for any agent to claim)
        if (!inquiry.assignedTo) return true;
        
        // Hide tickets assigned to other agents
        return false;
      });
      
      setInquiries(myInquiries);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTicket = async (inquiry: Inquiry) => {
    if (!user) return;
    
    if (!confirm('Claim this ticket? It will be assigned to you.')) return;
    
    setClaimingId(inquiry.id);
    try {
      await inquiriesAPI.claim(inquiry.id);
      alert('Ticket claimed successfully!');
      await loadInquiries();
    } catch (error: any) {
      console.error('Failed to claim ticket:', error);
      alert(error.response?.data?.error || 'Failed to claim ticket. It may have been claimed by another agent.');
    } finally {
      setClaimingId(null);
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

  // Separate inquiries into assigned and available
  const assignedInquiries = inquiries.filter(i => i.assignedTo === user?.id);
  const availableInquiries = inquiries.filter(i => !i.assignedTo);
  
  const filteredAssignedInquiries = filter === 'all' 
    ? assignedInquiries 
    : assignedInquiries.filter(i => i.status === filter);

  if (loading) {
    return <div className="p-8">Loading inquiries...</div>;
  }

  return (
    <div className="p-8">
      {/* Available Tickets Section */}
      {availableInquiries.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🆕 Available Tickets (Unassigned)</h2>
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {availableInquiries.map((inquiry) => (
                <div key={inquiry.id} className="p-6 hover:bg-gray-50 border-l-4 border-green-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{inquiry.name}</h3>
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {inquiry.ticketNumber || 'No Ticket'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Available to Claim
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <p>📧 <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">{inquiry.email}</a></p>
                        <p>📱 <a href={`tel:${inquiry.phone}`} className="text-blue-600 hover:underline">{inquiry.phone}</a></p>
                        <p>🏠 <strong>Property:</strong> {inquiry.propertyTitle}</p>
                        {inquiry.message && <p>💬 <strong>Message:</strong> {inquiry.message}</p>}
                        <p className="text-xs text-gray-500">
                          📅 {new Date(inquiry.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleClaimTicket(inquiry)}
                        disabled={claimingId === inquiry.id}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold disabled:bg-green-300"
                      >
                        {claimingId === inquiry.id ? '⏳ Claiming...' : '✋ Claim This Ticket'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* My Assigned Tickets Section */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Assigned Tickets</h1>
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
            onClick={() => setFilter('claimed')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'claimed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Claimed
          </button>
          <button
            onClick={() => setFilter('contacted')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'contacted' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Contacted
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
            onClick={() => setFilter('negotiating')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'negotiating' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Negotiating
          </button>
          <button
            onClick={() => setFilter('deal-successful')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'deal-successful' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            ✓ Deal Successful
          </button>
          <button
            onClick={() => setFilter('deal-cancelled')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'deal-cancelled' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            ✗ Deal Cancelled
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {filteredAssignedInquiries.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            {assignedInquiries.length === 0 
              ? "No tickets assigned to you yet. Check available tickets above to claim one!"
              : "No inquiries match the selected filter."}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAssignedInquiries.map((inquiry) => (
              <div key={inquiry.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{inquiry.name}</h3>
                      <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {inquiry.ticketNumber || 'No Ticket'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        inquiry.status === 'claimed' ? 'bg-cyan-100 text-cyan-800' :
                        inquiry.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        inquiry.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                        inquiry.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        inquiry.status === 'negotiating' ? 'bg-orange-100 text-orange-800' :
                        inquiry.status === 'viewing-scheduled' ? 'bg-indigo-100 text-indigo-800' :
                        inquiry.status === 'viewed-interested' ? 'bg-green-100 text-green-800' :
                        inquiry.status === 'viewed-not-interested' ? 'bg-gray-100 text-gray-800' :
                        inquiry.status === 'deal-successful' ? 'bg-green-600 text-white' :
                        inquiry.status === 'deal-cancelled' ? 'bg-red-600 text-white' :
                        inquiry.status === 'no-response' ? 'bg-gray-400 text-white' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {inquiry.status === 'deal-successful' ? '✓ Deal Successful' :
                         inquiry.status === 'deal-cancelled' ? '✗ Deal Cancelled' :
                         inquiry.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                      {inquiry.claimedBy === user?.id && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-50 text-green-700">
                          Self-Claimed
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p>📧 <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">{inquiry.email}</a></p>
                      <p>📱 <a href={`tel:${inquiry.phone}`} className="text-blue-600 hover:underline">{inquiry.phone}</a></p>
                      <p>🏠 <strong>Property:</strong> {inquiry.propertyTitle}</p>
                      {inquiry.message && <p>💬 <strong>Message:</strong> {inquiry.message}</p>}
                      <p className="text-xs text-gray-500">
                        📅 Created: {new Date(inquiry.createdAt).toLocaleString()}
                      </p>
                      {inquiry.claimedAt && (
                        <p className="text-xs text-gray-500">
                          ✋ Claimed: {new Date(inquiry.claimedAt).toLocaleString()}
                        </p>
                      )}
                      {inquiry.assignedAt && (
                        <p className="text-xs text-gray-500">
                          ✅ Assigned: {new Date(inquiry.assignedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusUpdate(inquiry.id, e.target.value as Inquiry['status'])}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                      >
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
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentInquiries;
