import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthState } from '../types';
import { authService, LoginCredentials } from '../services/auth.service';

interface AuthContextType {
  auth: AuthState | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load auth from localStorage
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        setAuth(parsed);
      } catch (e) {
        localStorage.removeItem('auth');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      console.log('Starting login...', { username: credentials.username || credentials.login, password: '***' });
      
      // Clear ALL cache and storage before login
      localStorage.clear();
      sessionStorage.clear();

      // Add timeout wrapper
      const loginPromise = authService.loginParallel(credentials);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Vaqt tugadi. Qayta urinib ko\'ring.')), 30000);
      });

      const results = await Promise.race([loginPromise, timeoutPromise]);
      console.log('Login results:', results);

      // Determine which site to use
      let selectedAuth: AuthState | null = null;

      if (results.gpg && results.gpg.access_token && results.gpg.user) {
        selectedAuth = {
          site: 'gpg',
          token: results.gpg.access_token,
          user: results.gpg.user,
        };
        console.log('Selected GPG auth:', selectedAuth);
      } else if (results.valesco && results.valesco.accessToken && results.valesco.user) {
        selectedAuth = {
          site: 'valesco',
          token: results.valesco.accessToken,
          user: results.valesco.user,
        };
        console.log('Selected Valesco auth:', selectedAuth);
      }

      if (!selectedAuth || !selectedAuth.token) {
        console.error('No valid auth result from either site', results);
        setLoading(false);
        throw new Error('Login yoki parol noto\'g\'ri');
      }

      // Save to localStorage
      localStorage.setItem('auth', JSON.stringify(selectedAuth));
      console.log('Auth saved to localStorage:', selectedAuth);
      
      // Update state
      setAuth(selectedAuth);
      console.log('Auth state updated');
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      setLoading(false);
    } catch (error: any) {
      console.error('Login error:', error);
      setLoading(false);
      // Re-throw with better error message
      const errorMessage = error?.message || error?.response?.data?.message || 'Login yoki parol noto\'g\'ri';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    authService.logout();
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

