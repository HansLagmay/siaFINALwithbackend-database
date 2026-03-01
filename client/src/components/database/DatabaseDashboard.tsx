import type { DatabaseOverview } from '../../types';

interface DatabaseDashboardProps {
  overview: DatabaseOverview;
}

export default function DatabaseDashboard({ overview }: DatabaseDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Database Overview</h2>
        <p className="text-gray-600">High-level statistics about all data in the system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Properties Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">🏠 Properties</h3>
            {overview.properties.new > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                {overview.properties.new} New
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-blue-600">{overview.properties.total}</div>
          <p className="text-sm text-gray-600 mt-2">Total Properties</p>
        </div>

        {/* Inquiries Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📝 Inquiries</h3>
            {overview.inquiries.new > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                {overview.inquiries.new} New
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-purple-600">{overview.inquiries.total}</div>
          <p className="text-sm text-gray-600 mt-2">Total Inquiries</p>
          {Object.keys(overview.inquiries.byStatus).length > 0 && (
            <div className="mt-4 text-xs text-gray-600">
              {Object.entries(overview.inquiries.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between py-1">
                  <span className="capitalize">{status}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">👥 Users</h3>
            {overview.users.new > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                {overview.users.new} New
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-green-600">{overview.users.total}</div>
          <p className="text-sm text-gray-600 mt-2">Total Users</p>
          <div className="mt-4 text-xs text-gray-600">
            <div className="flex justify-between py-1">
              <span>Admins:</span>
              <span className="font-semibold">{overview.users.admins}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Agents:</span>
              <span className="font-semibold">{overview.users.agents}</span>
            </div>
          </div>
        </div>

        {/* Calendar Events Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Calendar Events</h3>
          <div className="text-3xl font-bold text-orange-600">{overview.calendar.total}</div>
          <p className="text-sm text-gray-600 mt-2">Total Events</p>
        </div>

        {/* Activity Log Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Activity Log</h3>
          <div className="text-3xl font-bold text-red-600">{overview.activityLog.total}</div>
          <p className="text-sm text-gray-600 mt-2">Total Entries</p>
          <div className="mt-4 text-xs text-gray-600">
            <div className="flex justify-between py-1">
              <span>Last 24 Hours:</span>
              <span className="font-semibold">{overview.activityLog.last24Hours}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Activity */}
      {overview.lastActivity && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🕐 Last Database Activity</h3>
          <div className="space-y-2">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-24 text-sm text-gray-600">Action:</div>
              <div className="flex-1 text-sm font-semibold text-gray-900">{overview.lastActivity.action}</div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-24 text-sm text-gray-600">Details:</div>
              <div className="flex-1 text-sm text-gray-900">{overview.lastActivity.details}</div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-24 text-sm text-gray-600">User:</div>
              <div className="flex-1 text-sm text-gray-900">{overview.lastActivity.user}</div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-24 text-sm text-gray-600">Time:</div>
              <div className="flex-1 text-sm text-gray-900">
                {new Date(overview.lastActivity.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
