import axios from 'axios';

export function getApiBaseUrl(): string {
  const custom = localStorage.getItem('opsflow_api_url');
  if (custom && custom.trim()) {
    const trimmed = custom.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
  }
  if (import.meta.env.VITE_API_URL) {
    const envUrl = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl}/api/v1`;
  }
  return '/api/v1';
}

export function setApiBaseUrl(url: string) {
  if (!url || !url.trim()) {
    localStorage.removeItem('opsflow_api_url');
  } else {
    let clean = url.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api/v1') && !clean.includes('/api/v1')) {
      clean = `${clean}/api/v1`;
    }
    localStorage.setItem('opsflow_api_url', clean);
  }
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token and dynamic baseURL
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
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
          const res = await axios.post(`${getApiBaseUrl()}/auth/refresh`, { refreshToken });
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

