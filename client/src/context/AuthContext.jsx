import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('dagi_token');
    return t && t !== 'undefined' && t !== 'null' ? t : null;
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('dagi_user');
      return stored && stored !== 'undefined' && stored !== 'null' ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Sync token & user from localStorage or revalidate profile
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res = await authAPI.getProfile();
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('dagi_user', JSON.stringify(res.data));
          }
        } catch {
          // Token expired or invalid
          setToken(null);
          setUser(null);
          localStorage.removeItem('dagi_token');
          localStorage.removeItem('dagi_user');
        }
      }
      setLoading(false);
    }

    initAuth();

    const handleExpired = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [token]);

  const login = async (username, password) => {
    const res = await authAPI.login(username, password);
    const authData = res.data || res;
    const newToken = authData.token;
    const newUser = authData.user;

    if (!newToken) {
      throw new Error('Authentication failed: No token received.');
    }

    localStorage.setItem('dagi_token', newToken);
    localStorage.setItem('dagi_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('dagi_token');
    localStorage.removeItem('dagi_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData };
      localStorage.setItem('dagi_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
