import { createContext, useContext, useState } from 'react';
import adminApi from '../api/adminAxios';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('koorm_admin');
    return stored ? JSON.parse(stored) : null;
  });

  const adminLogin = async (email, password) => {
    const { data } = await adminApi.post('/admin/auth/login', { email, password });
    localStorage.setItem('koorm_admin', JSON.stringify(data));
    setAdmin(data);
    return data;
  };

  const adminLogout = () => {
    localStorage.removeItem('koorm_admin');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
