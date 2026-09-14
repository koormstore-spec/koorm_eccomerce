import axios from 'axios';

// Fully independent from api/axios.js — attaches the admin token, not the
// customer token, and never reads/writes koorm_user.
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

adminApi.interceptors.request.use((config) => {
  const stored = localStorage.getItem('koorm_admin');
  if (stored) {
    const admin = JSON.parse(stored);
    if (admin?.token) {
      config.headers.Authorization = `Bearer ${admin.token}`;
    }
  }
  return config;
});

export default adminApi;
