import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { databaseAPI } from '../services/api';
import DatabaseDashboard from '../components/database/DatabaseDashboard';
import PropertiesSection from '../components/database/PropertiesSection';
import InquiriesSection from '../components/database/InquiriesSection';
import UsersSection from '../components/database/UsersSection';
import CalendarSection from '../components/database/CalendarSection';
import ActivityLogViewer from '../components/database/ActivityLogViewer';
import type { DatabaseOverview } from '../types';

export default function DatabasePortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [overview, setOverview] = useState<DatabaseOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await databaseAPI.getOverview();
      setOverview(response.data);
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'properties', label: 'Properties', icon: '🏠' },
    { id: 'inquiries', label: 'Inquiries', icon: '📝' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'activity-log', label: 'Activity Log', icon: '📋' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🗄️ TES Property Database Manager
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Visual interface for JSON file storage (phpMyAdmin-style)
              </p>
            </div>
            <Link 
              to="/admin" 
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading database overview...</p>
          </div>
        ) : overview ? (
          <>
            {activeTab === 'dashboard' && <DatabaseDashboard overview={overview} />}
            {activeTab === 'properties' && <PropertiesSection />}
            {activeTab === 'inquiries' && <InquiriesSection />}
            {activeTab === 'users' && <UsersSection />}
            {activeTab === 'calendar' && <CalendarSection />}
            {activeTab === 'activity-log' && <ActivityLogViewer />}
          </>
        ) : (
          <div className="text-center py-12 text-red-600">
            Failed to load database overview
          </div>
        )}
      </main>
    </div>
  );
}
