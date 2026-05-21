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
  planSlug: 'basic' | 'standard' | 'premium';
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

export interface PublicPlan {
  slug: 'basic' | 'standard' | 'premium';
  label: string;
  description: string;
  priceInPaise: number;
  currency: string;
  billingPeriod: string;
  trialDays: number;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  sortOrder: number;
}

export const signupService = {
  async listPublicPlans(): Promise<ApiResponse<PublicPlan[]>> {
    const { data } = await apiClient.get<PublicPlan[]>('/public/plans');
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
