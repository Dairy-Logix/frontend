import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Payment,
  PaymentCollection,
  GroupedCollection,
  CreatePaymentInput,
} from '@/lib/types';

export interface PaymentFilterParams extends PaginationParams {
  shopId?: string;
  agencyId?: string;
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CollectionSummary {
  date: string;
  totalCollected: number;
  onlineAmount: number;
  offlineAmount: number;
  paymentCount: number;
  collections: PaymentCollection[];
}

export interface GroupedCollectionsPage {
  data: GroupedCollection[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OutstandingReport {
  shopId: string;
  shopName: string;
  ownerName: string;
  totalOutstanding: number;
  overdueAmount: number;
  lastPaymentDate?: string;
  invoiceCount: number;
}

function toBackendParams(params?: PaymentFilterParams): any {
  if (!params) return undefined;
  const { pageSize, shopId, dateFrom, dateTo, ...rest } = params;
  return {
    ...rest,
    limit: pageSize,
    shopkeeperId: shopId,
    startDate: dateFrom,
    endDate: dateTo,
  };
}

function normalizePayment(raw: any): Payment {
  return {
    ...raw,
    id: raw._id || raw.id,
    shopId: raw.shopkeeperId?._id || raw.shopkeeperId || raw.shopId,
    collectedAt: raw.paymentDate || raw.collectedAt,
    collectedById: raw.collectedById || undefined,
    shopkeeperName: raw.shopkeeperName || '',
  };
}

export const paymentService = {
  async getPayments(params?: PaymentFilterParams): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    const { data } = await apiClient.get<{ payments: any[]; pagination: any }>(
      '/payments',
      { params: toBackendParams(params) }
    );
    return {
      success: true,
      data: {
        data: (data.payments || []).map(normalizePayment),
        pagination: data.pagination,
      },
      message: 'Payments fetched successfully',
    };
  },

  async getPaymentById(id: string): Promise<ApiResponse<Payment>> {
    const { data } = await apiClient.get<Payment>(`/payments/${id}`);
    return {
      success: true,
      data,
      message: 'Payment fetched successfully',
    };
  },

  async createPayment(input: CreatePaymentInput): Promise<ApiResponse<Payment>> {
    const { shopId, shopkeeperName, ...rest } = input;
    const payload = {
      ...rest,
      shopkeeperId: shopId,
      shopkeeperName: shopkeeperName || '',
      paymentDate: new Date().toISOString(),
    };
    const { data } = await apiClient.post<Payment>('/payments', payload);
    return {
      success: true,
      data,
      message: 'Payment created successfully',
    };
  },

  async collectForStore(input: {
    shopkeeperId: string;
    amount: number;
    paymentType: string;
    notes?: string;
    agencyId?: string;
    walletAmount?: number;
  }): Promise<ApiResponse<{ payments: any[]; totalApplied: number; invoicesCleared: number; walletCredited: number; walletUsed: number }>> {
    const { data } = await apiClient.post('/payments/collect', input);
    return {
      success: true,
      data,
      message: 'Payment collected successfully',
    };
  },

  async getGroupedCollections(params?: PaymentFilterParams): Promise<ApiResponse<GroupedCollectionsPage>> {
    const { data } = await apiClient.get<{ collections: GroupedCollection[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      '/payments/grouped',
      { params: toBackendParams(params) }
    );
    return {
      success: true,
      data: {
        data: data.collections || [],
        pagination: data.pagination,
      },
      message: 'Collections fetched successfully',
    };
  },

  async getCollectionSummary(params?: {
    dateFrom?: string;
    dateTo?: string;
    agencyId?: string;
    employeeId?: string;
  }): Promise<ApiResponse<CollectionSummary>> {
    const { data } = await apiClient.get<CollectionSummary>(
      '/payments/collection-summary',
      { params }
    );
    return {
      success: true,
      data,
      message: 'Collection summary fetched successfully',
    };
  },

  async getDayStats(date: string): Promise<ApiResponse<{
    clearedToday: number;
    cashAmount: number;
    onlineAmount: number;
    chequeAmount: number;
    walletWithdraw: number;
    walletDeposit: number;
  }>> {
    const { data } = await apiClient.get('/payments/day-stats', { params: { date } });
    return { success: true, data, message: 'Day stats fetched successfully' };
  },

  async getOutstandingReport(params?: {
    agencyId?: string;
    minAmount?: number;
  }): Promise<ApiResponse<OutstandingReport[]>> {
    const { data } = await apiClient.get<OutstandingReport[]>(
      '/payments/outstanding-report',
      { params }
    );
    return {
      success: true,
      data,
      message: 'Outstanding report fetched successfully',
    };
  },
};
