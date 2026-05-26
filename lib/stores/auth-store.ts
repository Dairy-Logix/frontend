import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User, UserRole, AuthState } from '@/lib/types';
import * as tokenStorage from '@/lib/auth/token-storage';

interface AuthStore extends AuthState {
  setAuth: (user: User, accessToken: string, refreshToken: string, remember?: boolean) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string, remember?: boolean) => void;
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

      setAuth: (user, accessToken, refreshToken, remember = true) => {
        tokenStorage.setTokens(accessToken, refreshToken, remember);
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

      setTokens: (accessToken, refreshToken, remember) => {
        tokenStorage.setTokens(accessToken, refreshToken, remember);
        set({ accessToken, isAuthenticated: true });
      },

      logout: () => {
        tokenStorage.clearTokens();
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
      // Pin the persisted user state to the same store as the tokens so the
      // cached session never outlives the credentials (Remember me): reads
      // check both stores; writes follow wherever the tokens currently live.
      storage: createJSONStorage(() => ({
        getItem: (name) =>
          typeof window === 'undefined'
            ? null
            : window.localStorage.getItem(name) ?? window.sessionStorage.getItem(name),
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          const target = tokenStorage.getActiveStorage() as Storage;
          const other =
            target === window.localStorage ? window.sessionStorage : window.localStorage;
          target.setItem(name, value);
          other.removeItem(name);
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          window.localStorage.removeItem(name);
          window.sessionStorage.removeItem(name);
        },
      })),
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
