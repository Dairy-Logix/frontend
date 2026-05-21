import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/lib/api/services/billing.service';
import { handleApiError } from '@/lib/api/client';
import { toast } from 'sonner';

export const billingKeys = {
  all: ['billing'] as const,
  subscription: () => [...billingKeys.all, 'subscription'] as const,
  payments: () => [...billingKeys.all, 'payments'] as const,
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
    mutationFn: async (planSlug?: string) => {
      const res = await billingService.subscribe(planSlug);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    onError: (e) => toast.error(handleApiError(e)),
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
