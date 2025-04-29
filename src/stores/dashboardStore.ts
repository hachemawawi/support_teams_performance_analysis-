import { create } from 'zustand';
import axios from 'axios';
import { DashboardStats } from '../types';
import { API_URL } from '../config';

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  
  fetchDashboardStats: () => Promise<void>;
  fetchUserDashboardStats: (userId: number) => Promise<void>;
}

const initialStats: DashboardStats = {
  totalRequests: 0,
  openRequests: 0,
  resolvedRequests: 0,
  avgResponseTime: 0,
  requestsByStatus: {
    new: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0
  },
  requestsByDepartment: {
    it: 0,
    hr: 0,
    finance: 0,
    operations: 0,
    customer_service: 0
  },
  requestsByPriority: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  },
  recentRequests: []
};

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  loading: false,
  error: null,

  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ stats: response.data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
      });
    }
  },

  fetchUserDashboardStats: async (userId: number) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/dashboard/users/${userId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ stats: response.data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user dashboard stats'
      });
    }
  }
}));