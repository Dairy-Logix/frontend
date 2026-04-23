import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deliveryService } from '@/lib/api/services/delivery.service';
import { handleApiError } from '@/lib/api/client';
import { orderKeys } from './use-orders';
import type { DeliveryFilterParams } from '@/lib/api/services/delivery.service';
import type { CreateDeliveryInput, UpdateDeliveryInput, DeliveryStatus, Delivery } from '@/lib/types';

// Query keys
export const deliveryKeys = {
  all: ['deliveries'] as const,
  lists: () => [...deliveryKeys.all, 'list'] as const,
  list: (params?: DeliveryFilterParams) => [...deliveryKeys.lists(), params] as const,
  details: () => [...deliveryKeys.all, 'detail'] as const,
  detail: (id: string) => [...deliveryKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated deliveries
 */
export function useDeliveries(params?: DeliveryFilterParams) {
  return useQuery({
    queryKey: deliveryKeys.list(params),
    queryFn: async () => {
      const response = await deliveryService.getDeliveries(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch deliveries');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch a single delivery by ID
 */
export function useDelivery(id: string) {
  return useQuery({
    queryKey: deliveryKeys.detail(id),
    queryFn: async () => {
      const response = await deliveryService.getDeliveryById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch delivery');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds for tracking
  });
}

/**
 * Hook to create a new delivery
 */
export function useCreateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDeliveryInput) => {
      const response = await deliveryService.createDelivery(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create delivery');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate deliveries list
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });

      // Invalidate related order
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
      }

      toast.success('Delivery created successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to update delivery
 */
export function useUpdateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateDeliveryInput }) => {
      const response = await deliveryService.updateDelivery(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update delivery');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(deliveryKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });

      toast.success('Delivery updated successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to update delivery status with optimistic updates
 */
export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: DeliveryStatus; notes?: string }) => {
      const response = await deliveryService.updateDeliveryStatus(id, status, notes);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update delivery status');
      }
      return response.data;
    },
    onMutate: async ({ id, status }) => {
      // Optimistic update for real-time feel
      await queryClient.cancelQueries({ queryKey: deliveryKeys.detail(id) });

      const previousDelivery = queryClient.getQueryData<Delivery>(deliveryKeys.detail(id));

      if (previousDelivery) {
        queryClient.setQueryData(deliveryKeys.detail(id), {
          ...previousDelivery,
          status,
        });
      }

      return { previousDelivery };
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(deliveryKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });

      const statusLabels: Record<DeliveryStatus, string> = {
        pending: 'Pending',
        dispatched: 'Dispatched',
        in_transit: 'In Transit',
        delivered: 'Delivered',
        failed: 'Failed',
      };

      toast.success(`Delivery marked as ${statusLabels[variables.status]}`);
    },
    onError: (error, variables, context) => {
      if (context?.previousDelivery) {
        queryClient.setQueryData(deliveryKeys.detail(variables.id), context.previousDelivery);
      }
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Returns shopkeeper IDs already booked in an active delivery
 * for the given agency on the given date (YYYY-MM-DD).
 * Used to hide already-covered shops from the create-delivery picker.
 */
export function useBookedShops(agencyId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: [...deliveryKeys.all, 'booked-shops', agencyId, date],
    queryFn: () => deliveryService.getBookedShops(agencyId, date),
    enabled: enabled && !!agencyId && !!date,
    staleTime: 30 * 1000,
  });
}
