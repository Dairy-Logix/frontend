import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  FactoryOrder,
  FactoryPayment,
  FactoryProduct,
  CreateFactoryOrderInput,
  CreateFactoryPaymentInput,
} from '@/lib/types';

export interface FactoryOrderFilterParams extends PaginationParams {
  factoryName?: string;
  agencyId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProfitMargin {
  productId: string;
  productName: string;
  factoryPrice: number;
  distributorPrice: number;
  shopkeeperPrice: number;
  marginAmount: number;
  marginPercentage: number;
}

function mapParams(params?: any): any {
  if (!params) return undefined;
  const { pageSize, dateFrom, dateTo, ...rest } = params;
  return { ...rest, limit: pageSize, startDate: dateFrom, endDate: dateTo };
}

export const factoryService = {
  async getFactoryOrders(
    params?: FactoryOrderFilterParams
  ): Promise<ApiResponse<PaginatedResponse<FactoryOrder>>> {
    const { data } = await apiClient.get<PaginatedResponse<FactoryOrder>>(
      '/factory/orders',
      { params: mapParams(params) }
    );
    return {
      success: true,
      data,
      message: 'Factory orders fetched successfully',
    };
  },

  async getFactoryOrderById(id: string): Promise<ApiResponse<FactoryOrder>> {
    const { data } = await apiClient.get<FactoryOrder>(
      `/factory/orders/${id}`
    );
    return {
      success: true,
      data,
      message: 'Factory order fetched successfully',
    };
  },

  async createFactoryOrder(
    input: CreateFactoryOrderInput
  ): Promise<ApiResponse<FactoryOrder>> {
    const { data } = await apiClient.post<FactoryOrder>(
      '/factory/orders',
      input
    );
    return {
      success: true,
      data,
      message: 'Factory order created successfully',
    };
  },

  async updateFactoryOrder(
    id: string,
    input: Partial<CreateFactoryOrderInput> & { status?: string }
  ): Promise<ApiResponse<FactoryOrder>> {
    const { data } = await apiClient.put<FactoryOrder>(
      `/factory/orders/${id}`,
      input
    );
    return {
      success: true,
      data,
      message: 'Factory order updated successfully',
    };
  },

  async getFactoryPayments(
    params?: PaginationParams & { factoryName?: string; dateFrom?: string; dateTo?: string }
  ): Promise<ApiResponse<PaginatedResponse<FactoryPayment>>> {
    const { data } = await apiClient.get<PaginatedResponse<FactoryPayment>>(
      '/factory/payments',
      { params: mapParams(params) }
    );
    return {
      success: true,
      data,
      message: 'Factory payments fetched successfully',
    };
  },

  async createFactoryPayment(
    input: CreateFactoryPaymentInput
  ): Promise<ApiResponse<FactoryPayment>> {
    const { data } = await apiClient.post<FactoryPayment>(
      '/factory/payments',
      input
    );
    return {
      success: true,
      data,
      message: 'Factory payment created successfully',
    };
  },

  async getFactoryProducts(
    params?: PaginationParams & { factoryName?: string }
  ): Promise<ApiResponse<PaginatedResponse<FactoryProduct>>> {
    const { data } = await apiClient.get<PaginatedResponse<FactoryProduct>>(
      '/factory/products',
      { params: mapParams(params) }
    );
    return {
      success: true,
      data,
      message: 'Factory products fetched successfully',
    };
  },

  async getProfitMargins(params?: {
    agencyId?: string;
    categoryId?: string;
  }): Promise<ApiResponse<ProfitMargin[]>> {
    const { data } = await apiClient.get<ProfitMargin[]>(
      '/factory/profit-margins',
      { params }
    );
    return {
      success: true,
      data,
      message: 'Profit margins fetched successfully',
    };
  },
};
