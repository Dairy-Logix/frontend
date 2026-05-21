import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { purchaseService, type PurchaseFilterParams } from '@/lib/api/services/purchase.service';
import { handleApiError } from '@/lib/api/client';
import type {
  CreatePurchaseInput,
  BulkCreatePurchasesInput,
} from '@/lib/types';

export const purchaseKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  list: (params?: PurchaseFilterParams) => [...purchaseKeys.lists(), params] as const,
  details: () => [...purchaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseKeys.details(), id] as const,
};

export function usePurchases(params?: PurchaseFilterParams) {
  return useQuery({
    queryKey: purchaseKeys.list(params),
    queryFn: async () => {
      const response = await purchaseService.getPurchases(params);
      if (!response.success) throw new Error(response.message || 'Failed to fetch purchases');
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

export function usePurchase(id: string) {
  return useQuery({
    queryKey: purchaseKeys.detail(id),
    queryFn: async () => {
      const response = await purchaseService.getPurchaseById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch purchase');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePurchaseInput) => {
      const response = await purchaseService.createPurchase(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create purchase');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
      toast.success('Purchase saved');
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}

export function useCreatePurchasesBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BulkCreatePurchasesInput) => {
      const response = await purchaseService.createPurchasesBulk(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to save purchases');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
      toast.success(`${data.length} purchase${data.length === 1 ? '' : 's'} saved`);
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CreatePurchaseInput> }) => {
      const response = await purchaseService.updatePurchase(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update purchase');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(purchaseKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
      toast.success('Purchase updated');
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await purchaseService.deletePurchase(id);
      if (!response.success) throw new Error(response.message || 'Failed to delete purchase');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() });
      toast.success('Purchase deleted');
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}
