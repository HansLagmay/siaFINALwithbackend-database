import { Navigate } from 'react-router-dom';
import { getSessionForRoles, clearSession } from '../../utils/session';
import type { User } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const session = getSessionForRoles(allowedRoles as User['role'][]);
  
  if (!session) {
    // Session expired or not logged in
    return <Navigate to="/login?session_expired=true" replace />;
  }

  const user = session.user;
  
  if (!allowedRoles.includes(user.role)) {
    // Wrong role - redirect to appropriate dashboard or login
    clearSession(user.role);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
