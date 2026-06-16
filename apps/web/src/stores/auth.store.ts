import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  email: string | null;
}

interface AuthActions {
  setAuth: (token: string, userId: string, email: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      accessToken: null,
      userId: null,
      email: null,
      setAuth: (accessToken, userId, email) => set({ accessToken, userId, email }),
      clearAuth: () => set({ accessToken: null, userId: null, email: null }),
    }),
    {
      name: 'fitnxt-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        userId: state.userId,
        email: state.email,
      }),
    },
  ),
);
