import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../config';
import { UserRole } from '../types';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  password?: string;
}

interface UserStore {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  updateUser: (id: number, data: UserUpdateData) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      set({ users: response.data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch users', loading: false });
    }
  },

  updateUser: async (id: number, data: UserUpdateData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/users/${id}`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? response.data : user
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to update user', loading: false });
    }
  },

  deleteUser: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${API_URL}/users/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete user', loading: false });
    }
  }
}));