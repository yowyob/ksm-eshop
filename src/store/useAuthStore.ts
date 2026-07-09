import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  user: { name: string; role: string } | null;
  login: (name: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (name) => set({ 
        isAuthenticated: true, 
        user: { name, role: 'Administrateur' } 
      }),
      logout: () => set({ 
        isAuthenticated: false, 
        user: null 
      }),
    }),
    {
      name: 'ksm-auth-storage',
    }
  )
);
