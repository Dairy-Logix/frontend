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
  search?: string;
  shopId?: string;
  agencyId?: string;
  employeeId?: string;
  collectedById?: string;
  paymentType?: string;
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
  summary?: {
    sessionCount: number;
    totalAmount: number;
    invoiceTotal: number;
    actualReceived: number;
    walletUsed: number;
    walletCredited: number;
    cash: number;
    upi: number;
    cheque: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaymentCorrectionRequest {
  _id: string;
  collectionId: string;
  tenantId: string;
  shopkeeperId: string;
  shopkeeperName: string;
  originalAmount: number;
  requestedAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedById: string;
  requestedByName: string;
  requestedAt: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNote?: string;
  approvedCollectionId?: string;
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

type BackendPaymentParams = Omit<PaymentFilterParams, 'pageSize' | 'shopId' | 'dateFrom' | 'dateTo'> & {
  limit?: number;
  shopkeeperId?: string;
  startDate?: string;
  endDate?: string;
};

type BackendPayment = Payment & {
  _id?: string;
  shopkeeperId?: string | { _id?: string };
  paymentDate?: string;
};

interface BackendPaymentsPage {
  payments: BackendPayment[];
  pagination: PaginatedResponse<Payment>['pagination'];
}

export interface CollectForStoreResult {
  payments: Payment[];
  totalApplied: number;
  invoicesCleared: number;
  walletCredited: number;
  walletUsed: number;
}

function toBackendParams(params?: PaymentFilterParams): BackendPaymentParams | undefined {
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

function normalizePayment(raw: BackendPayment): Payment {
  const shopkeeperId =
    typeof raw.shopkeeperId === 'string'
      ? raw.shopkeeperId
      : raw.shopkeeperId?._id;

  return {
    ...raw,
    id: raw._id || raw.id,
    shopId: shopkeeperId || raw.shopId,
    collectedAt: raw.paymentDate || raw.collectedAt,
    collectedById: raw.collectedById || undefined,
    shopkeeperName: raw.shopkeeperName || '',
  };
}

export const paymentService = {
  async getPayments(params?: PaymentFilterParams): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    const { data } = await apiClient.get<BackendPaymentsPage>(
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

  async recordInvoicePayment(input: {
    invoiceId: string;
    amount: number;
    paymentType?: CreatePaymentInput['paymentType'];
    notes?: string;
  }): Promise<ApiResponse<Payment>> {
    const { data } = await apiClient.post<Payment>('/payments/record', {
      invoiceId: input.invoiceId,
      amount: input.amount,
      paymentDetails: {
        paymentType: input.paymentType ?? 'cash',
        paymentDate: new Date().toISOString(),
        notes: input.notes,
      },
    });
    return {
      success: true,
      data,
      message: 'Payment recorded successfully',
    };
  },

  async collectForStore(input: {
    shopkeeperId: string;
    amount: number;
    paymentType: string;
    notes?: string;
    agencyId?: string;
    walletAmount?: number;
  }): Promise<ApiResponse<CollectForStoreResult>> {
    const { data } = await apiClient.post<CollectForStoreResult>('/payments/collect', input);
    return {
      success: true,
      data,
      message: 'Payment collected successfully',
    };
  },

  async getGroupedCollections(params?: PaymentFilterParams): Promise<ApiResponse<GroupedCollectionsPage>> {
    const { data } = await apiClient.get<{
      collections: GroupedCollection[];
      summary?: GroupedCollectionsPage['summary'];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(
      '/payments/grouped',
      { params: toBackendParams(params) }
    );
    return {
      success: true,
      data: {
        data: data.collections || [],
        summary: data.summary,
        pagination: data.pagination,
      },
      message: 'Collections fetched successfully',
    };
  },

  async getCorrectionRequests(status: 'pending' | 'approved' | 'rejected' | 'cancelled' = 'pending'): Promise<ApiResponse<PaymentCorrectionRequest[]>> {
    const { data } = await apiClient.get<PaymentCorrectionRequest[]>('/payments/corrections', { params: { status } });
    return { success: true, data, message: 'Correction requests fetched successfully' };
  },

  async approveCorrection(id: string, reviewNote?: string): Promise<ApiResponse<PaymentCorrectionRequest>> {
    const { data } = await apiClient.post<PaymentCorrectionRequest>(`/payments/corrections/${id}/approve`, { reviewNote });
    return { success: true, data, message: 'Correction approved successfully' };
  },

  async rejectCorrection(id: string, reviewNote?: string): Promise<ApiResponse<PaymentCorrectionRequest>> {
    const { data } = await apiClient.post<PaymentCorrectionRequest>(`/payments/corrections/${id}/reject`, { reviewNote });
    return { success: true, data, message: 'Correction rejected' };
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
