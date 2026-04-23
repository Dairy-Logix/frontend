import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Shop,
  Order,
  Payment,
  CreateShopkeeperInput,
  UpdateShopkeeperInput,
} from '@/lib/types';

// Normalize backend shopkeeper document to frontend Shop type
// Backend uses: flat address fields, status enum, outstandingBalance
// Backend populates amAgencyId and pmAgencyId with full agency objects via Mongoose .populate()
// Frontend uses: nested address object, isActive boolean, currentBalance
function normalizeShop(raw: any): Shop {
  // Handle AM agency - may be a populated object { _id, name, code, territory, agencyType } or a plain string
  const rawAmAgency = raw.amAgencyId;
  const isAmPopulated = typeof rawAmAgency === 'object' && rawAmAgency !== null;
  const amAgencyId = isAmPopulated ? (rawAmAgency._id || rawAmAgency.id) : (rawAmAgency || undefined);

  // Handle PM agency - may be a populated object { _id, name, code, territory, agencyType } or a plain string
  const rawPmAgency = raw.pmAgencyId;
  const isPmPopulated = typeof rawPmAgency === 'object' && rawPmAgency !== null;
  const pmAgencyId = isPmPopulated ? (rawPmAgency._id || rawPmAgency.id) : (rawPmAgency || undefined);

  return {
    id: raw._id || raw.id,
    tenantId: raw.tenantId,
    amAgencyId: amAgencyId ? String(amAgencyId) : undefined,
    amAgency: isAmPopulated ? {
      id: String(amAgencyId),
      name: rawAmAgency.name,
      location: rawAmAgency.territory || '',
      agencyType: rawAmAgency.agencyType || 'AM'
    } as any : undefined,
    pmAgencyId: pmAgencyId ? String(pmAgencyId) : undefined,
    pmAgency: isPmPopulated ? {
      id: String(pmAgencyId),
      name: rawPmAgency.name,
      location: rawPmAgency.territory || '',
      agencyType: rawPmAgency.agencyType || 'PM'
    } as any : undefined,
    ownerName: raw.ownerName || '',
    shopName: raw.shopName || '',
    phone: raw.phone || '',
    email: raw.email,
    address: typeof raw.address === 'object' && raw.address !== null
      ? raw.address
      : {
          line1: raw.address || '',
          line2: raw.address2 || undefined,
          city: raw.city || '',
          state: raw.state || '',
          pincode: raw.pincode || '',
        },
    area: raw.area || raw.city || '',
    zone: raw.zone,
    routeId: raw.routeId,
    assignedEmployeeId: raw.assignedEmployeeId,
    openingBalance: raw.openingBalance ?? 0,
    currentBalance: raw.currentBalance ?? raw.outstandingBalance ?? 0,
    walletBalance: raw.walletBalance ?? 0,
    isActive: raw.isActive ?? (raw.status === 'active'),
    hasLoginAccess: !!raw.userId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// Transform frontend input (nested address) to backend format (flat fields)
function toBackendPayload(input: any): any {
  const { address, openingBalance, phone, ...rest } = input;
  const payload: any = { ...rest };

  if (address && typeof address === 'object') {
    payload.address = [address.line1, address.line2].filter(Boolean).join(', ');
    payload.city = address.city;
    payload.state = address.state;
    payload.pincode = address.pincode;
  }

  if (openingBalance !== undefined) {
    payload.outstandingBalance = openingBalance;
  }

  if (phone !== undefined) {
    payload.phone = String(phone).replace(/\D/g, '').slice(-10);
  }

  return payload;
}

// Map frontend query params to backend query params
function toBackendParams(params?: any): any {
  if (!params) return undefined;
  const { pageSize, isActive, ...rest } = params;
  const mapped: any = { ...rest };
  if (pageSize !== undefined) mapped.limit = pageSize;
  if (isActive === true) mapped.status = 'active';
  else if (isActive === false) mapped.status = 'inactive';
  return mapped;
}

export const shopkeeperService = {
  async getShopkeepers(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Shop>>> {
    const { data } = await apiClient.get<{ shopkeepers: any[]; pagination: any }>(
      '/shopkeepers',
      { params: toBackendParams(params) }
    );
    return {
      success: true,
      data: {
        data: (data.shopkeepers || []).map(normalizeShop),
        pagination: data.pagination,
      },
      message: 'Shopkeepers fetched successfully',
    };
  },

  async getShopkeeperById(id: string): Promise<ApiResponse<Shop>> {
    const { data } = await apiClient.get<any>(`/shopkeepers/${id}`);
    return {
      success: true,
      data: normalizeShop(data),
      message: 'Shopkeeper fetched successfully',
    };
  },

  async createShopkeeper(input: CreateShopkeeperInput): Promise<ApiResponse<Shop>> {
    const { data } = await apiClient.post<any>('/shopkeepers', toBackendPayload(input));
    return {
      success: true,
      data: normalizeShop(data),
      message: 'Shopkeeper created successfully',
    };
  },

  async updateShopkeeper(id: string, input: UpdateShopkeeperInput): Promise<ApiResponse<Shop>> {
    const { data } = await apiClient.patch<any>(
      `/shopkeepers/${id}`,
      toBackendPayload(input)
    );
    return {
      success: true,
      data: normalizeShop(data),
      message: 'Shopkeeper updated successfully',
    };
  },

  async deleteShopkeeper(id: string): Promise<ApiResponse<void>> {
    await apiClient.delete(`/shopkeepers/${id}`);
    return {
      success: true,
      message: 'Shopkeeper deleted successfully',
    };
  },

  async getShopkeepersByAgency(agencyId: string): Promise<ApiResponse<Shop[]>> {
    const { data } = await apiClient.get<any[]>(`/shopkeepers/by-agency/${agencyId}`);
    return {
      success: true,
      data: (Array.isArray(data) ? data : []).map(normalizeShop),
      message: 'Shopkeepers fetched successfully',
    };
  },

  async getShopRoutes(): Promise<ApiResponse<any[]>> {
    const { data } = await apiClient.get<any[]>('/shopkeepers/routes');
    return {
      success: true,
      data: data || [],
      message: 'Routes fetched successfully',
    };
  },

  async getShopkeeperOrders(
    id: string,
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Order>>> {
    const { data } = await apiClient.get<{ orders: Order[]; pagination: any }>(
      `/shopkeepers/${id}/orders`,
      { params }
    );
    return {
      success: true,
      data: {
        data: data.orders || [],
        pagination: data.pagination,
      },
      message: 'Shopkeeper orders fetched successfully',
    };
  },

  async getShopkeeperPayments(
    id: string,
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    const { data } = await apiClient.get<{ payments: Payment[]; pagination: any }>(
      `/shopkeepers/${id}/payments`,
      { params }
    );
    return {
      success: true,
      data: {
        data: data.payments || [],
        pagination: data.pagination,
      },
      message: 'Shopkeeper payments fetched successfully',
    };
  },

  async getTotalWalletBalance(): Promise<ApiResponse<{ totalWalletBalance: number }>> {
    const { data } = await apiClient.get<{ totalWalletBalance: number }>('/shopkeepers/wallet-total');
    return { success: true, data, message: 'Wallet total fetched successfully' };
  },

  async bulkImportShopkeepers(file: File): Promise<ApiResponse<{ imported: number; errors: string[] }>> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<{ imported: number; errors: string[] }>(
      '/shopkeepers/bulk-import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return {
      success: true,
      data,
      message: 'Shopkeepers imported successfully',
    };
  },
};
