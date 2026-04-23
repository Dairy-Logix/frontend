import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  TenantSettings,
  UpdateSettingsInput,
} from '@/lib/types';

export const settingsService = {
  async getTenantSettings(): Promise<ApiResponse<TenantSettings>> {
    const { data } = await apiClient.get<TenantSettings>('/settings');
    return {
      success: true,
      data,
      message: 'Tenant settings fetched successfully',
    };
  },

  async updateTenantSettings(input: UpdateSettingsInput): Promise<ApiResponse<TenantSettings>> {
    const { data } = await apiClient.put<TenantSettings>('/settings', input);
    return {
      success: true,
      data,
      message: 'Tenant settings updated successfully',
    };
  },
};
