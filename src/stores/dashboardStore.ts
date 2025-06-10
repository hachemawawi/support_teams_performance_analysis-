import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuthStore } from './authStore';

interface DashboardStats {
  totalRequests: number;
  openRequests: number;
  resolvedRequests: number;
  avgResponseTime: number;
  requestsByStatus: Record<string, number>;
  requestsByDepartment: Record<string, number>;
  requestsByPriority: Record<number, number>;
  recentRequests: any[];
}

interface DashboardStore {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  fetchDashboardStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  loading: false,
  error: null,

  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const user = useAuthStore.getState().user;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const endpoint = user?.role === 'admin' 
        ? `${API_URL}/dashboard/stats`
        : `${API_URL}/dashboard/users/${user?.id}/stats`;

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      set({ stats: response.data, loading: false });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard statistics', 
        loading: false 
      });
    }
  }
}));