import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Delivery,
  DeliveryStatus,
  DeliveryTracking,
  CreateDeliveryInput,
} from '@/lib/types';

export interface DeliveryFilterParams extends PaginationParams {
  status?: DeliveryStatus;
  employeeId?: string;
  agencyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function toBackendParams(params?: DeliveryFilterParams): any {
  if (!params) return undefined;
  const { pageSize, dateFrom, dateTo, ...rest } = params;
  return {
    ...rest,
    limit: pageSize,
    startDate: dateFrom,
    endDate: dateTo,
  };
}

function normalizeStatus(status: string): string {
  if (status === 'scheduled') return 'pending';
  return status;
}

function normalize(raw: any): any {
  return {
    ...raw,
    id: raw._id || raw.id,
    agencyId: raw.agencyId?._id || raw.agencyId || '',
    agencyName: raw.agencyName || '',
    scheduledDate: raw.scheduledDate || raw.deliveryDate,
    deliveredAt: raw.actualDeliveryTime || raw.deliveredAt,
    photoProof: raw.deliveryProof || raw.photoProof,
    employeeId: raw.employeeId?._id || raw.employeeId || '',
    employeeName: raw.employeeName || '',
    status: normalizeStatus(raw.status),
    routeShops: (raw.routeShops || []).map((rs: any) => ({
      shopId: rs.shopId?._id || rs.shopId,
      shopName: rs.shopName || '',
      sequence: rs.sequence,
      status: rs.status || 'pending',
    })),
    trackingHistory: raw.trackingHistory || [],
  };
}

export const deliveryService = {
  async getDeliveries(params?: DeliveryFilterParams): Promise<ApiResponse<PaginatedResponse<Delivery>>> {
    const { data } = await apiClient.get<{ deliveries: any[]; pagination: any }>(
      '/deliveries',
      { params: toBackendParams(params) }
    );
    return {
      success: true,
      data: {
        data: (data.deliveries || []).map(normalize),
        pagination: data.pagination,
      },
      message: 'Deliveries fetched successfully',
    };
  },

  async getDeliveryById(id: string): Promise<ApiResponse<Delivery>> {
    const { data } = await apiClient.get<Delivery>(`/deliveries/${id}`);
    return {
      success: true,
      data,
      message: 'Delivery fetched successfully',
    };
  },

  async createDelivery(input: CreateDeliveryInput): Promise<ApiResponse<Delivery>> {
    const { data } = await apiClient.post<any>('/deliveries', input);
    return {
      success: true,
      data: normalize(data),
      message: 'Delivery created successfully',
    };
  },

  async updateDeliveryStatus(
    id: string,
    status: DeliveryStatus,
    notes?: string
  ): Promise<ApiResponse<Delivery>> {
    const { data } = await apiClient.patch<Delivery>(
      `/deliveries/${id}/status`,
      { status, notes }
    );
    return {
      success: true,
      data,
      message: 'Delivery status updated successfully',
    };
  },

  async getDeliveryTracking(id: string): Promise<ApiResponse<DeliveryTracking[]>> {
    const { data } = await apiClient.get<DeliveryTracking[]>(
      `/deliveries/${id}/tracking`
    );
    return {
      success: true,
      data,
      message: 'Delivery tracking fetched successfully',
    };
  },

  async getBookedShops(agencyId: string, date: string): Promise<string[]> {
    const { data } = await apiClient.get<string[]>('/deliveries/booked-shops', {
      params: { agencyId, date },
    });
    return Array.isArray(data) ? data : [];
  },
};
