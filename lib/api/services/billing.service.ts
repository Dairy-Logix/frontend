import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';

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

  async subscribe(planSlug?: string): Promise<ApiResponse<SubscribeResult>> {
    const { data } = await apiClient.post<SubscribeResult>(
      '/billing/subscribe',
      planSlug ? { planSlug } : {},
    );
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
