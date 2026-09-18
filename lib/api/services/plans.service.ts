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
  yearlyPriceInPaise?: number | null;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  trialDays: number;
  /** Legacy single Razorpay plan id; superseded by razorpayPlanIds. */
  razorpayPlanId?: string;
  /** Provisioned Razorpay plan ids keyed by `${period}:${amountInPaise}`. */
  razorpayPlanIds?: Record<string, string>;
  saleDiscountPercent?: number | null;
  saleStartsAt?: string | null;
  saleEndsAt?: string | null;
  saleLabel?: string | null;
  badge?: string | null;
  highlight?: boolean;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Editable fields for PATCH /admin/plans/:slug. `null` clears an optional field. */
export interface UpdatePlanInput {
  label?: string;
  description?: string;
  priceInPaise?: number;
  yearlyPriceInPaise?: number | null;
  billingPeriod?: 'monthly' | 'yearly';
  isActive?: boolean;
  isPublic?: boolean;
  sortOrder?: number;
  trialDays?: number;
  saleDiscountPercent?: number | null;
  saleStartsAt?: string | null;
  saleEndsAt?: string | null;
  saleLabel?: string | null;
  badge?: string | null;
  highlight?: boolean;
  features?: Record<string, boolean>;
  limits?: Record<string, number>;
}

export interface CreatePlanInput extends UpdatePlanInput {
  slug: string;
  label: string;
  priceInPaise: number;
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

  async create(input: CreatePlanInput): Promise<ApiResponse<AdminPlan>> {
    const { data } = await apiClient.post<AdminPlan>('/admin/plans', input);
    return { success: true, data, message: 'Plan created' };
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

  /** Archive = deactivate + hide. Server refuses while tenants are on it. */
  async archive(slug: string): Promise<ApiResponse<AdminPlan>> {
    const { data } = await apiClient.delete<AdminPlan>(`/admin/plans/${slug}`);
    return { success: true, data, message: 'Plan archived' };
  },
};
