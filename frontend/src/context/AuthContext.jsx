import { createContext, useContext, useState, useCallback } from 'react';
import { apiLogout } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
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

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setRole(null);
  }, []);

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
