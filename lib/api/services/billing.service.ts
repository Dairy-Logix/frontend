import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';
import type { BillingPeriod, PriceQuote } from './signup.service';

export interface BillingSubscription {
  _id: string;
  tenantId: string;
  planSlug: string;
  status: string;
  trialStart?: string;
  trialEnd?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  razorpaySubscriptionId?: string;
  cancelledAt?: string;
  cancelReason?: string;
  endedAt?: string;
  // Pricing snapshot locked at subscribe time (absent on legacy rows).
  billingPeriod?: BillingPeriod;
  listInPaise?: number;
  chargeInPaise?: number;
  discountPercent?: number;
  discountAmountInPaise?: number;
  discountSource?: 'none' | 'sale' | 'coupon' | 'manual';
  discountLabel?: string;
  couponCode?: string;
  pendingCouponCode?: string;
  freeMonths?: number;
}

export interface SubscribeOptions {
  planSlug?: string;
  billingPeriod?: BillingPeriod;
  couponCode?: string;
}

export interface PricingPreview extends PriceQuote {
  planSlug: string;
  planLabel: string;
  freeMonths: number;
  couponError?: { reason: string; message: string };
  couponCode?: string;
  notes: string[];
}

export interface BillingPayment {
  _id: string;
  amountInPaise: number;
  currency: string;
  method: string;
  status: "captured" | "failed" | "refunded";
  capturedAt?: string;
  failureReason?: string;
  razorpayPaymentId: string;
  createdAt: string;
}

export interface SubscribeResult {
  shortUrl: string;
  razorpaySubscriptionId: string;
  razorpayKeyId: string | null;
  prefill: { name?: string; email?: string; contact?: string };
  tenantName?: string;
  planLabel?: string;
  amountInPaise?: number;
  pricing?: PricingPreview;
}

export const billingService = {
  async getSubscription(): Promise<ApiResponse<BillingSubscription | null>> {
    const { data } = await apiClient.get<BillingSubscription | null>(
      '/billing/subscription',
    );
    return { success: true, data, message: 'OK' };
  },

  async getPayments(): Promise<ApiResponse<BillingPayment[]>> {
    const { data } = await apiClient.get<BillingPayment[]>('/billing/payments');
    return { success: true, data, message: 'OK' };
  },

  async subscribe(opts: SubscribeOptions = {}): Promise<ApiResponse<SubscribeResult>> {
    const body: SubscribeOptions = {};
    if (opts.planSlug) body.planSlug = opts.planSlug;
    if (opts.billingPeriod) body.billingPeriod = opts.billingPeriod;
    if (opts.couponCode?.trim()) body.couponCode = opts.couponCode.trim();
    const { data } = await apiClient.post<SubscribeResult>('/billing/subscribe', body);
    return { success: true, data, message: 'OK' };
  },

  /** Price a plan/period/coupon for this tenant. No side effects. */
  async previewPricing(opts: SubscribeOptions = {}): Promise<ApiResponse<PricingPreview>> {
    const body: SubscribeOptions = {};
    if (opts.planSlug) body.planSlug = opts.planSlug;
    if (opts.billingPeriod) body.billingPeriod = opts.billingPeriod;
    if (opts.couponCode?.trim()) body.couponCode = opts.couponCode.trim();
    const { data } = await apiClient.post<PricingPreview>('/billing/pricing/preview', body);
    return { success: true, data, message: 'OK' };
  },

  async cancel(reason?: string): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post('/billing/cancel', {
      cancelAtCycleEnd: true,
      reason,
    });
    return { success: true, data, message: 'Cancelled' };
  },

  async sync(): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post('/billing/sync', {});
    return { success: true, data, message: 'Synced' };
  },
};
