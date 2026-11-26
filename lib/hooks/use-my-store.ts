import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/api/client';
import {
  myStoreService,
  type SaveMyStoreItemInput,
} from '@/lib/api/services/my-store.service';

export const myStoreKeys = {
  all: ['my-store'] as const,
  items: () => [...myStoreKeys.all, 'items'] as const,
  config: () => [...myStoreKeys.all, 'config'] as const,
};

export function useMyStoreItems() {
  return useQuery({
    queryKey: myStoreKeys.items(),
    queryFn: () => myStoreService.getItems(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyStoreConfig() {
  return useQuery({
    queryKey: myStoreKeys.config(),
    queryFn: () => myStoreService.getConfig(),
    staleTime: 0,
  });
}

export function useSaveMyStoreItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: SaveMyStoreItemInput[]) => myStoreService.saveItems(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myStoreKeys.all });
      toast.success('My Store products and prices saved');
    },
    onError: (error) => toast.error(handleApiError(error)),
  });
}
