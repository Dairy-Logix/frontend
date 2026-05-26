import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  platformService,
  type UpdatePlatformSettingsInput,
} from '@/lib/api/services/platform.service';
import { handleApiError } from '@/lib/api/client';

export const platformKeys = {
  all: ['platform'] as const,
  settings: () => [...platformKeys.all, 'settings'] as const,
  integrations: () => [...platformKeys.all, 'integrations'] as const,
  status: () => [...platformKeys.all, 'status'] as const,
};

/** Public platform state (banners, signup gating) — safe to call unauthenticated. */
export function usePlatformStatus() {
  return useQuery({
    queryKey: platformKeys.status(),
    queryFn: async () => {
      const res = await platformService.getStatus();
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: platformKeys.settings(),
    queryFn: async () => {
      const res = await platformService.getSettings();
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useIntegrationsStatus() {
  return useQuery({
    queryKey: platformKeys.integrations(),
    queryFn: async () => {
      const res = await platformService.getIntegrations();
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdatePlatformSettingsInput) => {
      const res = await platformService.updateSettings(input);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(platformKeys.settings(), data);
      toast.success('Platform settings saved');
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}
