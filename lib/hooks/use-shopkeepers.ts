import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { shopkeeperService } from '@/lib/api/services/shopkeeper.service';
import { handleApiError } from '@/lib/api/client';
import type {
  PaginationParams,
  QueryShopkeepersParams,
  CreateShopkeeperInput,
  UpdateShopkeeperInput,
  Shop,
} from '@/lib/types';

// Query keys
export const shopkeeperKeys = {
  all: ['shopkeepers'] as const,
  lists: () => [...shopkeeperKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...shopkeeperKeys.lists(), params] as const,
  details: () => [...shopkeeperKeys.all, 'detail'] as const,
  detail: (id: string) => [...shopkeeperKeys.details(), id] as const,
  byAgency: (agencyId: string) => [...shopkeeperKeys.all, 'agency', agencyId] as const,
  routes: () => [...shopkeeperKeys.all, 'routes'] as const,
};

/**
 * Hook to fetch paginated shopkeepers
 */
export function useShopkeepers(params?: QueryShopkeepersParams) {
  return useQuery({
    queryKey: shopkeeperKeys.list(params),
    queryFn: async () => {
      const response = await shopkeeperService.getShopkeepers(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch shopkeepers');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a single shopkeeper by ID
 */
export function useShopkeeper(id: string) {
  return useQuery({
    queryKey: shopkeeperKeys.detail(id),
    queryFn: async () => {
      const response = await shopkeeperService.getShopkeeperById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch shopkeeper');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch shopkeepers by agency
 */
export function useShopkeepersByAgency(agencyId: string) {
  return useQuery({
    queryKey: shopkeeperKeys.byAgency(agencyId),
    queryFn: async () => {
      const response = await shopkeeperService.getShopkeepersByAgency(agencyId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch shopkeepers');
      }
      return response.data;
    },
    enabled: !!agencyId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to fetch shop routes
 */
export function useShopRoutes() {
  return useQuery({
    queryKey: shopkeeperKeys.routes(),
    queryFn: async () => {
      const response = await shopkeeperService.getShopRoutes();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch routes');
      }
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTotalWalletBalance() {
  return useQuery({
    queryKey: [...shopkeeperKeys.all, 'wallet-total'] as const,
    queryFn: async () => {
      const response = await shopkeeperService.getTotalWalletBalance();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch wallet total');
      }
      return response.data.totalWalletBalance;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to create a new shopkeeper
 */
export function useCreateShopkeeper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateShopkeeperInput) => {
      const response = await shopkeeperService.createShopkeeper(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create shopkeeper');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate shopkeepers list
      queryClient.invalidateQueries({ queryKey: shopkeeperKeys.lists() });

      // Invalidate agency-specific list
      if (data.agencyId) {
        queryClient.invalidateQueries({ queryKey: shopkeeperKeys.byAgency(data.agencyId) });
      }

      toast.success(`Shop "${data.shopName}" created successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to update an existing shopkeeper
 */
export function useUpdateShopkeeper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateShopkeeperInput }) => {
      const response = await shopkeeperService.updateShopkeeper(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update shopkeeper');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update cache for this specific shopkeeper
      queryClient.setQueryData(shopkeeperKeys.detail(variables.id), data);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: shopkeeperKeys.lists() });

      // Invalidate agency-specific list
      if (data.agencyId) {
        queryClient.invalidateQueries({ queryKey: shopkeeperKeys.byAgency(data.agencyId) });
      }

      toast.success(`Shop "${data.shopName}" updated successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to delete a shopkeeper
 */
export function useDeleteShopkeeper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await shopkeeperService.deleteShopkeeper(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete shopkeeper');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: shopkeeperKeys.detail(deletedId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: shopkeeperKeys.lists() });
      queryClient.invalidateQueries({ queryKey: shopkeeperKeys.all });

      toast.success('Shopkeeper deleted successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}
