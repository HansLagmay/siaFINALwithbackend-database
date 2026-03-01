import { useState, useEffect } from 'react';
import type { Inquiry, User } from '../../types';
import { inquiriesAPI, usersAPI } from '../../services/api';

interface AgentWorkload {
  agentId: string;
  agentName: string;
  activeInquiries: number;
  totalInquiries: number;
  successfulInquiries: number;
}

interface AssignAgentModalProps {
  inquiry: Inquiry;
  onAssign: () => void;
  onClose: () => void;
}

const AssignAgentModal = ({ inquiry, onAssign, onClose }: AssignAgentModalProps) => {
  const [agents, setAgents] = useState<User[]>([]);
  const [workload, setWorkload] = useState<AgentWorkload[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAgentsAndWorkload();
  }, []);

  const loadAgentsAndWorkload = async () => {
    try {
      const [usersResponse, workloadResponse] = await Promise.all([
        usersAPI.getAll(),
        inquiriesAPI.getAgentWorkload()
      ]);
      
      const agentUsers = usersResponse.data.filter((u: any) => u.role === 'agent');
      setAgents(agentUsers);
      setWorkload(workloadResponse.data);
    } catch (error) {
      console.error('Failed to load agents:', error);
      alert('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgentId) {
      alert('Please select an agent');
      return;
    }

    setSubmitting(true);
    try {
      const selectedAgent = agents.find((a: any) => a.id === selectedAgentId);
      
      await inquiriesAPI.assign(
        inquiry.id,
        selectedAgentId,
        selectedAgent?.name || ''
      );
      
      alert('Inquiry assigned successfully!');
      onAssign();
      onClose();
    } catch (error: any) {
      console.error('Failed to assign agent:', error);
      alert(error.response?.data?.error || 'Failed to assign inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <p className="text-center text-gray-600">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Assign Ticket to Agent</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Inquiry Details */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Ticket: <span className="font-semibold">{inquiry.ticketNumber}</span></p>
            <p className="text-sm text-gray-600">Customer: <span className="font-semibold">{inquiry.name}</span></p>
            <p className="text-sm text-gray-600">Property: <span className="font-semibold">{inquiry.propertyTitle}</span></p>
          </div>

          {/* Agent Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Agent</h3>
            
            {agents.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">No agents available. Please create agent accounts first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {agents.map(agent => {
                  const agentWorkload = workload.find(w => w.agentId === agent.id);
                  const conversionRate = agentWorkload && agentWorkload.totalInquiries > 0
                    ? ((agentWorkload.successfulInquiries / agentWorkload.totalInquiries) * 100).toFixed(1)
                    : '0.0';
                  
                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedAgentId === agent.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              selectedAgentId === agent.id ? 'bg-blue-600' : 'bg-gray-300'
                            }`} />
                            <p className="font-semibold text-gray-800">{agent.name}</p>
                          </div>
                          <p className="text-sm text-gray-600 ml-5">{agent.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-700">
                            Active: {agentWorkload?.activeInquiries || 0} tickets
                          </p>
                          <p className="text-xs text-gray-500">
                            Conversion: {conversionRate}%
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedAgentId || submitting || agents.length === 0}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignAgentModal;
