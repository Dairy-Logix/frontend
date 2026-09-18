import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';

export type CouponType = 'percent' | 'flat' | 'free_months';

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  type: CouponType;
  /** percent → 1..100, flat → paise, free_months → 1..12 */
  value: number;
  appliesToPlanSlugs: string[];
  appliesToPeriods: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  maxRedemptions?: number | null;
  redemptionCount: number;
  newTenantsOnly: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponRedemption {
  _id: string;
  code: string;
  tenantId: { _id: string; companyName?: string; slug?: string; ownerEmail?: string } | string;
  subscriptionId: string;
  razorpaySubscriptionId?: string;
  planSlug: string;
  billingPeriod?: string;
  listInPaise?: number;
  chargeInPaise?: number;
  freeMonths?: number;
  redeemedAt: string;
}

/** `null` on an optional field clears it. */
export interface UpdateCouponInput {
  description?: string;
  type?: CouponType;
  value?: number;
  appliesToPlanSlugs?: string[];
  appliesToPeriods?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  maxRedemptions?: number | null;
  newTenantsOnly?: boolean;
  isActive?: boolean;
}

export interface CreateCouponInput extends UpdateCouponInput {
  code: string;
  type: CouponType;
  value: number;
}

export const couponsService = {
  async list(): Promise<ApiResponse<Coupon[]>> {
    const { data } = await apiClient.get<Coupon[]>('/admin/coupons');
    return { success: true, data, message: 'OK' };
  },

  async create(input: CreateCouponInput): Promise<ApiResponse<Coupon>> {
    const { data } = await apiClient.post<Coupon>('/admin/coupons', input);
    return { success: true, data, message: 'Coupon created' };
  },

  async update(code: string, input: UpdateCouponInput): Promise<ApiResponse<Coupon>> {
    const { data } = await apiClient.patch<Coupon>(
      `/admin/coupons/${encodeURIComponent(code)}`,
      input,
    );
    return { success: true, data, message: 'Coupon updated' };
  },

  /** Deletes when never redeemed, otherwise deactivates to keep history. */
  async remove(
    code: string,
  ): Promise<ApiResponse<{ deleted: boolean; deactivated: boolean }>> {
    const { data } = await apiClient.delete<{ deleted: boolean; deactivated: boolean }>(
      `/admin/coupons/${encodeURIComponent(code)}`,
    );
    return { success: true, data, message: 'OK' };
  },

  async redemptions(code: string): Promise<ApiResponse<CouponRedemption[]>> {
    const { data } = await apiClient.get<CouponRedemption[]>(
      `/admin/coupons/${encodeURIComponent(code)}/redemptions`,
    );
    return { success: true, data, message: 'OK' };
  },
};
