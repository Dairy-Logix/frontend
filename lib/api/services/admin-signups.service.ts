import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';

export type SignupIntentStatus =
  | 'pending_verification'
  | 'trialing'
  | 'activated'
  | 'abandoned'
  | 'enterprise_lead';

export interface SignupIntent {
  _id: string;
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessType?: string;
  city?: string;
  state?: string;
  planSlug: string;
  status: SignupIntentStatus;
  emailVerifiedAt?: string;
  activatedTenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignupLeadsPage {
  signups: SignupIntent[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface SignupStats {
  total: number;
  byStatus: Partial<Record<SignupIntentStatus, number>>;
}

export interface SignupLeadsQuery {
  page?: number;
  limit?: number;
  status?: SignupIntentStatus;
  search?: string;
}

export const adminSignupsService = {
  async list(params?: SignupLeadsQuery): Promise<ApiResponse<SignupLeadsPage>> {
    const { data } = await apiClient.get<SignupLeadsPage>('/admin/signups', { params });
    return { success: true, data, message: 'OK' };
  },

  async stats(): Promise<ApiResponse<SignupStats>> {
    const { data } = await apiClient.get<SignupStats>('/admin/signups/stats');
    return { success: true, data, message: 'OK' };
  },
};
