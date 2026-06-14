import { create } from 'zustand';
import { api } from '../api/http.js';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem('nxtbiz_access_token'),
  loading: false,
  setSession: ({ user, accessToken }) => {
    if (accessToken) localStorage.setItem('nxtbiz_access_token', accessToken);
    set({ user, accessToken });
  },
  loadSession: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/api/auth/me');
      set({ user: data.user, loading: false });
    } catch {
      localStorage.removeItem('nxtbiz_access_token');
      set({ user: null, accessToken: null, loading: false });
    }
  },
  login: async (input) => {
    const { data } = await api.post('/api/auth/login', input);
    localStorage.setItem('nxtbiz_access_token', data.accessToken);
    set({ user: data.user, accessToken: data.accessToken });
  },
  register: async (input) => {
    const { data } = await api.post('/api/auth/register', input);
    localStorage.setItem('nxtbiz_access_token', data.accessToken);
    set({ user: data.user, accessToken: data.accessToken });
  },
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('nxtbiz_access_token');
      set({ user: null, accessToken: null });
    }
  }
}));
