import { useState, useEffect } from 'react';
import { activityLogAPI, inquiriesAPI, propertiesAPI, usersAPI } from '../../services/api';
import type { ActivityLog, Inquiry, Property, User } from '../../types';

interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalInquiries: number;
  activeInquiries: number;
  successfulInquiries: number;
  conversionRate: number;
  propertiesSold: number;
  totalSalesValue: number;
}

const AdminReports = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    loadActivityLogs();
  }, [page]);

  const loadActivityLogs = async () => {
    try {
      const response = await activityLogAPI.getAll(page, 20);
      setLogs(response.data.logs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgentMetrics = async () => {
    setLoading(true);
    try {
      const [usersRes, inquiriesRes, propertiesRes] = await Promise.all([
        usersAPI.getAll(),
        inquiriesAPI.getAll(),
        propertiesAPI.getAll()
      ]);
      
      const agents = usersRes.data.filter((u: User) => u.role === 'agent');
      const inquiries = inquiriesRes.data;
      const properties = propertiesRes.data;
      
      const metrics = agents.map((agent: User) => {
        const agentInquiries = inquiries.filter((i: Inquiry) => i.assignedTo === agent.id);
        const totalInquiries = agentInquiries.length;
        const activeInquiries = agentInquiries.filter((i: Inquiry) => 
          i.status !== 'closed' && i.status !== 'cancelled'
        ).length;
        const successfulInquiries = agentInquiries.filter((i: Inquiry) => i.status === 'successful').length;
        const conversionRate = totalInquiries > 0 ? (successfulInquiries / totalInquiries) * 100 : 0;
        
        const soldProperties = properties.filter((p: Property) => p.soldByAgentId === agent.id);
        const totalSalesValue = soldProperties.reduce((sum: number, p: Property) => sum + (p.salePrice || p.price), 0);
        
        return {
          agentId: agent.id,
          agentName: agent.name,
          totalInquiries,
          activeInquiries,
          successfulInquiries,
          conversionRate,
          propertiesSold: soldProperties.length,
          totalSalesValue
        };
      });
      
      setAgentMetrics(metrics);
      setShowMetrics(true);
    } catch (error) {
      console.error('Failed to load agent metrics:', error);
      alert('Failed to load agent metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading reports...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowMetrics(false);
              loadActivityLogs();
            }}
            className={`px-6 py-2 rounded-lg font-semibold ${
              !showMetrics ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Activity Logs
          </button>
          <button
            onClick={loadAgentMetrics}
            className={`px-6 py-2 rounded-lg font-semibold ${
              showMetrics ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Agent Performance
          </button>
        </div>
      </div>

      {showMetrics ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {agentMetrics.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No agent metrics available.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Inquiries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Successful
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Properties Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentMetrics.map((metric) => (
                  <tr key={metric.agentId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.agentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.totalInquiries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.activeInquiries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.successfulInquiries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        metric.conversionRate >= 50 ? 'bg-green-100 text-green-800' :
                        metric.conversionRate >= 30 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {metric.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.propertiesSold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₱{metric.totalSalesValue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No activity logs found.
            </div>
          ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        log.action.includes('CREATE') ? 'bg-green-100 text-green-800' :
                        log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-800' :
                        log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                        log.action.includes('LOGIN') ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
