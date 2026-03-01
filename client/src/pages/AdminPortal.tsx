import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminProperties from '../components/admin/AdminProperties';
import AdminInquiries from '../components/admin/AdminInquiries';
import AdminAgents from '../components/admin/AdminAgents';
import AdminReports from '../components/admin/AdminReports';
import type { User } from '../types';
import { getUser, clearSession } from '../utils/session';

const AdminPortal = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sessionUser = getUser('admin');
    if (sessionUser) {
      setUser(sessionUser);
    }
  }, []);

  const handleLogout = () => {
    clearSession('admin');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar user={user} onLogout={handleLogout} />
      
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/properties" element={<AdminProperties />} />
          <Route path="/inquiries" element={<AdminInquiries />} />
          <Route path="/agents" element={<AdminAgents />} />
          <Route path="/reports" element={<AdminReports />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPortal;
