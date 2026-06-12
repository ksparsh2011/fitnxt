import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  email: string | null;
}

interface AuthActions {
  setAuth: (token: string, userId: string, email: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  accessToken: null,
  userId: null,
  email: null,
  setAuth: (accessToken, userId, email) => set({ accessToken, userId, email }),
  clearAuth: () => set({ accessToken: null, userId: null, email: null }),
}));
