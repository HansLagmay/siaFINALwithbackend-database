import { useState, useEffect } from 'react';
import { inquiriesAPI } from '../../services/api';
import type { Inquiry, User } from '../../types';
import { getUser } from '../../utils/session';

interface AgentDashboardProps {
  user: User | null;
}

const AgentDashboard = ({ user }: AgentDashboardProps) => {
  const [stats, setStats] = useState({
    totalInquiries: 0,
    pendingInquiries: 0,
    contactedInquiries: 0,
    closedInquiries: 0
  });
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  const [effectiveUser, setEffectiveUser] = useState<User | null>(null);

  useEffect(() => {
    const u = user || getUser();
    setEffectiveUser(u);
  }, [user]);

  useEffect(() => {
    if (effectiveUser) {
      loadDashboardData(effectiveUser);
    } else {
      setLoading(false);
    }
  }, [effectiveUser]);

  const loadDashboardData = async (u: User) => {
    try {
      const response = await inquiriesAPI.getAll();
      const allInquiries = response.data;
      
      const myInquiries = allInquiries.filter((i: Inquiry) => i.assignedTo === u.id);

      setStats({
        totalInquiries: myInquiries.length,
        pendingInquiries: myInquiries.filter((i: Inquiry) => i.status === 'new' || i.status === 'claimed' || i.status === 'assigned').length,
        contactedInquiries: myInquiries.filter((i: Inquiry) => i.status === 'in-progress').length,
        closedInquiries: myInquiries.filter((i: Inquiry) => i.status === 'closed' || i.status === 'successful').length
      });

      setRecentInquiries(
        myInquiries
          .sort((a: Inquiry, b: Inquiry) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      );
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {effectiveUser?.name || 'Agent'}!</h1>
      <p className="text-gray-600 mb-8">Here's your inquiry overview</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Inquiries</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalInquiries}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pendingInquiries}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg">
              <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Contacted</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.contactedInquiries}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Closed</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.closedInquiries}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inquiries */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Recent Inquiries</h2>
        </div>
        <div className="p-6">
          {recentInquiries.length === 0 ? (
            <p className="text-gray-600">No inquiries assigned yet.</p>
          ) : (
            <div className="space-y-4">
              {recentInquiries.map((inquiry) => (
                <div key={inquiry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{inquiry.name}</p>
                    <p className="text-sm text-gray-600">{inquiry.email}</p>
                    <p className="text-sm text-gray-500 mt-1">{inquiry.propertyTitle}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      inquiry.status === 'new' ? 'bg-purple-100 text-purple-800' :
                      inquiry.status === 'claimed' ? 'bg-cyan-100 text-cyan-800' :
                      inquiry.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                      inquiry.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                      inquiry.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      inquiry.status === 'negotiating' ? 'bg-orange-100 text-orange-800' :
                      inquiry.status === 'deal-successful' ? 'bg-green-600 text-white' :
                      inquiry.status === 'deal-cancelled' ? 'bg-red-600 text-white' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {inquiry.status === 'deal-successful' ? '✓ Success' :
                       inquiry.status === 'deal-cancelled' ? '✗ Cancelled' :
                       inquiry.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
