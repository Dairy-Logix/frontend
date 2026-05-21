import { useMutation, useQuery } from '@tanstack/react-query';
import { signupService, type CreateSignupInput } from '@/lib/api/services/signup.service';
import { handleApiError } from '@/lib/api/client';
import { toast } from 'sonner';

export const signupKeys = {
  all: ['signup'] as const,
  publicPlans: () => [...signupKeys.all, 'public-plans'] as const,
  lookup: (token: string) => [...signupKeys.all, 'lookup', token] as const,
};

export function usePublicPlans() {
  return useQuery({
    queryKey: signupKeys.publicPlans(),
    queryFn: async () => {
      const res = await signupService.listPublicPlans();
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useSubmitSignup() {
  return useMutation({
    mutationFn: async (input: CreateSignupInput) => {
      const res = await signupService.submit(input);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useSignupLookup(token: string | undefined) {
  return useQuery({
    queryKey: signupKeys.lookup(token ?? ''),
    queryFn: async () => {
      const res = await signupService.lookup(token!);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
  });
}

export function useVerifySignup() {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const res = await signupService.verify(token, password);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}
