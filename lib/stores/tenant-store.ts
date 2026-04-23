import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tenant, TenantConfig, TenantFeatures, SupportedLocale } from '@/lib/types';

interface TenantStore {
  tenant: Tenant | null;
  slug: string | null;
  context: 'super_admin' | 'tenant' | 'marketing';
  isLoading: boolean;
  error: string | null;

  setTenant: (tenant: Tenant) => void;
  setSlug: (slug: string | null) => void;
  setContext: (context: 'super_admin' | 'tenant' | 'marketing') => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearTenant: () => void;

  // Convenience getters
  getFeatures: () => TenantFeatures | null;
  getConfig: () => TenantConfig | null;
  getDefaultLanguage: () => SupportedLocale;
  isSuperAdmin: () => boolean;
  isTenantContext: () => boolean;
}

const defaultFeatures: TenantFeatures = {
  gpsTracking: false,
  pushNotifications: true,
  advancedAnalytics: false,
  bulkImport: true,
  photoProofDelivery: false,
};

export const useTenantStore = create<TenantStore>()(
  persist(
    (set, get) => ({
      tenant: null,
      slug: null,
      context: 'marketing',
      isLoading: false,
      error: null,

      setTenant: (tenant) => set({ tenant, slug: tenant.slug, error: null }),
      setSlug: (slug) => set({ slug }),
      setContext: (context) => set({ context }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      clearTenant: () => set({ tenant: null, slug: null, error: null }),

      getFeatures: () => get().tenant?.config?.features ?? null,
      getConfig: () => get().tenant?.config ?? null,
      getDefaultLanguage: () => get().tenant?.config?.defaultLanguage ?? 'en',
      isSuperAdmin: () => get().context === 'super_admin',
      isTenantContext: () => get().context === 'tenant',
    }),
    {
      name: 'tenant-storage',
      partialize: (state) => ({
        slug: state.slug,
        context: state.context,
        tenant: state.tenant,
      }),
    }
  )
);

export { defaultFeatures };
