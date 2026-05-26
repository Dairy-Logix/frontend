import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User, UserRole, AuthState } from '@/lib/types';
import * as tokenStorage from '@/lib/auth/token-storage';
import { setImpToken, clearImpToken } from '@/lib/auth/impersonation-token';

export interface ImpersonatedTenant {
  id: string;
  slug: string;
  name: string;
  logo?: string;
}

interface AuthStore extends AuthState {
  setAuth: (user: User, accessToken: string, refreshToken: string, remember?: boolean) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string, remember?: boolean) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;

  // Impersonation (super-admin "view as tenant", read-only)
  impersonation: { tenant: ImpersonatedTenant } | null;
  originalUser: User | null;
  enterImpersonation: (token: string, tenant: ImpersonatedTenant) => void;
  exitImpersonation: () => void;

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
      impersonation: null,
      originalUser: null,

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
        clearImpToken();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          impersonation: null,
          originalUser: null,
        });
      },

      // Enter read-only impersonation: stash the real super-admin user and swap
      // in an effective tenant_admin view so route guards (which read user.role
      // directly) and tenant-scoped pages behave as the target tenant. The
      // admin's own tokens stay untouched in token-storage; the impersonation
      // token lives in sessionStorage and is preferred by the axios client.
      enterImpersonation: (token, tenant) => {
        const current = get().user;
        setImpToken(token);
        const impUser: User = {
          id: current?.id ?? 'impersonation',
          email: current?.email ?? '',
          firstName: tenant.name,
          lastName: '(view as admin)',
          role: 'tenant_admin',
          status: 'active',
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({
          originalUser: current,
          user: impUser,
          impersonation: { tenant },
        });
      },

      exitImpersonation: () => {
        clearImpToken();
        const original = get().originalUser;
        set({
          user: original ?? get().user,
          originalUser: null,
          impersonation: null,
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
        impersonation: state.impersonation,
        originalUser: state.originalUser,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);
