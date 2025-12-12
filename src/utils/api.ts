import axios, { AxiosInstance } from 'axios';
import type { SiteType } from '../types';

const API_BASE_URLS: Record<SiteType, string> = {
  gpg: 'https://gpg-backend-vgrz.onrender.com',
  valesco: 'https://backend.valescooil.com',
};

export const createApiClient = (site: SiteType, token?: string): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URLS[site],
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds timeout
  });

  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      console.log(`[API ${site.toUpperCase()}] Request:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        hasToken: !!token,
      });
      return config;
    },
    (error) => {
      console.error(`[API ${site.toUpperCase()}] Request error:`, error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for logging and error handling
  client.interceptors.response.use(
    (response) => {
      console.log(`[API ${site.toUpperCase()}] Response:`, {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
      return response;
    },
    (error) => {
      console.error(`[API ${site.toUpperCase()}] Response error:`, {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
        responseData: error.response?.data,
        isNetworkError: !error.response,
        isTimeout: error.code === 'ECONNABORTED',
      });

      // Handle network errors
      if (!error.response) {
        if (error.code === 'ECONNABORTED') {
          console.error(`[API ${site.toUpperCase()}] Request timeout`);
          error.message = 'Vaqt tugadi. Qayta urinib ko\'ring.';
        } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
          console.error(`[API ${site.toUpperCase()}] Network error - CORS or connection issue`);
          error.message = 'Tarmoq xatosi. Internet aloqasini tekshiring.';
        } else {
          error.message = error.message || 'Tarmoq xatosi.';
        }
      }

      // Don't redirect on 401 during login attempts
      if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
        // Clear auth on 401 (but not during login)
        localStorage.removeItem('auth');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const clearCache = () => {
  // Clear all localStorage except auth
  const auth = localStorage.getItem('auth');
  localStorage.clear();
  if (auth) {
    localStorage.setItem('auth', auth);
  }
  // Clear sessionStorage
  sessionStorage.clear();
};

