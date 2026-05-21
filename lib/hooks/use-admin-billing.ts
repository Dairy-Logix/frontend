import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminBillingService } from '@/lib/api/services/admin-billing.service';
import { handleApiError } from '@/lib/api/client';
import { toast } from 'sonner';
import { tenantKeys } from './use-tenants';

export const adminBillingKeys = {
  all: ['admin-billing'] as const,
  subscription: (tenantId: string) =>
    [...adminBillingKeys.all, 'sub', tenantId] as const,
  payments: (tenantId: string) =>
    [...adminBillingKeys.all, 'pay', tenantId] as const,
};

export function useAdminTenantSubscription(tenantId: string) {
  return useQuery({
    queryKey: adminBillingKeys.subscription(tenantId),
    queryFn: async () => {
      const res = await adminBillingService.getSubscription(tenantId);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useAdminTenantPayments(tenantId: string) {
  return useQuery({
    queryKey: adminBillingKeys.payments(tenantId),
    queryFn: async () => {
      const res = await adminBillingService.getPayments(tenantId);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useExtendTrial(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (days: number) => {
      const res = await adminBillingService.extendTrial(tenantId, days);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: adminBillingKeys.subscription(tenantId),
      });
      qc.invalidateQueries({ queryKey: tenantKeys.detail(tenantId) });
      toast.success('Trial extended');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useAdminForceCancel(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reason?: string) => {
      const res = await adminBillingService.forceCancel(tenantId, reason);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: adminBillingKeys.subscription(tenantId),
      });
      qc.invalidateQueries({ queryKey: tenantKeys.detail(tenantId) });
      toast.success('Subscription cancelled');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useAdminSyncBilling(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await adminBillingService.sync(tenantId);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: adminBillingKeys.subscription(tenantId),
      });
      qc.invalidateQueries({ queryKey: tenantKeys.detail(tenantId) });
      toast.success('Synced from Razorpay');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}
