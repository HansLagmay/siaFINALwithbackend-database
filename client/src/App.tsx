import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerPortal from './pages/CustomerPortal';
import LoginPage from './pages/LoginPage';
import AdminPortal from './pages/AdminPortal';
import AgentPortal from './pages/AgentPortal';
import SuperAdminPortal from './pages/SuperAdminPortal';
import DatabasePortal from './pages/DatabasePortal';
import ProtectedRoute from './components/shared/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<CustomerPortal />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/:role" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent/*"
          element={
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SuperAdminPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/database"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DatabasePortal />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;