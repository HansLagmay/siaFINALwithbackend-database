import { useState, useEffect } from 'react';
import { propertiesAPI } from '../../services/api';
import type { Property } from '../../types';
import LoadingSpinner from '../shared/LoadingSpinner';
import { getUser } from '../../utils/session';

const AgentCommissions = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAgentCommissions();
  }, []);

  const fetchAgentCommissions = async () => {
    try {
      setLoading(true);
      const response = await propertiesAPI.getAll();
      
      // Get current user from localStorage
      const user = getUser('agent');
      
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Filter sold properties by this agent with commission info
      const agentSoldProperties = response.data.filter(
        (prop: Property) => 
          prop.status === 'sold' && 
          prop.soldByAgentId === user.id &&
          prop.commission
      );

      setProperties(agentSoldProperties);
      setError('');
    } catch (err) {
      console.error('Error fetching commissions:', err);
      setError('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalCommission = properties.reduce((sum, prop) => 
      sum + (prop.commission?.amount || 0), 0
    );
    const paidCommission = properties
      .filter(prop => prop.commission?.status === 'paid')
      .reduce((sum, prop) => sum + (prop.commission?.amount || 0), 0);
    const pendingCommission = totalCommission - paidCommission;

    return { totalCommission, paidCommission, pendingCommission };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const { totalCommission, paidCommission, pendingCommission } = calculateTotals();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Commissions</h1>
        <p className="text-gray-600 mt-2">Track your commission earnings from sold properties</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-blue-600 text-sm font-medium mb-2">Total Commissions</div>
          <div className="text-3xl font-bold text-blue-900">
            {formatCurrency(totalCommission)}
          </div>
          <div className="text-sm text-blue-600 mt-2">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} sold
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-green-600 text-sm font-medium mb-2">Paid Commissions</div>
          <div className="text-3xl font-bold text-green-900">
            {formatCurrency(paidCommission)}
          </div>
          <div className="text-sm text-green-600 mt-2">
            {properties.filter(p => p.commission?.status === 'paid').length} payments received
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-yellow-600 text-sm font-medium mb-2">Pending Commissions</div>
          <div className="text-3xl font-bold text-yellow-900">
            {formatCurrency(pendingCommission)}
          </div>
          <div className="text-sm text-yellow-600 mt-2">
            {properties.filter(p => p.commission?.status === 'pending').length} payments pending
          </div>
        </div>
      </div>

      {/* Commission Details Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Commission Details</h2>
        </div>

        {properties.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">No commissions yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Commissions will appear here when you sell properties
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sold Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{property.title}</div>
                      <div className="text-sm text-gray-500">{property.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(property.salePrice || property.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.commission?.rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(property.commission?.amount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {property.commission?.status === 'paid' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.soldAt ? formatDate(property.soldAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.commission?.paidAt ? formatDate(property.commission.paidAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentCommissions;
