import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';

export interface PlatformSettings {
  allowNewSignups: boolean;
  maintenanceMode: boolean;
  announcement: string;
  announcementActive: boolean;
}

export interface IntegrationStatus {
  key: string;
  label: string;
  configured: boolean;
  detail?: string;
}

export type UpdatePlatformSettingsInput = Partial<PlatformSettings>;

/** Unauthenticated platform state for the app shell (banners, signup gating). */
export interface PublicPlatformStatus {
  allowNewSignups: boolean;
  maintenanceMode: boolean;
  announcement: string;
}

export const platformService = {
  async getSettings(): Promise<ApiResponse<PlatformSettings>> {
    const { data } = await apiClient.get<PlatformSettings>('/admin/platform/settings');
    return { success: true, data, message: 'OK' };
  },

  async updateSettings(
    input: UpdatePlatformSettingsInput,
  ): Promise<ApiResponse<PlatformSettings>> {
    const { data } = await apiClient.patch<PlatformSettings>(
      '/admin/platform/settings',
      input,
    );
    return { success: true, data, message: 'Platform settings saved' };
  },

  async getIntegrations(): Promise<ApiResponse<IntegrationStatus[]>> {
    const { data } = await apiClient.get<IntegrationStatus[]>(
      '/admin/platform/integrations',
    );
    return { success: true, data, message: 'OK' };
  },

  async getStatus(): Promise<ApiResponse<PublicPlatformStatus>> {
    const { data } = await apiClient.get<PublicPlatformStatus>(
      '/public/platform-status',
    );
    return { success: true, data, message: 'OK' };
  },
};
