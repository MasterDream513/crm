import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AuthUser } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser, refreshToken?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('crm_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('crm_access_token'));

  const login = useCallback((t: string, u: AuthUser, refreshToken?: string) => {
    localStorage.setItem('crm_access_token', t);
    localStorage.setItem('crm_user', JSON.stringify(u));
    if (refreshToken) localStorage.setItem('crm_refresh_token', refreshToken);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('crm_access_token');
    localStorage.removeItem('crm_refresh_token');
    localStorage.removeItem('crm_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
