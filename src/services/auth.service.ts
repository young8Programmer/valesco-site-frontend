import { createApiClient, clearCache } from '../utils/api';
import type { SiteType, AuthResponse } from '../types';

export interface LoginCredentials {
  login?: string;
  username?: string;
  password: string;
}

export const authService = {
  async loginGPG(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[AuthService] Attempting GPG login...');
    const client = createApiClient('gpg');
    try {
      const response = await client.post('/auth/login', {
        login: credentials.login || credentials.username,
        password: credentials.password,
      });
      console.log('[AuthService] GPG login response received:', response.status);
      return response.data;
    } catch (error: any) {
      console.error('[AuthService] GPG login error:', error);
      throw error;
    }
  },

  async loginValesco(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[AuthService] Attempting Valesco login...');
    const client = createApiClient('valesco');
    try {
      const response = await client.post('/auth/login', {
        username: credentials.username || credentials.login,
        password: credentials.password,
      });
      console.log('[AuthService] Valesco login response received:', response.status);
      return response.data;
    } catch (error: any) {
      console.error('[AuthService] Valesco login error:', error);
      throw error;
    }
  },

  async loginParallel(credentials: LoginCredentials): Promise<{ gpg?: AuthResponse; valesco?: AuthResponse }> {
    // Clear cache before login
    clearCache();

    const results: { gpg?: AuthResponse; valesco?: AuthResponse } = {};

    // Try to login to both backends in parallel
    const promises = [
      this.loginGPG(credentials)
        .then(res => {
          console.log('GPG login successful:', res);
          if (res && res.access_token && res.user) {
            return { site: 'gpg' as SiteType, data: res };
          }
          return null;
        })
        .catch((error) => {
          console.error('GPG login failed:', error?.response?.data || error?.message);
          return null;
        }),
      this.loginValesco(credentials)
        .then(res => {
          console.log('Valesco login successful:', res);
          if (res && res.accessToken && res.user) {
            return { site: 'valesco' as SiteType, data: res };
          }
          console.warn('Valesco login response missing required fields:', res);
          return null;
        })
        .catch((error) => {
          console.error('Valesco login failed:', {
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status,
          });
          return null;
        }),
    ];

    try {
      const responses = await Promise.allSettled(promises);
      console.log('All login responses:', responses);

      responses.forEach((response) => {
        if (response.status === 'fulfilled' && response.value) {
          results[response.value.site] = response.value.data;
        } else if (response.status === 'rejected') {
          console.error('Login promise rejected:', response.reason);
        }
      });

      console.log('Final login results:', results);
      return results;
    } catch (error: any) {
      console.error('Login parallel error:', error);
      throw new Error('Tarmoq xatosi. Internet aloqasini tekshiring.');
    }
  },

  logout() {
    clearCache();
    localStorage.removeItem('auth');
    sessionStorage.clear();
  },
};

