import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Purchase,
  CreatePurchaseInput,
  BulkCreatePurchasesInput,
} from '@/lib/types';

export interface PurchaseFilterParams extends PaginationParams {
  agencyId?: string;
  startDate?: string;
  endDate?: string;
}

function mapParams(params?: PurchaseFilterParams) {
  if (!params) return undefined;
  const { pageSize, ...rest } = params;
  return { ...rest, limit: pageSize };
}

export const purchaseService = {
  async getPurchases(
    params?: PurchaseFilterParams,
  ): Promise<ApiResponse<PaginatedResponse<Purchase>>> {
    const { data } = await apiClient.get<{ purchases: Purchase[]; pagination: any }>(
      '/purchases',
      { params: mapParams(params) },
    );
    const pag = data.pagination || {};
    return {
      success: true,
      data: {
        data: data.purchases || [],
        total: pag.total ?? 0,
        page: pag.page ?? 1,
        pageSize: pag.pageSize ?? pag.limit ?? 20,
        totalPages: pag.totalPages ?? 1,
      },
      message: 'Purchases fetched successfully',
    };
  },

  async getPurchaseById(id: string): Promise<ApiResponse<Purchase>> {
    const { data } = await apiClient.get<Purchase>(`/purchases/${id}`);
    return { success: true, data, message: 'Purchase fetched successfully' };
  },

  async createPurchase(input: CreatePurchaseInput): Promise<ApiResponse<Purchase>> {
    const { data } = await apiClient.post<Purchase>('/purchases', input);
    return { success: true, data, message: 'Purchase created successfully' };
  },

  async createPurchasesBulk(
    input: BulkCreatePurchasesInput,
  ): Promise<ApiResponse<Purchase[]>> {
    const { data } = await apiClient.post<Purchase[]>('/purchases/bulk', input);
    return { success: true, data, message: 'Purchases created successfully' };
  },

  async updatePurchase(
    id: string,
    input: Partial<CreatePurchaseInput>,
  ): Promise<ApiResponse<Purchase>> {
    const { data } = await apiClient.patch<Purchase>(`/purchases/${id}`, input);
    return { success: true, data, message: 'Purchase updated successfully' };
  },

  async deletePurchase(id: string): Promise<ApiResponse<void>> {
    await apiClient.delete(`/purchases/${id}`);
    return { success: true, message: 'Purchase deleted successfully' };
  },
};
