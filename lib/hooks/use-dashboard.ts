import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/lib/api/services/dashboard.service';
import { useAuthStore } from '@/lib/stores/auth-store';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  superAdmin: () => [...dashboardKeys.all, 'super-admin'] as const,
  tenant: () => [...dashboardKeys.all, 'tenant'] as const,
};

/**
 * Hook to fetch Super Admin dashboard statistics
 */
export function useSuperAdminDashboard() {
  const { isSuperAdmin } = useAuthStore();

  return useQuery({
    queryKey: dashboardKeys.superAdmin(),
    queryFn: async () => {
      const response = await dashboardService.getSuperAdminStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch dashboard stats');
      }
      return response.data;
    },
    enabled: isSuperAdmin(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  });
}

/**
 * Hook to fetch Tenant dashboard statistics
 */
export function useTenantDashboard() {
  const { isTenantAdmin, getTenantId } = useAuthStore();

  return useQuery({
    queryKey: dashboardKeys.tenant(),
    queryFn: async () => {
      const response = await dashboardService.getTenantStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch dashboard stats');
      }
      return response.data;
    },
    enabled: isTenantAdmin() && !!getTenantId(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  });
}
