import { useAuthStore } from '@/lib/stores/auth-store';
import { useTenant } from './use-tenants';
import type { SubscriptionFeatures } from '@/lib/types';

export type FeatureKey = keyof SubscriptionFeatures;

/**
 * Hook to check whether a feature is enabled for the current tenant.
 * Super admins always have access.
 */
export function useFeature(key: FeatureKey): boolean {
  const user = useAuthStore((s) => s.user);
  const tenantId = user?.tenantId;
  const { data: tenant } = useTenant(tenantId || '');

  if (user?.role === 'super_admin') return true;
  if (!tenant?.features) return false;
  return Boolean(tenant.features[key]);
}

/**
 * Hook returning the full features object for the current tenant.
 * Returns an all-false object if not loaded yet.
 */
export function useTenantFeatures(): SubscriptionFeatures {
  const user = useAuthStore((s) => s.user);
  const tenantId = user?.tenantId;
  const { data: tenant } = useTenant(tenantId || '');

  const fallback: SubscriptionFeatures = {
    employees: false,
    deliveries: false,
    gpsTracking: false,
    photoProofDelivery: false,
    bulkImport: false,
    advancedAnalytics: false,
    pushNotifications: false,
    appNotifications: false,
    storeMobileApp: false,
    printTemplates: false,
  };

  if (user?.role === 'super_admin') {
    return {
      employees: true,
      deliveries: true,
      gpsTracking: true,
      photoProofDelivery: true,
      bulkImport: true,
      advancedAnalytics: true,
      pushNotifications: true,
      appNotifications: true,
      storeMobileApp: true,
      printTemplates: true,
    };
  }

  return { ...fallback, ...(tenant?.features || {}) };
}

export function useSubscriptionStatus() {
  const user = useAuthStore((s) => s.user);
  const tenantId = user?.tenantId;
  const { data: tenant } = useTenant(tenantId || '');
  return {
    status: tenant?.subscriptionStatus,
    plan: tenant?.subscriptionPlan,
    endDate: tenant?.subscriptionEndDate,
    isExpired: tenant?.subscriptionStatus === 'expired',
  };
}
