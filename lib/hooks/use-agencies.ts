import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { agencyService } from '@/lib/api/services/agency.service';
import { handleApiError } from '@/lib/api/client';
import type {
  QueryAgenciesParams,
  CreateAgencyInput,
  UpdateAgencyInput,
  Agency,
} from '@/lib/types';

// Query keys
export const agencyKeys = {
  all: ['agencies'] as const,
  lists: () => [...agencyKeys.all, 'list'] as const,
  list: (params?: QueryAgenciesParams) => [...agencyKeys.lists(), params] as const,
  details: () => [...agencyKeys.all, 'detail'] as const,
  detail: (id: string) => [...agencyKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated agencies
 */
export function useAgencies(params?: QueryAgenciesParams) {
  return useQuery({
    queryKey: agencyKeys.list(params),
    queryFn: async () => {
      const response = await agencyService.getAgencies(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch agencies');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a single agency by ID
 */
export function useAgency(id: string) {
  return useQuery({
    queryKey: agencyKeys.detail(id),
    queryFn: async () => {
      const response = await agencyService.getAgencyById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch agency');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to create a new agency
 */
export function useCreateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAgencyInput) => {
      const response = await agencyService.createAgency(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create agency');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch agencies list
      queryClient.invalidateQueries({ queryKey: agencyKeys.lists() });

      toast.success(`Agency "${data.name}" created successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to update an existing agency
 */
export function useUpdateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateAgencyInput }) => {
      const response = await agencyService.updateAgency(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update agency');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the cache for this specific agency
      queryClient.setQueryData(agencyKeys.detail(variables.id), data);

      // Invalidate agencies list to refresh
      queryClient.invalidateQueries({ queryKey: agencyKeys.lists() });

      toast.success(`Agency "${data.name}" updated successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to toggle accepting orders for an agency
 */
export function useToggleAcceptingOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isAcceptingOrders }: { id: string; isAcceptingOrders: boolean }) => {
      const response = await agencyService.toggleAcceptingOrders(id, isAcceptingOrders);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to toggle accepting orders');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.lists() });

      toast.success(
        data.isAcceptingOrders
          ? `Orders enabled for "${data.name}"`
          : `Orders disabled for "${data.name}"`
      );
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to delete an agency
 */
export function useDeleteAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await agencyService.deleteAgency(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete agency');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: agencyKeys.detail(deletedId) });

      // Invalidate agencies list
      queryClient.invalidateQueries({ queryKey: agencyKeys.lists() });

      toast.success('Agency deleted successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}
