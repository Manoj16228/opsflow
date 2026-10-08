import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('opsflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('opsflow_access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      const userData = res.data.data;
      setUser(userData);
      localStorage.setItem('opsflow_user', JSON.stringify(userData));
    } catch (err) {
      setUser(null);
      localStorage.removeItem('opsflow_user');
      localStorage.removeItem('opsflow_access_token');
      localStorage.removeItem('opsflow_refresh_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, tokens } = res.data.data;

    localStorage.setItem('opsflow_access_token', tokens.accessToken);
    localStorage.setItem('opsflow_refresh_token', tokens.refreshToken);
    localStorage.setItem('opsflow_user', JSON.stringify(loggedInUser));

    setUser(loggedInUser);
  };

  const register = async (payload: any) => {
    const res = await api.post('/auth/register', payload);
    const { user: registeredUser, tokens } = res.data.data;

    localStorage.setItem('opsflow_access_token', tokens.accessToken);
    localStorage.setItem('opsflow_refresh_token', tokens.refreshToken);
    localStorage.setItem('opsflow_user', JSON.stringify(registeredUser));

    setUser(registeredUser);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('opsflow_refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('opsflow_access_token');
      localStorage.removeItem('opsflow_refresh_token');
      localStorage.removeItem('opsflow_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
