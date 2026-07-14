import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  login: (userData: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (userData) => set({ 
        isAuthenticated: true, 
        user: typeof userData === 'string' ? { name: userData, role: 'Administrateur' } : { ...userData, role: 'Administrateur' } 
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
