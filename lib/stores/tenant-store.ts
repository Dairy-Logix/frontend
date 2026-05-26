import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tenant, TenantConfig, SubscriptionFeatures, SupportedLocale } from '@/lib/types';

interface TenantStore {
  tenant: Tenant | null;
  context: 'super_admin' | 'tenant' | 'marketing';
  isLoading: boolean;
  error: string | null;

  setTenant: (tenant: Tenant) => void;
  setContext: (context: 'super_admin' | 'tenant' | 'marketing') => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearTenant: () => void;

  // Convenience getters — features are plan-derived (tenant.features), not in config.
  getFeatures: () => SubscriptionFeatures | null;
  getConfig: () => TenantConfig | null;
  getDefaultLanguage: () => SupportedLocale;
  isSuperAdmin: () => boolean;
}

export const useTenantStore = create<TenantStore>()(
  persist(
    (set, get) => ({
      tenant: null,
      context: 'marketing',
      isLoading: false,
      error: null,

      setTenant: (tenant) => set({ tenant, error: null }),
      setContext: (context) => set({ context }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      clearTenant: () => set({ tenant: null, error: null }),

      getFeatures: () => get().tenant?.features ?? null,
      getConfig: () => get().tenant?.config ?? null,
      getDefaultLanguage: () => get().tenant?.config?.defaultLanguage ?? 'en',
      isSuperAdmin: () => get().context === 'super_admin',
    }),
    {
      name: 'tenant-storage',
      partialize: (state) => ({
        context: state.context,
        tenant: state.tenant,
      }),
    }
  )
);
