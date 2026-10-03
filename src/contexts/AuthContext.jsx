import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownerTestDate, setOwnerTestDate] = useState('');
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    apiFetch('/api/auth/me')
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch((error) => {
        console.error('Could not restore the current session:', error.message);
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const login = async (username, password) => {
    const { user: authenticatedUser } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setUser(authenticatedUser);
    setOwnerTestDate('');
    return authenticatedUser;
  };

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setOwnerTestDate('');
  };

  const updateOwnerTestDate = (date) => {
    if (user?.role === 'OWNER') setOwnerTestDate(date);
  };

  const value = useMemo(() => ({
    user,
    loading,
    clock,
    login,
    logout,
    ownerTestDate: user?.role === 'OWNER' ? ownerTestDate : '',
    setOwnerTestDate: updateOwnerTestDate,
  }), [user, loading, ownerTestDate, clock]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
