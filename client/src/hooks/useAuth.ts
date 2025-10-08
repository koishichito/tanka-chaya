import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,
  initialized: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.login(email, password);
      localStorage.setItem('token', data.token);
      initSocket(data.token);
      set({ user: data.user, token: data.token, isLoading: false, initialized: true });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  register: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.register(email, password, displayName);
      localStorage.setItem('token', data.token);
      initSocket(data.token);
      set({ user: data.user, token: data.token, isLoading: false, initialized: true });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    disconnectSocket();
    set({ user: null, token: null, initialized: true });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, token: null, initialized: true });
      return;
    }

    set({ isLoading: true });

    try {
      const data = await api.getMe();
      initSocket(token);
      set({ user: data.user, token, isLoading: false, initialized: true });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoading: false, initialized: true });
    }
  }
}));
