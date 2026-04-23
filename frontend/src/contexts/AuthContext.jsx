import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selectedCanteenId, setSelectedCanteenId] = useState(localStorage.getItem('selectedCanteenId') || '');
  const [selectedCanteenName, setSelectedCanteenName] = useState(localStorage.getItem('selectedCanteenName') || '');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data.user);
        } catch (err) {
          // Keep session on transient network/server errors; clear only on auth errors.
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = async (email, password, role) => {
    const res = await api.post('/api/auth/login', { email, password, role });
    const { token, user: loggedInUser } = res.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);

    // Clear stale canteen context from previous sessions/users.
    localStorage.removeItem('selectedCanteenId');
    localStorage.removeItem('selectedCanteenName');
    setSelectedCanteenId('');
    setSelectedCanteenName('');

    // Route based on role
    if (loggedInUser.role === 'student' || loggedInUser.role === 'universityStaff') {
      navigate('/dashboard');
    } else if (loggedInUser.role === 'admin' || loggedInUser.role === 'superAdmin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/admin/select-canteen');
    }

    return loggedInUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedCanteenId');
    localStorage.removeItem('selectedCanteenName');
    setUser(null);
    setSelectedCanteenId('');
    setSelectedCanteenName('');
    navigate('/login');
  };

  const setSelectedCanteen = (canteen) => {
    const id = canteen?._id || '';
    const name = canteen?.name || '';
    setSelectedCanteenId(id);
    setSelectedCanteenName(name);
    if (id) localStorage.setItem('selectedCanteenId', id);
    else localStorage.removeItem('selectedCanteenId');
    if (name) localStorage.setItem('selectedCanteenName', name);
    else localStorage.removeItem('selectedCanteenName');
  };

  const clearSelectedCanteen = () => {
    setSelectedCanteenId('');
    setSelectedCanteenName('');
    localStorage.removeItem('selectedCanteenId');
    localStorage.removeItem('selectedCanteenName');
  };

  const isStudent = () => user?.role === 'student';
  const isManager = () => user?.role === 'canteenManager';
  const isSuperAdmin = () => user?.role === 'superAdmin';

  const updateProfile = async (formData) => {
    const res = await api.put('/api/auth/me', formData);
    const updatedUser = res.data.user;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const deleteAccount = async () => {
    await api.delete('/api/auth/me');
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateProfile, deleteAccount, isStudent,
        isManager,
        isSuperAdmin,
        selectedCanteenId,
        selectedCanteenName,
        setSelectedCanteen,
        clearSelectedCanteen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
