import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/lib/api/services/settings.service';
import type { UpdateSettingsInput } from '@/lib/types';
import { toast } from 'sonner';

// Query keys
export const settingsKeys = {
  all: ['settings'] as const,
  tenant: () => [...settingsKeys.all, 'tenant'] as const,
};

/**
 * Hook to fetch tenant settings
 */
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.tenant(),
    queryFn: async () => {
      const response = await settingsService.getTenantSettings();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch settings');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update tenant settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      const response = await settingsService.updateTenantSettings(input);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update settings');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch tenant settings
      queryClient.invalidateQueries({ queryKey: settingsKeys.tenant() });
      toast.success('Settings updated successfully');
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });
}
