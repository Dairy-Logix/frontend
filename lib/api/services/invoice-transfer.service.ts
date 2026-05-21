import { apiClient } from '@/lib/api/client';
import type { ApiResponse, PaginatedResponse } from '@/lib/types';

export interface TransferItemInput {
  productCode: string;
  quantity: number;
}

export interface CreateTransferInput {
  giverShopkeeperId: string;
  giverInvoiceId?: string;
  receiverShopkeeperId: string;
  receiverInvoiceId?: string;
  items: TransferItemInput[];
  notes?: string;
}

export interface ReverseTransferInput {
  notes?: string;
}

export interface TransferLineItem {
  productName: string;
  productCode: string;
  quantity: number;
  unit: string;
  quantityPerUnit?: number;
  unitPrice: number;
  price: number;
  subtotal: number;
}

export interface TransferParty {
  shopkeeperId: string;
  shopkeeperName: string;
  agencyId?: string;
  agencyName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceCreated?: boolean;
}

export interface InvoiceTransfer {
  id: string;
  transferNumber: string;
  tenantId: string;
  transferDate: string;
  status: 'pending' | 'completed' | 'reversed' | 'failed';
  total: number;
  subtotal: number;
  discount: number;
  items: TransferLineItem[];
  giver: TransferParty;
  receiver: TransferParty;
  giverSettlement?: {
    mode: 'invoice_reduction' | 'wallet_credit' | 'split';
    invoiceReductionAmount: number;
    walletCreditAmount: number;
  };
  reversedAt?: string;
  reversalNotes?: string;
  createdByName?: string;
  createdByRole?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferPreview {
  items: TransferLineItem[];
  total: number;
  giverInvoiceBefore: any;
  giverInvoiceAfter: any;
  receiverInvoiceBefore: any | null;
  receiverInvoiceAfter: any;
  receiverInvoiceWillBeCreated: boolean;
  giverSettlement: {
    mode: 'invoice_reduction' | 'wallet_credit' | 'split';
    invoiceReductionAmount: number;
    walletCreditAmount: number;
  };
  giverWalletBalanceAfter: number;
}

export interface GiverItemRow {
  productCode: string;
  productName: string;
  unit: string;
  quantityPerUnit: number;
  unitPrice: number;
  pricePerUnit: number;
  orderQty: number;
  alreadyTransferredQty: number;
  availableQty: number;
}

export interface GiverItemsResponse {
  shopkeeperId: string;
  shopkeeperName: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  todayInvoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    amountDue: number;
    total: number;
  } | null;
  items: GiverItemRow[];
}

export interface TransferFilterParams {
  page?: number;
  limit?: number;
  giverShopkeeperId?: string;
  receiverShopkeeperId?: string;
  shopkeeperId?: string;
  status?: 'pending' | 'completed' | 'reversed' | 'failed';
  startDate?: string;
  endDate?: string;
}

export const invoiceTransferService = {
  async giverItems(shopkeeperId: string): Promise<ApiResponse<GiverItemsResponse>> {
    const { data } = await apiClient.get<GiverItemsResponse>(
      '/invoice-transfers/giver-items',
      { params: { shopkeeperId } },
    );
    return { success: true, data, message: 'Giver items fetched' };
  },

  async preview(input: CreateTransferInput): Promise<ApiResponse<TransferPreview>> {
    const { data } = await apiClient.post<TransferPreview>(
      '/invoice-transfers/preview',
      input,
    );
    return { success: true, data, message: 'Preview generated' };
  },

  async create(input: CreateTransferInput): Promise<ApiResponse<InvoiceTransfer>> {
    const { data } = await apiClient.post<InvoiceTransfer>(
      '/invoice-transfers',
      input,
    );
    return { success: true, data, message: 'Transfer created' };
  },

  async list(
    params?: TransferFilterParams,
  ): Promise<ApiResponse<PaginatedResponse<InvoiceTransfer>>> {
    const { data } = await apiClient.get<{
      data: InvoiceTransfer[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>('/invoice-transfers', { params });
    const p = data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 };
    return {
      success: true,
      data: {
        data: data.data,
        total: p.total,
        page: p.page,
        pageSize: p.limit,
        totalPages: p.totalPages,
      },
      message: 'Transfers fetched',
    };
  },

  async findOne(id: string): Promise<ApiResponse<InvoiceTransfer>> {
    const { data } = await apiClient.get<InvoiceTransfer>(
      `/invoice-transfers/${id}`,
    );
    return { success: true, data, message: 'Transfer fetched' };
  },

  async reverse(
    id: string,
    input: ReverseTransferInput,
  ): Promise<ApiResponse<InvoiceTransfer>> {
    const { data } = await apiClient.post<InvoiceTransfer>(
      `/invoice-transfers/${id}/reverse`,
      input,
    );
    return { success: true, data, message: 'Transfer reversed' };
  },
};
