import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('opsflow_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Auto-Refresh Expired Access Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('opsflow_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;

          localStorage.setItem('opsflow_access_token', accessToken);
          localStorage.setItem('opsflow_refresh_token', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('opsflow_access_token');
          localStorage.removeItem('opsflow_refresh_token');
          localStorage.removeItem('opsflow_user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('opsflow_access_token');
        localStorage.removeItem('opsflow_refresh_token');
        localStorage.removeItem('opsflow_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
