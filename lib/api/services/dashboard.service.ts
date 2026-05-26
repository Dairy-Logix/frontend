import { apiClient } from '@/lib/api/client';
import type {
  ApiResponse,
  SuperAdminDashboardStats,
  TenantDashboardStats,
  TenantAnalytics,
  AnalyticsQuery,
  TopProductsQuery,
  TopProductsResult,
} from '@/lib/types';

export const dashboardService = {
  /**
   * Get Super Admin dashboard statistics
   */
  async getSuperAdminStats(
    includeDemo = false,
  ): Promise<ApiResponse<SuperAdminDashboardStats>> {
    const { data } = await apiClient.get<SuperAdminDashboardStats>(
      '/dashboard/super-admin',
      { params: includeDemo ? { includeDemo: true } : undefined },
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

  /**
   * Get tenant analytics (5 charts) filtered by range/agency.
   */
  async getTenantAnalytics(
    query: AnalyticsQuery,
  ): Promise<ApiResponse<TenantAnalytics>> {
    const params: Record<string, string> = { range: query.range };
    if (query.from) params.from = query.from;
    if (query.to) params.to = query.to;
    if (query.agencyId) params.agencyId = query.agencyId;
    const { data } = await apiClient.get<TenantAnalytics>(
      '/dashboard/tenant/analytics',
      { params },
    );
    return { success: true, data };
  },

  /**
   * Get top products ranked by chosen criterion.
   */
  async getTopProducts(
    query: TopProductsQuery,
  ): Promise<ApiResponse<TopProductsResult>> {
    const params: Record<string, string> = { criterion: query.criterion };
    if (query.days) params.days = String(query.days);
    if (query.limit) params.limit = String(query.limit);
    if (query.agencyId) params.agencyId = query.agencyId;
    const { data } = await apiClient.get<TopProductsResult>(
      '/dashboard/tenant/top-products',
      { params },
    );
    return { success: true, data };
  },
};
