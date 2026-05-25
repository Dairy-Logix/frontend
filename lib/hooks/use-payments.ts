import { useQuery, useMutation, useQueryClient, keepPreviousData} from '@tanstack/react-query';
import { toast } from 'sonner';
import { paymentService } from '@/lib/api/services/payment.service';
import { handleApiError } from '@/lib/api/client';
import { invoiceKeys } from './use-invoices';
import type { PaymentFilterParams, GroupedCollectionsPage } from '@/lib/api/services/payment.service';
import type { CreatePaymentInput } from '@/lib/types';

// Query keys
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (params?: PaymentFilterParams) => [...paymentKeys.lists(), params] as const,
  collections: (params?: Record<string, unknown>) => [...paymentKeys.all, 'collections', params] as const,
  outstanding: (params?: Record<string, unknown>) => [...paymentKeys.all, 'outstanding', params] as const,
};

/**
 * Hook to fetch paginated payments
 */
export function usePayments(params?: PaymentFilterParams) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await paymentService.getPayments(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch payments');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to create a new payment
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePaymentInput) => {
      const response = await paymentService.createPayment(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to record payment');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });

      // Invalidate related invoice
      if (data.invoiceId) {
        queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.invoiceId) });
        queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      }

      // Invalidate collection and outstanding reports
      queryClient.invalidateQueries({ queryKey: paymentKeys.collections() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.outstanding() });

      toast.success(`Payment of ₹${data.amount.toLocaleString()} recorded successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to fetch payment history grouped by collection (one row per collect event)
 */
export function useGroupedCollections(params?: PaymentFilterParams) {
  return useQuery<GroupedCollectionsPage>({
    queryKey: [...paymentKeys.all, 'grouped', params] as const,
    queryFn: async () => {
      const response = await paymentService.getGroupedCollections(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch collections');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch aggregated day stats (cleared, cash, online, cheque, wallet)
 */
export function useDayStats(date: string) {
  return useQuery({
    queryKey: [...paymentKeys.all, 'day-stats', date] as const,
    queryFn: async () => {
      const response = await paymentService.getDayStats(date);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch day stats');
      }
      return response.data;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch collection summary
 */
export function useCollectionSummary(params?: {
  dateFrom?: string;
  dateTo?: string;
  agencyId?: string;
  employeeId?: string;
}) {
  return useQuery({
    queryKey: paymentKeys.collections(params),
    queryFn: async () => {
      const response = await paymentService.getCollectionSummary(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch collection summary');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch outstanding payments report
 */
export function useOutstandingReport(params?: {
  agencyId?: string;
  minAmount?: number;
}) {
  return useQuery({
    queryKey: paymentKeys.outstanding(params),
    queryFn: async () => {
      const response = await paymentService.getOutstandingReport(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch outstanding report');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
