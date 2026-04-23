import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  SuperAdminDashboardStats,
  TenantDashboardStats,
} from '@/lib/types';

export const dashboardService = {
  /**
   * Get Super Admin dashboard statistics
   */
  async getSuperAdminStats(): Promise<ApiResponse<SuperAdminDashboardStats>> {
    const { data } = await apiClient.get<SuperAdminDashboardStats>(
      '/dashboard/super-admin'
    );
    return {
      success: true,
      data,
      message: 'Dashboard stats fetched successfully',
    };
  },

  /**
   * Get Tenant dashboard statistics
   */
  async getTenantStats(): Promise<ApiResponse<TenantDashboardStats>> {
    const { data } = await apiClient.get<TenantDashboardStats>(
      '/dashboard/tenant'
    );
    return {
      success: true,
      data,
      message: 'Dashboard stats fetched successfully',
    };
  },
};
