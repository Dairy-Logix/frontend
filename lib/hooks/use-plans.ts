import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { plansService, type UpdatePlanInput } from '@/lib/api/services/plans.service';
import { handleApiError } from '@/lib/api/client';

export const planKeys = {
  all: ['plans'] as const,
  public: () => [...planKeys.all, 'public'] as const,
  adminList: () => [...planKeys.all, 'admin', 'list'] as const,
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

/** Super-admin: full plan catalog (active + inactive, public + private). */
export function useAdminPlans() {
  return useQuery({
    queryKey: planKeys.adminList(),
    queryFn: async () => {
      const res = await plansService.listAll();
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Super-admin: update a plan's price, trial, features, limits, etc. */
export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, input }: { slug: string; input: UpdatePlanInput }) => {
      const res = await plansService.update(slug, input);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: planKeys.adminList() });
      // Public catalog + any tenant plan caches may now be stale.
      queryClient.invalidateQueries({ queryKey: planKeys.public() });
      toast.success(`Plan "${data.label}" updated successfully`);
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}
