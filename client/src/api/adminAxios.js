import axios from 'axios';
import { API_URL } from './config';

// Fully independent from api/axios.js — attaches the admin token, not the
// customer token, and never reads/writes koorm_user.
const adminApi = axios.create({
  baseURL: API_URL,
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
