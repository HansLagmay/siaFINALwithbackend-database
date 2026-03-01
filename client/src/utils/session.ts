import type { User } from '../types';

export interface Session {
  user: User;
  token: string;
  expiresAt: number;
}

// Store active session ID for each role
const ACTIVE_SESSION_KEYS: Record<User['role'], string> = {
  admin: 'active_session_admin',
  agent: 'active_session_agent',
  superadmin: 'active_session_superadmin'
};

// Legacy session keys for backward compatibility
const LEGACY_SESSION_KEYS: Record<User['role'], string> = {
  admin: 'session_admin',
  agent: 'session_agent',
  superadmin: 'session_superadmin'
};

const getRoleFromPath = (): User['role'] | null => {
  const p = typeof window !== 'undefined' ? window.location.pathname : '';
  if (p.startsWith('/agent')) return 'agent';
  if (p.startsWith('/admin') || p.startsWith('/database')) return 'admin';
  if (p.startsWith('/superadmin')) return 'superadmin';
  return null;
};

// Get session key for a specific user
const getSessionKey = (userId: string): string => `session_user_${userId}`;

// Get or set active session ID for a role (using sessionStorage for tab-specific sessions)
const getActiveSessionId = (role: User['role']): string | null => {
  // First check sessionStorage (tab-specific)
  const tabSession = sessionStorage.getItem(ACTIVE_SESSION_KEYS[role]);
  if (tabSession) return tabSession;
  
  // Fall back to localStorage for backward compatibility
  return localStorage.getItem(ACTIVE_SESSION_KEYS[role]);
};

const setActiveSessionId = (role: User['role'], userId: string): void => {
  // Store in sessionStorage for tab-specific sessions
  sessionStorage.setItem(ACTIVE_SESSION_KEYS[role], userId);
  // Also store in localStorage as a fallback
  localStorage.setItem(ACTIVE_SESSION_KEYS[role], userId);
};

// Read a specific user's session
const readUserSession = (userId: string): Session | null => {
  const sessionStr = localStorage.getItem(getSessionKey(userId));
  if (!sessionStr) return null;
  try {
    const session: Session = JSON.parse(sessionStr);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(getSessionKey(userId));
      return null;
    }
    return session;
  } catch (error) {
    console.error('Error parsing session:', error);
    localStorage.removeItem(getSessionKey(userId));
    return null;
  }
};

// Get all active sessions for a role
const getAllSessionsForRole = (role: User['role']): Session[] => {
  const sessions: Session[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('session_user_')) {
      const sessionStr = localStorage.getItem(key);
      if (sessionStr) {
        try {
          const session: Session = JSON.parse(sessionStr);
          if (session.user.role === role && Date.now() <= session.expiresAt) {
            sessions.push(session);
          }
        } catch (error) {
          console.error('Error parsing session:', error);
        }
      }
    }
  }
  return sessions;
};

// Migrate legacy session to new format
const migrateLegacySession = (role: User['role']): Session | null => {
  const legacyKey = LEGACY_SESSION_KEYS[role];
  const sessionStr = localStorage.getItem(legacyKey);
  if (!sessionStr) return null;
  
  try {
    const session: Session = JSON.parse(sessionStr);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(legacyKey);
      return null;
    }
    // Migrate to new format
    localStorage.setItem(getSessionKey(session.user.id), JSON.stringify(session));
    setActiveSessionId(role, session.user.id);
    localStorage.removeItem(legacyKey);
    return session;
  } catch (error) {
    console.error('Error migrating legacy session:', error);
    localStorage.removeItem(legacyKey);
    return null;
  }
};

const readLegacySession = (): Session | null => {
  const sessionStr = localStorage.getItem('session');
  if (!sessionStr) return null;
  try {
    const session: Session = JSON.parse(sessionStr);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem('session');
      return null;
    }
    // Migrate to new format
    localStorage.setItem(getSessionKey(session.user.id), JSON.stringify(session));
    setActiveSessionId(session.user.role, session.user.id);
    localStorage.removeItem('session');
    return session;
  } catch (error) {
    console.error('Error parsing session:', error);
    localStorage.removeItem('session');
    return null;
  }
};

const rolesForPath = (): User['role'][] => {
  const role = getRoleFromPath();
  if (role === 'superadmin') return ['superadmin', 'admin'];
  if (role === 'admin') return ['admin'];
  if (role === 'agent') return ['agent'];
  return [];
};

export const setSession = (user: User, token: string): void => {
  const session: Session = {
    user,
    token,
    expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
  };
  // Store session with user ID as key
  localStorage.setItem(getSessionKey(user.id), JSON.stringify(session));
  // Set this as the active session for this role
  setActiveSessionId(user.role, user.id);
};

export const getSession = (role?: User['role']): Session | null => {
  if (role) {
    // Try to get active session for this role
    const activeSessionId = getActiveSessionId(role);
    if (activeSessionId) {
      const session = readUserSession(activeSessionId);
      if (session) return session;
    }
    // Try to migrate legacy session
    const legacy = migrateLegacySession(role);
    if (legacy) return legacy;
    // Get any available session for this role
    const sessions = getAllSessionsForRole(role);
    if (sessions.length > 0) {
      setActiveSessionId(role, sessions[0].user.id);
      return sessions[0];
    }
    return null;
  }
  
  const candidates = rolesForPath();
  for (const r of candidates) {
    const session = getSession(r);
    if (session) return session;
  }
  
  const legacy = readLegacySession();
  if (legacy) return legacy;
  
  return null;
};

export const getSessionForRoles = (roles: User['role'][]): Session | null => {
  for (const r of roles) {
    const session = getSession(r);
    if (session) return session;
  }
  return null;
};

export const clearSession = (role?: User['role'], userId?: string): void => {
  if (userId) {
    // Clear specific user session
    localStorage.removeItem(getSessionKey(userId));
    // If this was the active session, clear the active session ID
    if (role) {
      const activeId = getActiveSessionId(role);
      if (activeId === userId) {
        sessionStorage.removeItem(ACTIVE_SESSION_KEYS[role]);
        localStorage.removeItem(ACTIVE_SESSION_KEYS[role]);
        // Set another session as active if available
        const sessions = getAllSessionsForRole(role);
        if (sessions.length > 0 && sessions[0].user.id !== userId) {
          setActiveSessionId(role, sessions[0].user.id);
        }
      }
    }
  } else if (role) {
    // Clear active session for role in this tab
    const activeId = getActiveSessionId(role);
    if (activeId) {
      localStorage.removeItem(getSessionKey(activeId));
      sessionStorage.removeItem(ACTIVE_SESSION_KEYS[role]);
      localStorage.removeItem(ACTIVE_SESSION_KEYS[role]);
    }
  } else {
    // Clear current active session
    const resolvedRole = rolesForPath()[0];
    if (resolvedRole) {
      clearSession(resolvedRole);
    }
  }
  localStorage.removeItem('user');
};

export const isSessionValid = (role?: User['role']): boolean => {
  return getSession(role) !== null;
};

export const getToken = (role?: User['role']): string | null => {
  const session = getSession(role);
  return session ? session.token : null;
};

export const getUser = (role?: User['role']): Session['user'] | null => {
  const session = getSession(role);
  return session ? session.user : null;
};
// New functions for multi-session support

/**
 * Switch to a different user session for the same role
 */
export const switchSession = (userId: string, role: User['role']): boolean => {
  const session = readUserSession(userId);
  if (session && session.user.role === role) {
    setActiveSessionId(role, userId);
    return true;
  }
  return false;
};

/**
 * Get all active sessions for a specific role
 */
export const getSessionsForRole = (role: User['role']): Session[] => {
  return getAllSessionsForRole(role);
};

/**
 * Get the currently active session ID for a role
 */
export const getActiveSession = (role: User['role']): Session | null => {
  const activeId = getActiveSessionId(role);
  if (activeId) {
    return readUserSession(activeId);
  }
  return null;
};

/**
 * Clear all sessions for a specific role
 */
export const clearAllSessionsForRole = (role: User['role']): void => {
  const sessions = getAllSessionsForRole(role);
  sessions.forEach(session => {
    localStorage.removeItem(getSessionKey(session.user.id));
  });
  sessionStorage.removeItem(ACTIVE_SESSION_KEYS[role]);
  localStorage.removeItem(ACTIVE_SESSION_KEYS[role]);
};