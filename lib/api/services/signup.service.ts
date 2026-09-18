import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';

export interface CreateSignupInput {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessType?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  planSlug: string;
  couponCode?: string;
}

export interface SignupSubmitResult {
  intentId: string;
  email: string;
  message: string;
}

export interface SignupLookupResult {
  email: string;
  ownerName: string;
  companyName: string;
  planSlug: string;
  planLabel: string;
  trialDays: number;
}

export interface VerifySignupResult {
  user: any;
  accessToken: string;
  refreshToken: string;
  tenantSlug: string;
  tenantId: string;
  planSlug: string;
  trialEnd: string;
}

export type BillingPeriod = 'monthly' | 'yearly';
export type DiscountSource = 'none' | 'sale' | 'coupon' | 'manual';

/** Computed list-vs-charge for one billing period (sale already applied). */
export interface PriceQuote {
  period: BillingPeriod;
  listInPaise: number;
  chargeInPaise: number;
  discountPercent: number;
  discountAmountInPaise: number;
  discountSource: DiscountSource;
  discountLabel?: string;
  discountEndsAt?: string;
}

export interface PublicPlan {
  slug: string;
  label: string;
  description: string;
  priceInPaise: number;
  yearlyPriceInPaise: number | null;
  currency: string;
  billingPeriod: string;
  trialDays: number;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  sortOrder: number;
  badge: string | null;
  highlight: boolean;
  pricing: { monthly: PriceQuote; yearly?: PriceQuote };
}

export interface PublicCouponCheck {
  valid: boolean;
  reason?: string;
  message?: string;
  code?: string;
  type?: 'percent' | 'flat' | 'free_months';
  value?: number;
  description?: string | null;
  endsAt?: string | null;
}

export const signupService = {
  async listPublicPlans(): Promise<ApiResponse<PublicPlan[]>> {
    const { data } = await apiClient.get<PublicPlan[]>('/public/plans');
    return { success: true, data, message: 'OK' };
  },

  /** Catalog-level coupon check before an account exists. Throttled server-side. */
  async checkCoupon(input: {
    code: string;
    planSlug: string;
    billingPeriod?: BillingPeriod;
  }): Promise<ApiResponse<PublicCouponCheck>> {
    const { data } = await apiClient.post<PublicCouponCheck>(
      '/public/coupons/check',
      input,
    );
    return { success: true, data, message: 'OK' };
  },

  async submit(input: CreateSignupInput): Promise<ApiResponse<SignupSubmitResult>> {
    const { data } = await apiClient.post<SignupSubmitResult>(
      '/public/signup',
      input,
    );
    return { success: true, data, message: data.message };
  },

  async lookup(token: string): Promise<ApiResponse<SignupLookupResult>> {
    const { data } = await apiClient.get<SignupLookupResult>(
      `/public/signup/verify/${encodeURIComponent(token)}`,
    );
    return { success: true, data, message: 'OK' };
  },

  async verify(
    token: string,
    password: string,
  ): Promise<ApiResponse<VerifySignupResult>> {
    const { data } = await apiClient.post<VerifySignupResult>(
      '/public/signup/verify',
      { token, password },
    );
    return { success: true, data, message: 'Verified' };
  },
};
