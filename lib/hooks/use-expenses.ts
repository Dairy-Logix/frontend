import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { expenseService } from '@/lib/api/services/expense.service';
import { handleApiError } from '@/lib/api/client';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  QueryExpensesParams,
} from '@/lib/types';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (params?: QueryExpensesParams) =>
    [...expenseKeys.lists(), params] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  summary: (params?: { startDate?: string; endDate?: string }) =>
    [...expenseKeys.all, 'summary', params] as const,
};

export function useExpenses(params?: QueryExpensesParams) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: async () => {
      const response = await expenseService.getExpenses(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch expenses');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: async () => {
      const response = await expenseService.getExpenseById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch expense');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

export function useExpenseSummary(params?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: expenseKeys.summary(params),
    queryFn: async () => {
      const response = await expenseService.getSummary(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch expense summary');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const response = await expenseService.createExpense(input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to record expense');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...expenseKeys.all, 'summary'],
      });
      toast.success(`Expense of ₹${data.amount.toLocaleString()} recorded`);
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateExpenseInput;
    }) => {
      const response = await expenseService.updateExpense(id, input);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update expense');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(expenseKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...expenseKeys.all, 'summary'],
      });
      toast.success('Expense updated successfully');
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await expenseService.deleteExpense(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete expense');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...expenseKeys.all, 'summary'],
      });
      toast.success('Expense deleted successfully');
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}
