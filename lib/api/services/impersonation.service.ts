import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';

export interface ImpersonationStart {
  token: string;
  expiresInSeconds: number;
  tenant: { id: string; slug: string; name: string; logo?: string };
}

export const impersonationService = {
  async start(tenantId: string): Promise<ApiResponse<ImpersonationStart>> {
    const { data } = await apiClient.post<ImpersonationStart>(
      `/admin/impersonation/${tenantId}`,
    );
    return { success: true, data, message: 'OK' };
  },
};
