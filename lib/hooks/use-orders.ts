import { useQuery, useMutation, useQueryClient, keepPreviousData} from '@tanstack/react-query';
import { toast } from 'sonner';
import { orderService } from '@/lib/api/services/order.service';
import { handleApiError } from '@/lib/api/client';
import type { OrderFilterParams } from '@/lib/api/services/order.service';
import type { CreateOrderInput, UpdateOrderInput, OrderStatus, Order } from '@/lib/types';

// Query keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params?: OrderFilterParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  aggregated: (agencyId?: string) => [...orderKeys.all, 'aggregated', agencyId] as const,
};

/**
 * Hook to fetch paginated orders
 */
export function useOrders(params?: OrderFilterParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await orderService.getOrders(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch orders');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const response = await orderService.getOrderById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch order');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch aggregated order quantities for matrix view
 */
export function useAggregatedOrders(agencyId?: string) {
  return useQuery({
    queryKey: orderKeys.aggregated(agencyId),
    queryFn: async () => {
      const response = await orderService.getAggregatedOrderQuantities(agencyId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch aggregated orders');
      }
      return response.data;
    },
    enabled: !!agencyId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const response = await orderService.createOrder(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create order');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });

      // Invalidate aggregated data for the agency
      if (data.agencyId) {
        queryClient.invalidateQueries({ queryKey: orderKeys.aggregated(data.agencyId) });
      }

      toast.success(`Order #${data.orderNumber} created successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to update an order
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateOrderInput }) => {
      const response = await orderService.updateOrder(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update order');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update cache for this specific order
      queryClient.setQueryData(orderKeys.detail(variables.id), data);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });

      // Invalidate aggregated data
      if (data.agencyId) {
        queryClient.invalidateQueries({ queryKey: orderKeys.aggregated(data.agencyId) });
      }

      toast.success(`Order #${data.orderNumber} updated successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to update order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const response = await orderService.updateOrderStatus(id, status);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update order status');
      }
      return response.data;
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: orderKeys.detail(id) });

      // Snapshot previous value
      const previousOrder = queryClient.getQueryData<Order>(orderKeys.detail(id));

      // Optimistically update
      if (previousOrder) {
        queryClient.setQueryData(orderKeys.detail(id), {
          ...previousOrder,
          status,
        });
      }

      return { previousOrder };
    },
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(orderKeys.detail(variables.id), data);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });

      const statusLabels: Record<OrderStatus, string> = {
        placed: 'placed',
        pending: 'pending',
        processing: 'processing',
        ready: 'ready',
        confirmed: 'confirmed',
        dispatched: 'dispatched',
        delivered: 'delivered',
        completed: 'completed',
        returned: 'returned',
      };

      toast.success(`Order status updated to ${statusLabels[variables.status]}`);
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(orderKeys.detail(variables.id), context.previousOrder);
      }

      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to delete an order
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await orderService.deleteOrder(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete order');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: orderKeys.detail(deletedId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });

      // Invalidate aggregated data
      queryClient.invalidateQueries({ queryKey: orderKeys.all });

      toast.success('Order deleted successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}
