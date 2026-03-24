import axios from 'axios';

import { getBackendUrl } from '../utils/config';

const api = axios.create({
  baseURL: getBackendUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Bypass Dev Tunnel Anti-Phishing warning page
  config.headers['X-Tunnel-Skip-AntiPhishing-Page'] = 'true';
  return config;
});

export default api;

