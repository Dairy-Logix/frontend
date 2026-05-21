import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  planningStudioService,
  type AgencyFormulaToken,
  type FormulaQuantityEntry,
} from '@/lib/api/services/planning-studio.service';
import { handleApiError } from '@/lib/api/client';

export const planningStudioKeys = {
  all: ['planning-studio'] as const,
  formula: () => [...planningStudioKeys.all, 'formula'] as const,
  preview: () => [...planningStudioKeys.all, 'preview'] as const,
};

export function useAgencyFormula() {
  return useQuery({
    queryKey: planningStudioKeys.formula(),
    queryFn: async () => {
      const response = await planningStudioService.getFormula();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch formula');
      }
      return response.data ?? null;
    },
    staleTime: 60 * 1000,
  });
}

export function useSaveAgencyFormula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tokens: AgencyFormulaToken[]) => {
      const response = await planningStudioService.saveFormula(tokens);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to save formula');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningStudioKeys.formula() });
      queryClient.invalidateQueries({ queryKey: planningStudioKeys.preview() });
      toast.success('Formula saved');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useAgencyFormulaPreview(enabled: boolean) {
  return useQuery({
    queryKey: planningStudioKeys.preview(),
    queryFn: async () => {
      const response = await planningStudioService.getFormulaPreview();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch preview');
      }
      return response.data;
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useSaveFormulaQuantities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quantities: FormulaQuantityEntry[]) => {
      const response = await planningStudioService.saveFormulaQuantities(
        quantities,
      );
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to save quantities');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningStudioKeys.preview() });
      toast.success('Quantities saved');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });
}
