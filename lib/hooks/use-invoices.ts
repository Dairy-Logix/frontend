import { useQuery, useMutation, useQueryClient, keepPreviousData} from '@tanstack/react-query';
import { toast } from 'sonner';
import { invoiceService } from '@/lib/api/services/invoice.service';
import { handleApiError } from '@/lib/api/client';
import { orderKeys } from './use-orders';
import type { InvoiceFilterParams, UpdateInvoiceInput, PendingStoreBalance } from '@/lib/api/services/invoice.service';
import type { CreateInvoiceInput, Invoice, InvoiceStatus } from '@/lib/types';

// Query keys
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (params?: InvoiceFilterParams) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  pendingByStore: (params?: { agencyId?: string; search?: string; groupByAgency?: boolean; shopkeeperId?: string }) =>
    [...invoiceKeys.all, 'pending-by-store', params] as const,
};

export function usePendingByStore(params?: { agencyId?: string; search?: string; groupByAgency?: boolean; shopkeeperId?: string }) {
  return useQuery({
    queryKey: invoiceKeys.pendingByStore(params),
    queryFn: async () => {
      const response = await invoiceService.getPendingByStore(params);
      if (!response.success) throw new Error(response.message || 'Failed to fetch pending balances');
      return response.data as PendingStoreBalance[];
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch paginated invoices
 */
export function useInvoices(params?: InvoiceFilterParams) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await invoiceService.getInvoices(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch invoices');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a single invoice by ID
 */
export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const response = await invoiceService.getInvoiceById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch invoice');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to create a new invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const response = await invoiceService.createInvoice(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create invoice');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });

      // Invalidate related orders
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
      }

      toast.success(`Invoice #${data.invoiceNumber} created successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to update an invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateInvoiceInput }) => {
      const response = await invoiceService.updateInvoice(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update invoice');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(invoiceKeys.detail(variables.id), data);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });

      toast.success(`Invoice #${data.invoiceNumber} updated successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to update invoice status
 */
export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const response = await invoiceService.updateInvoiceStatus(id, status);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update invoice status');
      }
      return response.data;
    },
    onMutate: async ({ id, status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: invoiceKeys.detail(id) });

      const previousInvoice = queryClient.getQueryData<Invoice>(invoiceKeys.detail(id));

      if (previousInvoice) {
        queryClient.setQueryData(invoiceKeys.detail(id), {
          ...previousInvoice,
          status,
        });
      }

      return { previousInvoice };
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(invoiceKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });

      const statusLabels: Record<InvoiceStatus, string> = {
        draft: 'Draft',
        sent: 'Sent',
        paid: 'Paid',
        partially_paid: 'Partially Paid',
        overdue: 'Overdue',
        cancelled: 'Cancelled',
      };

      toast.success(`Invoice marked as ${statusLabels[variables.status]}`);
    },
    onError: (error, variables, context) => {
      if (context?.previousInvoice) {
        queryClient.setQueryData(invoiceKeys.detail(variables.id), context.previousInvoice);
      }
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to generate invoice from an order
 */
export function useGenerateInvoiceFromOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await invoiceService.generateFromOrder(orderId);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to generate invoice');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
      }
      toast.success(`Invoice #${data.invoiceNumber} generated successfully`);
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to record payment on an invoice
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, amountPaid }: { id: string; amountPaid: number }) => {
      const response = await invoiceService.recordPayment(id, amountPaid);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to record payment');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(invoiceKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}

/**
 * Hook to delete an invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await invoiceService.deleteInvoice(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete invoice');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.removeQueries({ queryKey: invoiceKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });

      toast.success('Invoice deleted successfully');
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
}
