import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService, type SubscribeOptions } from '@/lib/api/services/billing.service';
import { handleApiError } from '@/lib/api/client';
import { toast } from 'sonner';

export const billingKeys = {
  all: ['billing'] as const,
  subscription: () => [...billingKeys.all, 'subscription'] as const,
  payments: () => [...billingKeys.all, 'payments'] as const,
  preview: (opts: SubscribeOptions) =>
    [...billingKeys.all, 'preview', opts.planSlug ?? '', opts.billingPeriod ?? '', opts.couponCode ?? ''] as const,
};

export function useBillingSubscription() {
  return useQuery({
    queryKey: billingKeys.subscription(),
    queryFn: async () => {
      const res = await billingService.getSubscription();
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    // Refetch when user returns from Razorpay checkout in another tab
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  });
}

export function useBillingPayments() {
  return useQuery({
    queryKey: billingKeys.payments(),
    queryFn: async () => {
      const res = await billingService.getPayments();
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  });
}

export function useSubscribe() {
  return useMutation({
    mutationFn: async (opts: SubscribeOptions = {}) => {
      const res = await billingService.subscribe(opts);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

/**
 * Live quote for the plan picker: list price, sale/coupon/manual discount,
 * free months. Re-runs when the plan, period or code changes. The coupon
 * endpoint is throttled (10/min), so callers should debounce code input.
 */
export function usePricingPreview(opts: SubscribeOptions, enabled = true) {
  return useQuery({
    queryKey: billingKeys.preview(opts),
    queryFn: async () => {
      const res = await billingService.previewPricing(opts);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    enabled,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reason?: string) => {
      const res = await billingService.cancel(reason);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.subscription() });
      toast.success('Subscription cancelled');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useSyncBilling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await billingService.sync();
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.subscription() });
      toast.success('Status refreshed from Razorpay');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}
