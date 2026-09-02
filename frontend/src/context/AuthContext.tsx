import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/constants/api';
import { appStorage } from '../utils/storage';

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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_URL = API_ENDPOINTS.LOGIN;
const TOKEN_STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'auth_user';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore token and user on app startup
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await appStorage.getItem(TOKEN_STORAGE_KEY);
        const savedUserStr = await appStorage.getItem(USER_STORAGE_KEY);
        if (savedToken && savedUserStr) {
          const parsedUser = JSON.parse(savedUserStr);
          setToken(savedToken);
          setUser(parsedUser);
        }
      } catch (e) {
        console.error('Failed to restore auth session:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

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
        const returnedUser = data.user || {};
        const safeUser: User = {
          id: returnedUser.id,
          name: returnedUser.username || 'User',
          username: returnedUser.username || '',
          email: returnedUser.email || email,
          role: returnedUser.role === 'admin' ? 'admin' : 'user',
        };

        setToken(data.token);
        setUser(safeUser);

        // Persist to storage
        await appStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        await appStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser));

        return { ok: true };
      } else {
        return { ok: false, message: data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
      }
    } catch (error) {
      setIsLoading(false);
      return { ok: false, message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' };
    }
  };

  const logout = async () => {
    try {
      await appStorage.removeItem(TOKEN_STORAGE_KEY);
      await appStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.error('Error removing auth from storage:', e);
    } finally {
      setUser(null);
      setToken(null);
    }
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