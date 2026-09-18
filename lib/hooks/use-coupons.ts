import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  couponsService,
  type CreateCouponInput,
  type UpdateCouponInput,
} from '@/lib/api/services/coupons.service';
import { handleApiError } from '@/lib/api/client';

export const couponKeys = {
  all: ['coupons'] as const,
  list: () => [...couponKeys.all, 'list'] as const,
  redemptions: (code: string) => [...couponKeys.all, 'redemptions', code] as const,
};

export function useCoupons() {
  return useQuery({
    queryKey: couponKeys.list(),
    queryFn: async () => {
      const res = await couponsService.list();
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCouponRedemptions(code: string | null) {
  return useQuery({
    queryKey: couponKeys.redemptions(code ?? ''),
    queryFn: async () => {
      const res = await couponsService.redemptions(code!);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    enabled: !!code,
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCouponInput) => {
      const res = await couponsService.create(input);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: couponKeys.list() });
      toast.success(`Coupon ${data.code} created`);
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, input }: { code: string; input: UpdateCouponInput }) => {
      const res = await couponsService.update(code, input);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: couponKeys.list() });
      toast.success(`Coupon ${data.code} updated`);
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useRemoveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await couponsService.remove(code);
      if (!res.success || !res.data) throw new Error(res.message);
      return { code, ...res.data };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: couponKeys.list() });
      toast.success(
        r.deleted
          ? `Coupon ${r.code} deleted`
          : `Coupon ${r.code} deactivated (it had redemptions, so history is kept)`,
      );
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}
