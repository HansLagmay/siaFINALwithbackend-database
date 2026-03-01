import { useState, useEffect } from 'react';
import type { User } from '../../types';

interface AgentSelectModalProps {
  isOpen: boolean;
  agents: User[];
  title: string;
  message?: string;
  onSelect: (agentId: string) => void;
  onCancel: () => void;
}

const AgentSelectModal = ({ 
  isOpen, 
  agents, 
  title, 
  message,
  onSelect, 
  onCancel 
}: AgentSelectModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAgents, setFilteredAgents] = useState<User[]>(agents);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  useEffect(() => {
    if (searchTerm) {
      const filtered = agents.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAgents(filtered);
    } else {
      setFilteredAgents(agents);
    }
  }, [searchTerm, agents]);

  const handleSelect = () => {
    if (selectedAgentId) {
      onSelect(selectedAgentId);
      setSearchTerm('');
      setSelectedAgentId('');
    }
  };

  const handleCancel = () => {
    onCancel();
    setSearchTerm('');
    setSelectedAgentId('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {message && (
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          )}
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredAgents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No agents found</p>
          ) : (
            <div className="space-y-2">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAgentId === agent.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedAgentId(agent.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-base font-medium text-gray-900">
                          {agent.name}
                        </h4>
                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {agent.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{agent.email}</p>
                      {agent.phone && (
                        <p className="text-sm text-gray-500">{agent.phone}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">ID: {agent.id}</p>
                    </div>
                    {selectedAgentId === agent.id && (
                      <div className="ml-4">
                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedAgentId}
            className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedAgentId
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Select Agent
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentSelectModal;
