import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../services/authService';
import API from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('urbaneye_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('urbaneye_token');
    if (token) {
      getMe()
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('urbaneye_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('urbaneye_token');
          localStorage.removeItem('urbaneye_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginApi({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('urbaneye_token', token);
    localStorage.setItem('urbaneye_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await registerApi(data);
    const { token, user } = res.data;
    localStorage.setItem('urbaneye_token', token);
    localStorage.setItem('urbaneye_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  // Login with a pre-issued token (demo quick-login)
  const loginWithToken = useCallback(async (token) => {
    localStorage.setItem('urbaneye_token', token);
    const res = await getMe();
    const user = res.data.user;
    localStorage.setItem('urbaneye_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('urbaneye_token');
    localStorage.removeItem('urbaneye_user');
    setUser(null);
    toast.success('Logged out successfully.');
  }, []);

  const updateUserPoints = useCallback((points) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, points };
      localStorage.setItem('urbaneye_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, register, logout, updateUserPoints }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
