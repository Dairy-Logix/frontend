import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Invoice,
  InvoiceStatus,
  CreateInvoiceInput,
} from '@/lib/types';

export interface InvoiceFilterParams extends PaginationParams {
  status?: InvoiceStatus;
  shopId?: string;
  agencyId?: string;
  dateFrom?: string;
  dateTo?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  dueDate?: string;
  notes?: string;
}

function toBackendParams(params?: InvoiceFilterParams): any {
  if (!params) return undefined;
  const { pageSize, shopId, dateFrom, dateTo, ...rest } = params;
  return {
    ...rest,
    limit: pageSize,
    shopkeeperId: shopId,
    startDate: dateFrom || rest.startDate,
    endDate: dateTo || rest.endDate,
  };
}

function normalizeItem(item: any): any {
  return {
    id: item._id || item.id || '',
    invoiceId: '',
    productId: item.productId || '',
    productName: item.productName || '',
    productCode: item.productCode || '',
    quantity: item.quantity ?? 0,
    unit: item.unit || '',
    unitPrice: item.price ?? item.unitPrice ?? 0,
    totalPrice: item.subtotal ?? item.total ?? item.totalPrice ?? 0,
  };
}

function normalize(raw: any): any {
  return {
    ...raw,
    id: raw._id || raw.id,
    shopId: raw.shopkeeperId?._id || raw.shopkeeperId || raw.shopId,
    shopkeeperName: raw.shopkeeperName || raw.shopName || '',
    issuedAt: raw.invoiceDate || raw.issuedAt || raw.createdAt,
    paidAt: raw.paidDate || raw.paidAt,
    totalAmount: raw.total ?? raw.totalAmount ?? raw.amount ?? 0,
    paidAmount: raw.amountPaid ?? raw.paidAmount ?? 0,
    dueAmount: raw.amountDue ?? raw.dueAmount ?? 0,
    taxAmount: raw.tax ?? raw.taxAmount ?? 0,
    subtotal: raw.subtotal ?? 0,
    items: (raw.items || []).map(normalizeItem),
  };
}

export const invoiceService = {
  async getInvoices(params?: InvoiceFilterParams): Promise<ApiResponse<PaginatedResponse<Invoice>>> {
    const { data } = await apiClient.get<{ data: any[]; meta: any; totals?: any }>(
      '/invoices',
      { params: toBackendParams(params) }
    );
    return {
      success: true,
      data: {
        data: (data.data || []).map(normalize),
        pagination: data.meta,
        totals: data.totals,
      },
      message: 'Invoices fetched successfully',
    };
  },

  async getInvoiceById(id: string): Promise<ApiResponse<Invoice>> {
    const { data } = await apiClient.get<any>(`/invoices/${id}`);
    return {
      success: true,
      data: normalize(data),
      message: 'Invoice fetched successfully',
    };
  },

  async createInvoice(input: CreateInvoiceInput): Promise<ApiResponse<Invoice>> {
    const { data } = await apiClient.post<any>('/invoices', input);
    return {
      success: true,
      data: normalize(data),
      message: 'Invoice created successfully',
    };
  },

  async generateFromOrder(orderId: string): Promise<ApiResponse<Invoice>> {
    const { data } = await apiClient.post<any>(`/invoices/generate-from-order/${orderId}`);
    return {
      success: true,
      data: normalize(data),
      message: 'Invoice generated successfully',
    };
  },

  async updateInvoice(id: string, input: UpdateInvoiceInput): Promise<ApiResponse<Invoice>> {
    const { data } = await apiClient.patch<any>(`/invoices/${id}`, input);
    return {
      success: true,
      data: normalize(data),
      message: 'Invoice updated successfully',
    };
  },

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<ApiResponse<Invoice>> {
    const { data } = await apiClient.patch<any>(`/invoices/${id}`, { status });
    return {
      success: true,
      data: normalize(data),
      message: 'Invoice status updated successfully',
    };
  },

  async recordPayment(id: string, amountPaid: number): Promise<ApiResponse<Invoice>> {
    const { data } = await apiClient.patch<any>(`/invoices/${id}/payment`, { amountPaid });
    return {
      success: true,
      data: normalize(data),
      message: 'Payment recorded successfully',
    };
  },

  async deleteInvoice(id: string): Promise<ApiResponse<void>> {
    await apiClient.delete(`/invoices/${id}`);
    return {
      success: true,
      message: 'Invoice deleted successfully',
    };
  },

  async downloadInvoicePdf(id: string): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return data;
  },

  async getPendingByStore(params?: {
    agencyId?: string;
    search?: string;
    groupByAgency?: boolean;
    shopkeeperId?: string;
  }): Promise<ApiResponse<PendingStoreBalance[]>> {
    const { data } = await apiClient.get<PendingStoreBalance[]>('/invoices/pending-by-store', {
      params: {
        ...params,
        groupByAgency: params?.groupByAgency ? 'true' : undefined,
      },
    });
    return {
      success: true,
      data: data || [],
      message: 'Pending balances fetched successfully',
    };
  },
};

export interface PendingStoreBalance {
  id: string;
  shopkeeperId: string;
  shopkeeperName: string;
  agencyId?: string;
  agencyName?: string;
  walletBalance: number;
  totalDue: number;
  dueAmount: number;
  overdueAmount: number;
  totalAmount: number;
  invoiceCount: number;
  overdueCount: number;
  oldestInvoiceDate?: string;
  oldestDueDate?: string;
}
