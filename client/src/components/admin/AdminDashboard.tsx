import { useState, useEffect } from 'react';
import { propertiesAPI, inquiriesAPI, usersAPI } from '../../services/api';
import type { Inquiry } from '../../types';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalInquiries: 0,
    pendingInquiries: 0,
    totalAgents: 0
  });
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [propertiesRes, inquiriesRes, usersRes] = await Promise.all([
        propertiesAPI.getAll(),
        inquiriesAPI.getAll(),
        usersAPI.getAgents()
      ]);

      const inquiries = inquiriesRes.data;
      const newCount = inquiries.filter((i: Inquiry) => i.status === 'new' || i.status === 'claimed').length;

      setStats({
        totalProperties: propertiesRes.data.length,
        totalInquiries: inquiries.length,
        pendingInquiries: newCount,
        totalAgents: usersRes.data.length
      });

      // Get 5 most recent inquiries
      setRecentInquiries(
        inquiries
          .sort((a: Inquiry, b: Inquiry) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      );
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Properties</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalProperties}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Inquiries</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalInquiries}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Inquiries</p>
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
              <p className="text-gray-600 text-sm">Total Agents</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalAgents}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
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
            <p className="text-gray-600">No inquiries yet.</p>
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

export default AdminDashboard;
