import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
});

// Attach Bearer token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aspo_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('aspo_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
