import { NavLink, useNavigate } from 'react-router-dom';
import type { User } from '../../types';
import SessionSwitcher from '../shared/SessionSwitcher';

interface AdminSidebarProps {
  user: User | null;
  onLogout: () => void;
}

const AdminSidebar = ({ user, onLogout }: AdminSidebarProps) => {
  const navigate = useNavigate();

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">TES Property</h1>
        <p className="text-sm text-gray-400 mt-1">Admin Portal</p>
      </div>

      {user && (
        <div className="p-4 border-b border-gray-700 space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Logged in as</p>
            <p className="font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          
          {/* Session Switcher for multi-account demo */}
          <SessionSwitcher role="admin" currentUser={user} />
        </div>
      )}

      <nav className="flex-1 p-4">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/inquiries"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Inquiries
        </NavLink>

        <NavLink
          to="/admin/properties"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Properties
        </NavLink>

        <NavLink
          to="/admin/agents"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Agents
        </NavLink>

        <NavLink
          to="/admin/reports"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg mb-2 transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          Agent Performance
        </NavLink>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => navigate('/superadmin')}
            className="flex items-center px-4 py-3 rounded-lg mb-2 text-gray-300 hover:bg-gray-700 transition w-full"
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            HR Portal →
          </button>
          
          <button
            onClick={() => navigate('/database')}
            className="flex items-center px-4 py-3 rounded-lg mb-2 text-gray-300 hover:bg-gray-700 transition w-full"
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
              <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
              <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
            </svg>
            Database Portal 🗄️
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="flex items-center px-4 py-3 rounded-lg text-red-400 hover:bg-gray-700 transition w-full"
        >
          <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
