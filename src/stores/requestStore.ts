import { create } from 'zustand';
import axios from 'axios';
import { Request, RequestStatus, Priority, Department } from '../types';
import { API_URL } from '../config';

interface RequestState {
  requests: Request[];
  currentRequest: Request | null;
  loading: boolean;
  error: string | null;
  
  fetchRequests: () => Promise<void>;
  fetchUserRequests: (userId: number) => Promise<void>;
  fetchAssignedRequests: (userId: number) => Promise<void>;
  fetchRequestById: (id: number) => Promise<void>;
  createRequest: (requestData: Partial<Request>) => Promise<Request>;
  updateRequest: (id: number, requestData: Partial<Request>) => Promise<Request>;
  updateRequestStatus: (id: number, status: RequestStatus) => Promise<Request>;
  assignRequest: (id: number, assigneeId: number) => Promise<Request>;
  addComment: (requestId: number, content: string) => Promise<void>;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: [],
  currentRequest: null,
  loading: false,
  error: null,

  fetchRequests: async () => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ requests: response.data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch requests'
      });
    }
  },

  fetchUserRequests: async (userId: number) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/${userId}/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ requests: response.data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user requests'
      });
    }
  },

  fetchAssignedRequests: async (userId: number) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/requests/assigned/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ requests: response.data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch assigned requests'
      });
    }
  },

  fetchRequestById: async (id: number) => {
    set({ loading: true, error: null, currentRequest: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ currentRequest: response.data, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to fetch request #${id}`
      });
    }
  },

  createRequest: async (requestData: Partial<Request>) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/requests`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newRequest = response.data;
      set(state => ({
        requests: [...state.requests, newRequest],
        loading: false
      }));
      
      return newRequest;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create request'
      });
      throw error;
    }
  },

  updateRequest: async (id: number, requestData: Partial<Request>) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/requests/${id}`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedRequest = response.data;
      
      set(state => ({
        requests: state.requests.map(req => 
          req.id === id ? updatedRequest : req
        ),
        currentRequest: state.currentRequest?.id === id ? updatedRequest : state.currentRequest,
        loading: false
      }));
      
      return updatedRequest;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to update request #${id}`
      });
      throw error;
    }
  },

  updateRequestStatus: async (id: number, status: RequestStatus) => {
    return get().updateRequest(id, { status });
  },

  assignRequest: async (id: number, assigneeId: number) => {
    return get().updateRequest(id, { assignedTo: assigneeId });
  },

  addComment: async (requestId: number, content: string) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/requests/${requestId}/comments`, 
        { content },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      const comment = response.data;
      
      // Update the current request with the new comment if it's loaded
      const currentRequest = get().currentRequest;
      if (currentRequest && currentRequest.id === requestId) {
        const updatedRequest = {
          ...currentRequest,
          comments: [...(currentRequest.comments || []), comment]
        };
        
        set({ currentRequest: updatedRequest, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to add comment'
      });
      throw error;
    }
  }
}));