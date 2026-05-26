import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Tenant,
  TenantConfig,
  CreateTenantInput,
  UpdateTenantInput,
} from '@/lib/types';

// Backend returns Mongo documents keyed by `_id`; the frontend Tenant type uses
// `id`. Dropdowns/links that read `tenant.id` (e.g. the user filter and the
// create-user tenant picker) get `undefined` without this.
function normalizeTenant(raw: Tenant & { _id?: string }): Tenant {
  return { ...raw, id: raw?._id || raw?.id };
}

export const tenantService = {
  async getTenants(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Tenant>>> {
    const { data } = await apiClient.get<{ tenants: Tenant[]; pagination: any }>(
      '/tenants',
      { params }
    );
    return {
      success: true,
      data: {
        data: (data.tenants || []).map(normalizeTenant),
        pagination: data.pagination,
      },
      message: 'Tenants fetched successfully',
    };
  },

  async getTenantById(id: string): Promise<ApiResponse<Tenant>> {
    const { data } = await apiClient.get<Tenant>(`/tenants/${id}`);
    return {
      success: true,
      data,
      message: 'Tenant fetched successfully',
    };
  },

  async createTenant(input: CreateTenantInput): Promise<ApiResponse<Tenant>> {
    const { data } = await apiClient.post<Tenant>('/tenants', input);
    return {
      success: true,
      data,
      message: 'Tenant created successfully',
    };
  },

  async updateTenant(id: string, input: UpdateTenantInput): Promise<ApiResponse<Tenant>> {
    const { data } = await apiClient.patch<Tenant>(`/tenants/${id}`, input);
    return {
      success: true,
      data,
      message: 'Tenant updated successfully',
    };
  },

  async changePlan(id: string, planSlug: string): Promise<ApiResponse<Tenant>> {
    const { data } = await apiClient.patch<Tenant>(`/tenants/${id}/plan`, {
      planSlug,
    });
    return {
      success: true,
      data,
      message: 'Plan changed successfully',
    };
  },

  async deleteTenant(id: string): Promise<ApiResponse<void>> {
    const { data } = await apiClient.delete<{ message: string }>(`/tenants/${id}`);
    return {
      success: true,
      data: undefined,
      message: data.message || 'Tenant deleted successfully',
    };
  },

  async getTenantConfig(id: string): Promise<ApiResponse<TenantConfig>> {
    const { data } = await apiClient.get<TenantConfig>(
      `/tenants/${id}/config`
    );
    return {
      success: true,
      data,
      message: 'Tenant config fetched successfully',
    };
  },

  async updateTenantConfig(
    id: string,
    config: Partial<TenantConfig>
  ): Promise<ApiResponse<TenantConfig>> {
    const { data } = await apiClient.put<TenantConfig>(
      `/tenants/${id}/config`,
      config
    );
    return {
      success: true,
      data,
      message: 'Tenant config updated successfully',
    };
  },

  async getTenantStats(id: string): Promise<ApiResponse<any>> {
    const { data } = await apiClient.get<any>(`/tenants/${id}/stats`);
    return {
      success: true,
      data,
      message: 'Tenant stats fetched successfully',
    };
  },
};
