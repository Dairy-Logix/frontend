import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';
import type { PublicPlan } from './signup.service';

/** Full plan document as returned by the super-admin /admin/plans endpoints. */
export interface AdminPlan {
  _id: string;
  slug: string;
  label: string;
  description?: string;
  priceInPaise: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  trialDays: number;
  razorpayPlanId?: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Editable fields for PATCH /admin/plans/:slug. */
export interface UpdatePlanInput {
  label?: string;
  description?: string;
  priceInPaise?: number;
  razorpayPlanId?: string;
  isActive?: boolean;
  isPublic?: boolean;
  sortOrder?: number;
  trialDays?: number;
  features?: Record<string, boolean>;
  limits?: Record<string, number>;
}

export const plansService = {
  async listPublic(): Promise<ApiResponse<PublicPlan[]>> {
    const { data } = await apiClient.get<PublicPlan[]>('/public/plans');
    return { success: true, data, message: 'OK' };
  },

  // ── Super-admin plan catalog management ──────────────────────────────────
  async listAll(): Promise<ApiResponse<AdminPlan[]>> {
    const { data } = await apiClient.get<AdminPlan[]>('/admin/plans');
    return { success: true, data, message: 'OK' };
  },

  async update(
    slug: string,
    input: UpdatePlanInput,
  ): Promise<ApiResponse<AdminPlan>> {
    const { data } = await apiClient.patch<AdminPlan>(
      `/admin/plans/${slug}`,
      input,
    );
    return { success: true, data, message: 'Plan updated successfully' };
  },
};
