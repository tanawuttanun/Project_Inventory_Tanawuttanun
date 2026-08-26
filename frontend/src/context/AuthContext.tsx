import React, { createContext, useContext, useState } from 'react';
import { API_ENDPOINTS } from '@/constants/api';

export interface User {
  id: number | string;
  name: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_URL = API_ENDPOINTS.LOGIN;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });
      
      const data = await response.json();
      setIsLoading(false);
      
      if (response.ok) {
        setToken(data.token);
        const returnedUser = data.user || {};
        const safeUser: User = {
          id: returnedUser.id,
          name: returnedUser.username || 'User',
          username: returnedUser.username || '',
          email: returnedUser.email || email,
          role: returnedUser.role === 'admin' ? 'admin' : 'user',
        };
        setUser(safeUser);
        return { ok: true };
      } else {
        return { ok: false, message: data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
      }
    } catch (error) {
      setIsLoading(false);
      return { ok: false, message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};