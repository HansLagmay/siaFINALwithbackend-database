import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { getSessionsForRole, switchSession, clearSession } from '../../utils/session';

interface SessionSwitcherProps {
  role: User['role'];
  currentUser: User;
  onSessionSwitch?: () => void;
}

const SessionSwitcher: React.FC<SessionSwitcherProps> = ({ role, currentUser, onSessionSwitch }) => {
  const [sessions, setSessions] = useState<Array<{ user: User; token: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [role]);

  const loadSessions = () => {
    const allSessions = getSessionsForRole(role);
    setSessions(allSessions);
  };

  const handleSwitch = (userId: string) => {
    if (switchSession(userId, role)) {
      setIsOpen(false);
      if (onSessionSwitch) {
        onSessionSwitch();
      } else {
        // Reload the page to reflect the new session
        window.location.reload();
      }
    }
  };

  const handleLogout = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    clearSession(role, userId);
    loadSessions();
    
    // If we logged out the current user, reload
    if (userId === currentUser.id) {
      window.location.reload();
    }
  };

  // Only show if there are multiple sessions
  if (sessions.length <= 1) {
    return null;
  }

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600 transition-colors group"
        title="Switch between logged-in accounts"
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span className="text-xs font-medium text-gray-300 truncate">
            {sessions.length} Active Session{sessions.length !== 1 ? 's' : ''}
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown - positioned to appear above or below based on available space */}
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-300 z-50 max-h-[400px] overflow-hidden flex flex-col">
            <div className="px-3 py-2.5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-800">Active Sessions</h3>
              <p className="text-xs text-gray-600 mt-0.5">Click to switch accounts</p>
            </div>
            
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {sessions.map((session) => {
                const isActive = session.user.id === currentUser.id;
                return (
                  <div
                    key={session.user.id}
                    className={`
                      flex items-center justify-between px-3 py-2.5 transition-colors
                      ${isActive 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50 cursor-pointer border-l-4 border-transparent'
                      }
                    `}
                    onClick={() => !isActive && handleSwitch(session.user.id)}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.user.name}
                        </p>
                        {isActive && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate pl-4">{session.user.email}</p>
                    </div>
                    
                    <button
                      onClick={(e) => handleLogout(session.user.id, e)}
                      className="ml-1 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                      title="Logout this session"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
            
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                💡 Open new tabs to log in as different users
              </p>
            </div>
          </div>
        </>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
};

export default SessionSwitcher;
