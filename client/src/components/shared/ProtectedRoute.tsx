import { Navigate } from 'react-router-dom';
import { getSessionForRoles, clearSession } from '../../utils/session';
import type { User } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const hadPriorSession = (): boolean => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('session_user_') || key.startsWith('active_session_'))) {
      return true;
    }
  }
  return false;
};

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const session = getSessionForRoles(allowedRoles as User['role'][]);
  
  if (!session) {
    // Only show session_expired if the user previously had a session
    if (hadPriorSession()) {
      return <Navigate to="/login?session_expired=true" replace />;
    }
    return <Navigate to="/login" replace />;
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
