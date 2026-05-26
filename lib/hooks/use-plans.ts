import { useQuery } from '@tanstack/react-query';
import { plansService } from '@/lib/api/services/plans.service';

export const planKeys = {
  all: ['plans'] as const,
  public: () => [...planKeys.all, 'public'] as const,
};

/**
 * List the public-facing plan catalog. Used by both the tenant billing page
 * (upgrade dropdown) and the super-admin Change Plan UI.
 */
export function usePublicPlans() {
  return useQuery({
    queryKey: planKeys.public(),
    queryFn: async () => {
      const res = await plansService.listPublic();
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
