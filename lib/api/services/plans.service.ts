import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';
import type { PublicPlan } from './signup.service';

export const plansService = {
  async listPublic(): Promise<ApiResponse<PublicPlan[]>> {
    const { data } = await apiClient.get<PublicPlan[]>('/public/plans');
    return { success: true, data, message: 'OK' };
  },
};
