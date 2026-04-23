import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, AuthState } from '@/lib/types';

interface AuthStore extends AuthState {
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;

  // Role helpers
  isSuperAdmin: () => boolean;
  isTenantAdmin: () => boolean;
  isEmployee: () => boolean;
  isShopkeeper: () => boolean;
  hasRole: (role: UserRole) => boolean;
  getTenantId: () => string | undefined;
  getAgencyIds: () => string[];
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      isSuperAdmin: () => get().user?.role === 'super_admin',
      isTenantAdmin: () => get().user?.role === 'tenant_admin',
      isEmployee: () => get().user?.role === 'employee',
      isShopkeeper: () => get().user?.role === 'shopkeeper',
      hasRole: (role) => get().user?.role === role,
      getTenantId: () => get().user?.tenantId,
      getAgencyIds: () => get().user?.agencyIds ?? [],
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);
