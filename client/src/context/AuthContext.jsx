import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../utils/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const data = await api.getMe();
          setUser(data.user);
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          setAuthToken(null);
          setUser(null);
        }
      } else {
        // Default auto-login to Arjun N (student demo) for effortless out-of-the-box review
        try {
          await switchDemoUser('1RUA24SCS0012');
        } catch (e) {
          // Ignore
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    setAuthError(null);
    try {
      const data = await api.login({ identifier, password });
      setAuthToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const data = await api.register(userData);
      setAuthToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  // 1-Click Demo Switcher for Evaluation
  const switchDemoUser = async (identifier) => {
    try {
      const data = await api.login({ identifier, password: 'password123' });
      setAuthToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('Demo switch failed:', err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isAuthenticated: !!user,
        role: user?.role || 'guest',
        login,
        register,
        logout,
        switchDemoUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
