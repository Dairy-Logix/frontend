import { useMutation, useQuery, useQueryClient, keepPreviousData} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  invoiceTransferService,
  type CreateTransferInput,
  type ReverseTransferInput,
  type TransferFilterParams,
} from '@/lib/api/services/invoice-transfer.service';
import { handleApiError } from '@/lib/api/client';
import { invoiceKeys } from './use-invoices';
import { shopkeeperKeys } from './use-shopkeepers';

export const transferKeys = {
  all: ['invoice-transfers'] as const,
  lists: () => [...transferKeys.all, 'list'] as const,
  list: (params?: TransferFilterParams) =>
    [...transferKeys.lists(), params] as const,
  details: () => [...transferKeys.all, 'detail'] as const,
  detail: (id: string) => [...transferKeys.details(), id] as const,
  giverItems: (shopkeeperId: string) =>
    [...transferKeys.all, 'giver-items', shopkeeperId] as const,
};

export function useGiverItems(shopkeeperId: string) {
  return useQuery({
    queryKey: transferKeys.giverItems(shopkeeperId),
    queryFn: async () => {
      try {
        const response = await invoiceTransferService.giverItems(shopkeeperId);
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load giver items');
        }
        return response.data;
      } catch (err) {
        // Surface the backend message ("X has no order placed for today…")
        // instead of axios' default "Request failed with status code 400".
        throw new Error(handleApiError(err));
      }
    },
    enabled: !!shopkeeperId,
    retry: false,
    staleTime: 30 * 1000,
  });
}

export function useTransfers(params?: TransferFilterParams) {
  return useQuery({
    queryKey: transferKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await invoiceTransferService.list(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch transfers');
      }
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useTransfer(id: string) {
  return useQuery({
    queryKey: transferKeys.detail(id),
    queryFn: async () => {
      const response = await invoiceTransferService.findOne(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch transfer');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function usePreviewTransfer() {
  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const response = await invoiceTransferService.preview(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Preview failed');
      }
      return response.data;
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const response = await invoiceTransferService.create(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create transfer');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: transferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(data.giver.invoiceId || ''),
      });
      if (data.receiver.invoiceId) {
        queryClient.invalidateQueries({
          queryKey: invoiceKeys.detail(data.receiver.invoiceId),
        });
      }
      queryClient.invalidateQueries({ queryKey: shopkeeperKeys.all });
      toast.success(`Transfer ${data.transferNumber} completed`);
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}

export function useReverseTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: ReverseTransferInput;
    }) => {
      const response = await invoiceTransferService.reverse(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to reverse transfer');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: transferKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: transferKeys.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: shopkeeperKeys.all });
      toast.success(`Transfer ${data.transferNumber} reversed`);
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}
