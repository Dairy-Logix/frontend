import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';
import type {
  BillingSubscription,
  BillingPayment,
} from './billing.service';

export interface BillingOverview {
  mrrPaise: number;
  activeCount: number;
  discountedCount: number;
  perTenant: Record<
    string,
    {
      monthlyPaise: number;
      chargeInPaise: number;
      billingPeriod: string;
      discountSource: string;
      discountPercent: number;
    }
  >;
}

export interface ManualDiscountInput {
  percent: number;
  reason?: string;
  until?: string;
}

export const adminBillingService = {
  /** Platform MRR + per-tenant locked charge, computed from subscription rows. */
  async getOverview(): Promise<ApiResponse<BillingOverview>> {
    const { data } = await apiClient.get<BillingOverview>('/admin/billing/overview');
    return { success: true, data, message: 'OK' };
  },

  /** Negotiated discount for one tenant. percent=0 clears it. */
  async setManualDiscount(
    tenantId: string,
    input: ManualDiscountInput,
  ): Promise<ApiResponse<any>> {
    const { data } = await apiClient.patch(
      `/admin/billing/tenants/${tenantId}/discount`,
      input,
    );
    return { success: true, data, message: 'Discount saved' };
  },

  async getSubscription(
    tenantId: string,
  ): Promise<ApiResponse<BillingSubscription | null>> {
    const { data } = await apiClient.get(
      `/admin/billing/tenants/${tenantId}/subscription`,
    );
    return { success: true, data, message: 'OK' };
  },

  async getPayments(
    tenantId: string,
  ): Promise<ApiResponse<BillingPayment[]>> {
    const { data } = await apiClient.get<BillingPayment[]>(
      `/admin/billing/tenants/${tenantId}/payments`,
    );
    return { success: true, data, message: 'OK' };
  },

  async extendTrial(
    tenantId: string,
    days: number,
  ): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post(
      `/admin/billing/tenants/${tenantId}/extend-trial`,
      { days },
    );
    return { success: true, data, message: `Trial extended by ${days} days` };
  },

  async forceCancel(
    tenantId: string,
    reason?: string,
  ): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post(
      `/admin/billing/tenants/${tenantId}/cancel`,
      { cancelAtCycleEnd: false, reason },
    );
    return { success: true, data, message: 'Cancelled' };
  },

  async sync(tenantId: string): Promise<ApiResponse<any>> {
    const { data } = await apiClient.post(
      `/admin/billing/tenants/${tenantId}/sync`,
      {},
    );
    return { success: true, data, message: 'Synced' };
  },
};
