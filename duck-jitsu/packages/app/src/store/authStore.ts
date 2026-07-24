import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { AuthApi, ProfileApi } from '../api/endpoints';
import { setAuthToken } from '../api/client';
import type { Profile } from '../api/types';

const TOKEN_KEY = 'duckjitsu.token';

interface AuthState {
  status: 'hydrating' | 'signed-out' | 'signed-in';
  token: string | null;
  profile: Profile | null;
  error: string | null;
  hydrate: () => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  continueAsGuest: (displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: Profile) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'hydrating',
  token: null,
  profile: null,
  error: null,

  hydrate: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        set({ status: 'signed-out' });
        return;
      }
      setAuthToken(token);
      const { profile } = await AuthApi.me();
      set({ status: 'signed-in', token, profile });
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      set({ status: 'signed-out', token: null, profile: null });
    }
  },

  registerWithEmail: async (email, password, displayName) => {
    set({ error: null });
    try {
      const res = await AuthApi.register(email, password, displayName);
      await AsyncStorage.setItem(TOKEN_KEY, res.token);
      setAuthToken(res.token);
      set({ status: 'signed-in', token: res.token, profile: res.profile });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Registration failed' });
      throw err;
    }
  },

  loginWithEmail: async (email, password) => {
    set({ error: null });
    try {
      const res = await AuthApi.login(email, password);
      await AsyncStorage.setItem(TOKEN_KEY, res.token);
      setAuthToken(res.token);
      set({ status: 'signed-in', token: res.token, profile: res.profile });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Login failed' });
      throw err;
    }
  },

  continueAsGuest: async (displayName) => {
    set({ error: null });
    try {
      const res = await AuthApi.guest(displayName);
      await AsyncStorage.setItem(TOKEN_KEY, res.token);
      setAuthToken(res.token);
      set({ status: 'signed-in', token: res.token, profile: res.profile });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Could not start guest session' });
      throw err;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    set({ status: 'signed-out', token: null, profile: null });
  },

  refreshProfile: async () => {
    if (get().status !== 'signed-in') return;
    const { profile } = await ProfileApi.get();
    set({ profile });
  },

  setProfile: (profile) => set({ profile }),
}));
