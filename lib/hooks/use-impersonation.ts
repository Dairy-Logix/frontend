import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { impersonationService } from '@/lib/api/services/impersonation.service';
import { handleApiError } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth-store';

/**
 * Start read-only impersonation of a tenant: fetch a scoped token, swap the
 * auth store into the tenant view, clear cached super-admin queries, and land
 * on the tenant dashboard.
 */
export function useStartImpersonation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const enterImpersonation = useAuthStore((s) => s.enterImpersonation);

  return useMutation({
    mutationFn: async (tenantId: string) => {
      const res = await impersonationService.start(tenantId);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (data) => {
      enterImpersonation(data.token, data.tenant);
      // Drop super-admin cached data so tenant pages refetch with the imp token.
      queryClient.clear();
      toast.success(`Viewing ${data.tenant.name} (read-only)`);
      router.push('/dashboard');
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}

/** Exit impersonation and return to the super-admin tenants list. */
export function useExitImpersonation() {
  const exitImpersonation = useAuthStore((s) => s.exitImpersonation);

  return () => {
    exitImpersonation();
    // Hard navigation: a client-side push from a tenant route races the
    // route guard (which bounces the restored super-admin to /admin/dashboard).
    // A full load lands cleanly on the tenants list and flushes all SPA/query
    // state from the impersonated session.
    if (typeof window !== 'undefined') {
      window.location.assign('/admin/tenants');
    }
  };
}
