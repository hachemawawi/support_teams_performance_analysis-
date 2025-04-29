import { create } from 'zustand';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { AuthState, LoginData, RegisterData, User } from '../types';
import { API_URL } from '../config';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  initialized: false,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      
      set({
        token,
        user,
        isAuthenticated: true,
        loading: false
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
      throw error;
    }
  },

  register: async (userData: RegisterData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      
      set({
        token,
        user,
        isAuthenticated: true,
        loading: false
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      token: null,
      user: null,
      isAuthenticated: false
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      set({ initialized: true });
      return;
    }
    
    try {
      // Verify token validity
      const decodedToken: any = jwtDecode(token);
      const isExpired = decodedToken.exp * 1000 < Date.now();
      
      if (isExpired) {
        localStorage.removeItem('token');
        set({ 
          token: null,
          user: null,
          isAuthenticated: false,
          initialized: true
        });
        return;
      }
      
      // Get current user data
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({
        token,
        user: response.data,
        isAuthenticated: true,
        initialized: true
      });
    } catch (error) {
      localStorage.removeItem('token');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        initialized: true,
        error: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  }
}));