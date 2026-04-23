import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { factoryService } from '@/lib/api/services/factory.service';
import { handleApiError } from '@/lib/api/client';
import type { FactoryOrderFilterParams } from '@/lib/api/services/factory.service';
import type {
  PaginationParams,
  CreateFactoryOrderInput,
  CreateFactoryPaymentInput,
} from '@/lib/types';

// Query keys
export const factoryKeys = {
  all: ['factory'] as const,
  orders: () => [...factoryKeys.all, 'orders'] as const,
  ordersList: (params?: FactoryOrderFilterParams) => [...factoryKeys.orders(), params] as const,
  payments: () => [...factoryKeys.all, 'payments'] as const,
  paymentsList: (params?: Record<string, unknown>) => [...factoryKeys.payments(), params] as const,
  products: () => [...factoryKeys.all, 'products'] as const,
  productsList: (params?: Record<string, unknown>) => [...factoryKeys.products(), params] as const,
  profitMargins: (params?: Record<string, unknown>) => [...factoryKeys.all, 'profitMargins', params] as const,
};

/**
 * Hook to fetch factory orders
 */
export function useFactoryOrders(params?: FactoryOrderFilterParams) {
  return useQuery({
    queryKey: factoryKeys.ordersList(params),
    queryFn: async () => {
      const response = await factoryService.getFactoryOrders(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch factory orders');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create factory order
 */
export function useCreateFactoryOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFactoryOrderInput) => {
      const response = await factoryService.createFactoryOrder(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create factory order');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: factoryKeys.orders() });
      toast.success(`Factory order #${data.poNumber} created successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to fetch factory payments
 */
export function useFactoryPayments(params?: PaginationParams & { factoryName?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: factoryKeys.paymentsList(params),
    queryFn: async () => {
      const response = await factoryService.getFactoryPayments(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch factory payments');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create factory payment
 */
export function useCreateFactoryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFactoryPaymentInput) => {
      const response = await factoryService.createFactoryPayment(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to record factory payment');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: factoryKeys.payments() });
      queryClient.invalidateQueries({ queryKey: factoryKeys.orders() });
      toast.success(`Payment of ₹${data.amount.toLocaleString()} recorded successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to fetch factory products
 */
export function useFactoryProducts(params?: PaginationParams & { factoryName?: string }) {
  return useQuery({
    queryKey: factoryKeys.productsList(params),
    queryFn: async () => {
      const response = await factoryService.getFactoryProducts(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch factory products');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch profit margins
 */
export function useProfitMargins(params?: { agencyId?: string; categoryId?: string }) {
  return useQuery({
    queryKey: factoryKeys.profitMargins(params),
    queryFn: async () => {
      const response = await factoryService.getProfitMargins(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch profit margins');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
