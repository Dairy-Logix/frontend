import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';

export interface AuditEntry {
  _id: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  summary: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditPage {
  entries: AuditEntry[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface AuditQuery {
  page?: number;
  limit?: number;
  action?: string;
  search?: string;
}

export const auditService = {
  async list(params?: AuditQuery): Promise<ApiResponse<AuditPage>> {
    const { data } = await apiClient.get<AuditPage>('/admin/audit', { params });
    return { success: true, data, message: 'OK' };
  },

  async actions(): Promise<ApiResponse<string[]>> {
    const { data } = await apiClient.get<string[]>('/admin/audit/actions');
    return { success: true, data, message: 'OK' };
  },
};
