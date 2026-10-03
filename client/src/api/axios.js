import axios from 'axios';
import { API_URL } from './config';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('koorm_user');
  if (stored) {
    const user = JSON.parse(stored);
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

export default api;
