import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, TOKEN_KEY, setUnauthorizedHandler } from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isTeamLead: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        if (res.data.token) localStorage.setItem(TOKEN_KEY, res.data.token);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const res = await api.post('/auth/login', { email, password, remember });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me');
    setUser(res.data.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      isTeamLead: user?.role === 'admin' || user?.memberType === 'team_lead',
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
