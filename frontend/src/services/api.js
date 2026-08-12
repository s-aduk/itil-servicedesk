import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Inject token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('sd_refresh');
        const res = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken } = res.data.data;
        localStorage.setItem('sd_token', accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('sd_token');
        localStorage.removeItem('sd_refresh');
        localStorage.removeItem('sd_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
