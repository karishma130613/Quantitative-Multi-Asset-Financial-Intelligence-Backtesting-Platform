import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('quantlab_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    async function loadUser() {
      // Automatic cleanup of any residual test sessions from previous development
      const sessionResetDone = localStorage.getItem('quantlab_session_cleared_v2');
      if (!sessionResetDone) {
        localStorage.removeItem('quantlab_token');
        localStorage.setItem('quantlab_session_cleared_v2', 'true');
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await api.auth.getMe();
        if (userData?.email === 'demo@quantlab.io') {
          localStorage.removeItem('quantlab_token');
          setToken(null);
          setUser(null);
        } else {
          setUser(userData);
        }
      } catch (err) {
        console.warn('Session expired or invalid, clearing token');
        localStorage.removeItem('quantlab_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem('quantlab_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res;
  };

  const signup = async (email, password, fullName) => {
    const res = await api.auth.signup({ email, password, full_name: fullName });
    localStorage.setItem('quantlab_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // Ignore network failure on logout
    }
    localStorage.removeItem('quantlab_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const updated = await api.auth.updateProfile(profileData);
    setUser(prev => ({ ...prev, ...updated }));
    return updated;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
