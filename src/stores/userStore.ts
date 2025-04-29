import { create } from 'zustand';
import axios from 'axios';
import { User } from '../types';
import { API_URL } from '../config';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  
  fetchUsers: () => Promise<void>;
  fetchUserById: (id: number) => Promise<User>;
  updateUser: (id: number, userData: Partial<User>) => Promise<User>;
  deleteUser: (id: number) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ users: response.data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users'
      });
    }
  },

  fetchUserById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to fetch user #${id}`
      });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateUser: async (id: number, userData: Partial<User>) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/users/${id}`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedUser = response.data;
      
      set(state => ({
        users: state.users.map(user => 
          user.id === id ? updatedUser : user
        ),
        loading: false
      }));
      
      return updatedUser;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to update user #${id}`
      });
      throw error;
    }
  },

  deleteUser: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set(state => ({
        users: state.users.filter(user => user.id !== id),
        loading: false
      }));
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to delete user #${id}`
      });
      throw error;
    }
  }
}));