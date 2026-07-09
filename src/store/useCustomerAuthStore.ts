import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CustomerAuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  bankAccounts: any[];
  setAuthenticated: (isAuthenticated: boolean, user: any | null) => void;
  checkAuth: (organizationId: string) => Promise<boolean>;
  addBankAccount: (account: any) => void;
  setPrimaryBankAccount: (accountId: string) => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      loading: true,
      bankAccounts: [],
      setAuthenticated: (isAuthenticated, user) => set({ isAuthenticated, user, loading: false }),
      checkAuth: async (organizationId) => {
        set({ loading: true });
        try {
          const res = await fetch(`/api/auth/customer-me?organizationId=${organizationId}`, { cache: 'no-store' });
          const data = await res.json();
          if (data.success && data.data) {
            const userData = data.data.content ? data.data.content : data.data;
            set({ isAuthenticated: true, user: userData, loading: false });
            return true;
          }
        } catch (e) {
          console.error(e);
        }
        set({ isAuthenticated: false, user: null, loading: false });
        return false;
      },
      addBankAccount: (account) => set((state) => ({
        bankAccounts: [...state.bankAccounts, account]
      })),
      setPrimaryBankAccount: (accountId) => set((state) => ({
        bankAccounts: state.bankAccounts.map((acc) => ({
          ...acc,
          primary: acc.id === accountId,
        })),
      })),
    }),
    {
      name: 'ksm-customer-auth-storage',
      partialize: (state) => ({ bankAccounts: state.bankAccounts }),
    }
  )
);
