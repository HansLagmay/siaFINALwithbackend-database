import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AgentSidebar from '../components/agent/AgentSidebar';
import AgentDashboard from '../components/agent/AgentDashboard';
import AgentInquiries from '../components/agent/AgentInquiries';
import AgentCalendar from '../components/agent/AgentCalendar';
import AgentProperties from '../components/agent/AgentProperties';
import type { User } from '../types';
import { getUser, clearSession } from '../utils/session';
import ErrorBoundary from '../components/shared/ErrorBoundary';

const AgentPortal = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sessionUser = getUser('agent');
    if (sessionUser) {
      setUser(sessionUser);
    }
  }, []);

  const handleLogout = () => {
    clearSession('agent');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AgentSidebar user={user} onLogout={handleLogout} />
      
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/agent/dashboard" replace />} />
          <Route path="/dashboard" element={<AgentDashboard user={user} />} />
          <Route path="/inquiries" element={<AgentInquiries user={user} />} />
          <Route path="/calendar" element={
            <ErrorBoundary title="Calendar failed to load">
              <AgentCalendar user={user} />
            </ErrorBoundary>
          } />
          <Route path="/properties" element={<AgentProperties />} />
        </Routes>
      </div>
    </div>
  );
};

export default AgentPortal;
