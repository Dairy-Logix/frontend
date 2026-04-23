import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Agency,
  CreateAgencyInput,
  UpdateAgencyInput,
} from '@/lib/types';

// Normalize backend agency document to frontend Agency type
// Backend uses: territory, status (enum), flat address fields
// Frontend uses: location, isActive (boolean), nested address object
function normalizeAgency(raw: any): Agency {
  return {
    id: raw._id || raw.id,
    tenantId: raw.tenantId,
    name: raw.name,
    location: raw.territory || raw.location || '',
    agencyType: raw.agencyType || 'AM',
    address: typeof raw.address === 'object' && raw.address !== null
      ? raw.address
      : raw.address
        ? { line1: raw.address, city: raw.city || '', state: raw.state || '', pincode: raw.pincode || '' }
        : undefined,
    contactPerson: raw.contactPerson,
    phone: raw.phone,
    email: raw.email,
    isActive: raw.isActive ?? (raw.status === 'active'),
    isAcceptingOrders: raw.isAcceptingOrders ?? false,
    employeeCount: 0,
    shopkeeperCount: raw.shopkeeperCount || 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// Map frontend CreateAgencyInput to backend DTO fields
function toBackendInput(input: CreateAgencyInput): Record<string, unknown> {
  return {
    name: input.name,
    code: input.name.replace(/\s+/g, '-').toUpperCase(),
    territory: input.location,
    agencyType: input.agencyType,
    address: input.address?.line1 || input.location || '',
    city: input.address?.city || '',
    state: input.address?.state || '',
    pincode: input.address?.pincode || '',
    contactPerson: input.contactPerson || '',
    phone: input.phone || '',
    email: input.email || undefined,
  };
}

function toBackendUpdate(input: UpdateAgencyInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.location !== undefined) payload.territory = input.location;
  if (input.agencyType !== undefined) payload.agencyType = input.agencyType;
  if (input.contactPerson !== undefined) payload.contactPerson = input.contactPerson;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.email !== undefined) payload.email = input.email;
  if (input.isActive !== undefined) payload.status = input.isActive ? 'active' : 'inactive';
  if (input.address) {
    payload.address = input.address.line1 || '';
    payload.city = input.address.city || '';
    payload.state = input.address.state || '';
    payload.pincode = input.address.pincode || '';
  }
  return payload;
}

export const agencyService = {
  async getAgencies(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Agency>>> {
    const mapped = params ? { ...params, limit: params.pageSize, pageSize: undefined } : undefined;
    const { data } = await apiClient.get<{ agencies: any[]; pagination: any }>(
      '/agencies',
      { params: mapped }
    );
    return {
      success: true,
      data: {
        data: (data.agencies || []).map(normalizeAgency),
        pagination: data.pagination,
      },
      message: 'Agencies fetched successfully',
    };
  },

  async getAgencyById(id: string): Promise<ApiResponse<Agency>> {
    const { data } = await apiClient.get<any>(`/agencies/${id}`);
    return {
      success: true,
      data: normalizeAgency(data),
      message: 'Agency fetched successfully',
    };
  },

  async createAgency(input: CreateAgencyInput): Promise<ApiResponse<Agency>> {
    const { data } = await apiClient.post<any>('/agencies', toBackendInput(input));
    return {
      success: true,
      data: normalizeAgency(data),
      message: 'Agency created successfully',
    };
  },

  async updateAgency(id: string, input: UpdateAgencyInput): Promise<ApiResponse<Agency>> {
    const { data } = await apiClient.patch<any>(`/agencies/${id}`, toBackendUpdate(input));
    return {
      success: true,
      data: normalizeAgency(data),
      message: 'Agency updated successfully',
    };
  },

  async deleteAgency(id: string): Promise<ApiResponse<void>> {
    await apiClient.delete(`/agencies/${id}`);
    return {
      success: true,
      message: 'Agency deleted successfully',
    };
  },

  async toggleAcceptingOrders(id: string, isAcceptingOrders: boolean): Promise<ApiResponse<Agency>> {
    const { data } = await apiClient.patch<any>(`/agencies/${id}/accepting-orders`, { isAcceptingOrders });
    return {
      success: true,
      data: normalizeAgency(data),
      message: isAcceptingOrders ? 'Orders enabled' : 'Orders disabled',
    };
  },
};
