import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deliveryService } from '@/lib/api/services/delivery.service';
import { handleApiError } from '@/lib/api/client';
import { shopkeeperKeys } from '@/lib/hooks/use-shopkeepers';
import type { DeliveryExceptionAction } from '@/lib/types';

export const deliveryKeys = {
  all: ['deliveries'] as const,
  boards: () => [...deliveryKeys.all, 'board'] as const,
  board: (date?: string, status?: string) => [...deliveryKeys.boards(), date ?? 'today', status ?? 'all'] as const,
  trips: () => [...deliveryKeys.all, 'trip'] as const,
  trip: (id: string) => [...deliveryKeys.trips(), id] as const,
  path: (id: string) => [...deliveryKeys.trips(), id, 'path'] as const,
  exceptions: (from?: string, to?: string) => [...deliveryKeys.all, 'exceptions', from ?? '', to ?? ''] as const,
  unverified: () => [...deliveryKeys.all, 'unverified-stores'] as const,
};

export function useDeliveryBoard(date?: string, status?: string) {
  return useQuery({
    queryKey: deliveryKeys.board(date, status),
    queryFn: async () => {
      const r = await deliveryService.getBoard(date, status);
      if (!r.success || !r.data) throw new Error(r.message);
      return r.data;
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useDeliveryTrip(tripId?: string) {
  return useQuery({
    queryKey: deliveryKeys.trip(tripId ?? ''),
    queryFn: async () => {
      const r = await deliveryService.getTrip(tripId!);
      if (!r.success || !r.data) throw new Error(r.message);
      return r.data;
    },
    enabled: !!tripId,
    staleTime: 30 * 1000,
  });
}

export function useDeliveryTripPath(tripId?: string) {
  return useQuery({
    queryKey: deliveryKeys.path(tripId ?? ''),
    queryFn: async () => {
      const r = await deliveryService.getTripPath(tripId!);
      if (!r.success || !r.data) throw new Error(r.message);
      return r.data.points;
    },
    enabled: !!tripId,
    staleTime: 60 * 1000,
  });
}

export function useForceEndTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, reason }: { tripId: string; reason?: string }) => {
      const r = await deliveryService.forceEndTrip(tripId, reason);
      if (!r.success || !r.data) throw new Error(r.message);
      return r.data;
    },
    onSuccess: (trip) => {
      queryClient.setQueryData(deliveryKeys.trip(trip.id), trip);
      queryClient.invalidateQueries({ queryKey: deliveryKeys.boards() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      toast.success('Trip ended');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useDeliveryExceptions(from?: string, to?: string) {
  return useQuery({
    queryKey: deliveryKeys.exceptions(from, to),
    queryFn: async () => {
      const r = await deliveryService.getExceptions(from, to);
      if (!r.success || !r.data) throw new Error(r.message);
      return r.data;
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useResolveException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      tripId: string;
      shopkeeperId: string;
      action: DeliveryExceptionAction;
      reason?: string;
      redeliverOn?: string;
    }) => {
      const r = await deliveryService.resolveException(vars.tripId, vars.shopkeeperId, {
        action: vars.action,
        reason: vars.reason,
        redeliverOn: vars.redeliverOn,
      });
      if (!r.success || !r.data) throw new Error(r.message);
      return r.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      const label =
        res.action === 'reschedule'
          ? `Rescheduled for ${res.redeliverOn}`
          : res.action === 'mark_delivered'
            ? 'Marked as delivered'
            : 'Marked as returned';
      toast.success(`${label} (${res.orders} order${res.orders === 1 ? '' : 's'})`);
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useUnverifiedStorePins() {
  return useQuery({
    queryKey: deliveryKeys.unverified(),
    queryFn: async () => {
      const r = await deliveryService.getUnverifiedStores();
      if (!r.success || !r.data) throw new Error(r.message);
      return r.data;
    },
    staleTime: 60 * 1000,
  });
}

function useStorePinMutation<TVars>(fn: (vars: TVars) => Promise<{ success: boolean; message?: string; data?: unknown }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: TVars) => {
      const r = await fn(vars);
      if (!r.success) throw new Error(r.message);
      return r;
    },
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.unverified() });
      queryClient.invalidateQueries({ queryKey: shopkeeperKeys.all });
      toast.success(r.message ?? 'Saved');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function usePinStore() {
  return useStorePinMutation(({ shopkeeperId, lat, lng }: { shopkeeperId: string; lat: number; lng: number }) =>
    deliveryService.pinStore(shopkeeperId, lat, lng),
  );
}

export function useVerifyStorePin() {
  return useStorePinMutation(({ shopkeeperId }: { shopkeeperId: string }) => deliveryService.verifyStorePin(shopkeeperId));
}

export function useClearStorePin() {
  return useStorePinMutation(({ shopkeeperId }: { shopkeeperId: string }) => deliveryService.clearStorePin(shopkeeperId));
}
