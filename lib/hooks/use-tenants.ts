import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tenantService } from '@/lib/api/services/tenant.service';
import { handleApiError } from '@/lib/api/client';
import type {
  PaginationParams,
  CreateTenantInput,
  UpdateTenantInput,
  Tenant,
} from '@/lib/types';

// Query keys
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...tenantKeys.lists(), params] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
  stats: (id: string) => [...tenantKeys.all, 'stats', id] as const,
};

/**
 * Hook to fetch paginated tenants (Super Admin only)
 */
export function useTenants(params?: PaginationParams) {
  return useQuery({
    queryKey: tenantKeys.list(params),
    queryFn: async () => {
      const response = await tenantService.getTenants(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch tenants');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single tenant by ID
 */
export function useTenant(id: string) {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: async () => {
      const response = await tenantService.getTenantById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch tenant');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch tenant statistics
 */
export function useTenantStats(id: string) {
  return useQuery({
    queryKey: tenantKeys.stats(id),
    queryFn: async () => {
      const response = await tenantService.getTenantStats(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch tenant stats');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new tenant (Super Admin only)
 */
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTenantInput) => {
      const response = await tenantService.createTenant(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create tenant');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate tenants list
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });

      toast.success(`Tenant "${data.name}" created successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to update an existing tenant
 */
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTenantInput }) => {
      const response = await tenantService.updateTenant(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update tenant');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update cache for this specific tenant
      queryClient.setQueryData(tenantKeys.detail(variables.id), data);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });

      toast.success(`Tenant "${data.companyName}" updated successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to delete a tenant (Super Admin only)
 */
export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await tenantService.deleteTenant(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete tenant');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: tenantKeys.detail(deletedId) });
      queryClient.removeQueries({ queryKey: tenantKeys.stats(deletedId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });

      toast.success('Tenant deleted successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}
