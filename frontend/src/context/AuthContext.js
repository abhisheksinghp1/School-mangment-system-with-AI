import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [role, setRole]               = useState(null);
  const [token, setToken]             = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuth]  = useState(false);
  const [loading, setLoading]         = useState(true); // true while verifying token
  const [error, setError]             = useState(null);

  // On mount: verify stored token
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    authAPI.getCurrentUser()
      .then((res) => {
        setUser(res.data);
        setRole(res.data.role);
        setIsAuth(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_id');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.login(username, password);
      const { access_token, role: userRole, user_id } = res.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('role', userRole);
      localStorage.setItem('user_id', String(user_id));

      setToken(access_token);
      setRole(userRole);
      setUser({ username, role: userRole, id: user_id });
      setIsAuth(true);

      return userRole; // caller uses this to redirect
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check your credentials.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    setToken(null);
    setUser(null);
    setRole(null);
    setIsAuth(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      user, role, token, isAuthenticated, loading, error,
      login, logout, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
