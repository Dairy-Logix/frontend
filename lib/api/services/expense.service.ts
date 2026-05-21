import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput,
  QueryExpensesParams,
  ExpenseSummary,
} from '@/lib/types';

interface ExpenseListResponse {
  data: Expense[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  filteredTotal: number;
}

function normalizeExpense(raw: any): Expense {
  return {
    ...raw,
    id: raw._id || raw.id,
    _id: raw._id,
    agencyId:
      typeof raw.agencyId === 'object' ? raw.agencyId?._id : raw.agencyId,
    referenceId:
      typeof raw.referenceId === 'object'
        ? raw.referenceId?._id
        : raw.referenceId,
    date: raw.date,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  } as Expense;
}

function toBackendParams(params?: QueryExpensesParams): any {
  if (!params) return undefined;
  const { pageSize, startDate, endDate, ...rest } = params;
  return {
    ...rest,
    limit: pageSize,
    startDate,
    endDate,
  };
}

export const expenseService = {
  async getExpenses(
    params?: QueryExpensesParams,
  ): Promise<ApiResponse<ExpenseListResponse>> {
    const { data } = await apiClient.get<{
      expenses: any[];
      pagination: any;
      filteredTotal: number;
    }>('/expenses', { params: toBackendParams(params) });
    return {
      success: true,
      data: {
        data: (data.expenses || []).map(normalizeExpense),
        pagination: data.pagination,
        filteredTotal: data.filteredTotal || 0,
      },
      message: 'Expenses fetched successfully',
    };
  },

  async getExpenseById(id: string): Promise<ApiResponse<Expense>> {
    const { data } = await apiClient.get<any>(`/expenses/${id}`);
    return {
      success: true,
      data: normalizeExpense(data),
      message: 'Expense fetched successfully',
    };
  },

  async createExpense(
    input: CreateExpenseInput,
  ): Promise<ApiResponse<Expense>> {
    const { data } = await apiClient.post<any>('/expenses', input);
    return {
      success: true,
      data: normalizeExpense(data),
      message: 'Expense recorded successfully',
    };
  },

  async updateExpense(
    id: string,
    input: UpdateExpenseInput,
  ): Promise<ApiResponse<Expense>> {
    const { data } = await apiClient.patch<any>(`/expenses/${id}`, input);
    return {
      success: true,
      data: normalizeExpense(data),
      message: 'Expense updated successfully',
    };
  },

  async deleteExpense(id: string): Promise<ApiResponse<void>> {
    await apiClient.delete(`/expenses/${id}`);
    return { success: true, message: 'Expense deleted successfully' };
  },

  async getSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<ExpenseSummary>> {
    const { data } = await apiClient.get<ExpenseSummary>('/expenses/summary', {
      params,
    });
    return {
      success: true,
      data,
      message: 'Expense summary fetched successfully',
    };
  },
};
