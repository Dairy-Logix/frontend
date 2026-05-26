import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  adminSignupsService,
  type SignupLeadsQuery,
} from '@/lib/api/services/admin-signups.service';

export const signupLeadKeys = {
  all: ['admin-signups'] as const,
  list: (params?: SignupLeadsQuery) => [...signupLeadKeys.all, 'list', params] as const,
  stats: () => [...signupLeadKeys.all, 'stats'] as const,
};

export function useSignupLeads(params?: SignupLeadsQuery) {
  return useQuery({
    queryKey: signupLeadKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await adminSignupsService.list(params);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useSignupStats() {
  return useQuery({
    queryKey: signupLeadKeys.stats(),
    queryFn: async () => {
      const res = await adminSignupsService.stats();
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}
