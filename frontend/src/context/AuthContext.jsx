import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLogout } from '../services/auth.service.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('erms_user')); } catch { return null; }
  });
  const [role, setRole] = useState(() => localStorage.getItem('erms_role'));

  // Call after a successful apiLogin() / apiVerifyEmail() — api.js already
  // wrote the token to localStorage, so we just sync React state.
  const syncSession = useCallback(() => {
    try {
      const u = JSON.parse(localStorage.getItem('erms_user'));
      setUser(u);
      setRole(u?.role ?? null);
    } catch {
      setUser(null);
      setRole(null);
    }
  }, []);

  const logout = useCallback(() => {
    // Clear React state synchronously
    setUser(null);
    setRole(null);
    // Clear localStorage — GuestRoute checks this directly, no race condition
    try {
      localStorage.removeItem('erms_user');
      localStorage.removeItem('erms_role');
      localStorage.removeItem('erms_token');
    } catch { /* ignore */ }
    // Fire-and-forget API call to blacklist token
    apiLogout().catch(() => {});
    // React Router navigate — no full page reload, no CSS overlap issues
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, role, syncSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
