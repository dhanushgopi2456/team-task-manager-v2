import axios from 'axios';

export const TOKEN_KEY = 'ttm_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && !String(err.config?.url || '').includes('/auth/')) {
      localStorage.removeItem(TOKEN_KEY);
      onUnauthorized?.();
    }
    return Promise.reject(err);
  }
);

export function apiError(err: any, fallback = 'Something went wrong'): string {
  return err?.response?.data?.message || err?.message || fallback;
}
