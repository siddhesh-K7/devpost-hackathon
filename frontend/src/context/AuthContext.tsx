import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  loginWithGoogle: (googleData: { email: string; name: string; picture?: string; google_id?: string }) => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('paypilot_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('paypilot_token', res.data.access_token);
    setToken(res.data.access_token);
    setUser(res.data.user);
  };

  const register = async (email: string, password: string, fullName: string, phone?: string) => {
    const res = await api.post('/api/auth/register', {
      email,
      password,
      full_name: fullName,
      phone: phone || ''
    });
    localStorage.setItem('paypilot_token', res.data.access_token);
    setToken(res.data.access_token);
    setUser(res.data.user);
  };

  const loginWithGoogle = async (googleData: { email: string; name: string; picture?: string; google_id?: string }) => {
    const res = await api.post('/api/auth/google', googleData);
    localStorage.setItem('paypilot_token', res.data.access_token);
    setToken(res.data.access_token);
    setUser(res.data.user);
  };

  const updateProfile = async (profileData: Partial<User>) => {
    const res = await api.put('/api/auth/profile', profileData);
    setUser(res.data);
  };

  const logout = () => {
    localStorage.removeItem('paypilot_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, loginWithGoogle, updateProfile, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from './useAuth';


