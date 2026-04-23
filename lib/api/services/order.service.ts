import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Order,
  OrderStatus,
  CreateOrderInput,
  UpdateOrderInput,
} from '@/lib/types';

export interface AggregateOrderQuantities {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  totalQuantity: number;
  unit: string;
}

export interface OrderFilterParams extends PaginationParams {
  status?: OrderStatus;
  shopId?: string;
  agencyId?: string;
  dateFrom?: string;
  dateTo?: string;
  needsInvoice?: boolean;
}

function toBackendParams(params?: OrderFilterParams): any {
  if (!params) return undefined;
  const { pageSize, shopId, dateFrom, dateTo, needsInvoice, ...rest } = params;
  return {
    ...rest,
    limit: pageSize,
    shopkeeperId: shopId,
    startDate: dateFrom,
    endDate: dateTo,
    needsInvoice: needsInvoice ? 'true' : undefined,
  };
}

function normalizeOrderItem(item: any): any {
  return {
    ...item,
    productId: item.productId?._id || item.productId,
    unitPrice: item.price ?? item.unitPrice,
    totalPrice: item.total ?? item.totalPrice,
  };
}

function normalizeStatus(status: string): string {
  if (status === 'pending') return 'placed';
  return status;
}

function normalize(raw: any): any {
  return {
    ...raw,
    id: raw._id || raw.id,
    shopId: raw.shopkeeperId?._id || raw.shopkeeperId || raw.shopId,
    shopkeeperName: raw.shopkeeperName || '',
    placedAt: raw.placedAt || raw.createdAt,
    status: normalizeStatus(raw.status),
    items: (raw.items || []).map(normalizeOrderItem),
  };
}

/** Convert frontend create/update input to backend DTO shape */
function toBackendOrderInput(input: any): any {
  const result: any = { ...input };

  // shopId → shopkeeperId
  if (result.shopId) {
    result.shopkeeperId = result.shopId;
    delete result.shopId;
  }

  // Strip item fields that backend calculates itself
  if (result.items) {
    result.items = result.items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      ...(item.discount != null ? { discount: item.discount } : {}),
    }));
  }

  return result;
}

export const orderService = {
  async getOrders(params?: OrderFilterParams): Promise<ApiResponse<PaginatedResponse<Order>>> {
    const { data } = await apiClient.get<{ orders: any[]; pagination: any }>(
      '/orders',
      { params: toBackendParams(params) }
    );
    return {
      success: true,
      data: {
        data: (data.orders || []).map(normalize),
        pagination: data.pagination,
      },
      message: 'Orders fetched successfully',
    };
  },

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    const { data } = await apiClient.get<any>(`/orders/${id}`);
    return {
      success: true,
      data: normalize(data),
      message: 'Order fetched successfully',
    };
  },

  async createOrder(input: CreateOrderInput): Promise<ApiResponse<Order>> {
    const { data } = await apiClient.post<Order>('/orders', toBackendOrderInput(input));
    return {
      success: true,
      data,
      message: 'Order created successfully',
    };
  },

  async updateOrder(id: string, input: UpdateOrderInput): Promise<ApiResponse<Order>> {
    const { data } = await apiClient.patch<Order>(`/orders/${id}`, toBackendOrderInput(input));
    return {
      success: true,
      data,
      message: 'Order updated successfully',
    };
  },

  async updateOrderStatus(
    id: string,
    status: OrderStatus
  ): Promise<ApiResponse<Order>> {
    const { data } = await apiClient.patch<Order>(
      `/orders/${id}/status`,
      { status }
    );
    return {
      success: true,
      data,
      message: 'Order status updated successfully',
    };
  },

  async deleteOrder(id: string): Promise<ApiResponse<void>> {
    await apiClient.delete(`/orders/${id}`);
    return {
      success: true,
      data: undefined,
      message: 'Order deleted successfully',
    };
  },

  async getAggregateOrderQuantities(params?: {
    dateFrom?: string;
    dateTo?: string;
    agencyId?: string;
  }): Promise<ApiResponse<AggregateOrderQuantities[]>> {
    const { data } = await apiClient.get<AggregateOrderQuantities[]>(
      '/orders/aggregate-quantities',
      { params }
    );
    return {
      success: true,
      data,
      message: 'Aggregate order quantities fetched successfully',
    };
  },
};
