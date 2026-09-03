"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket/socket";
import { getAccessToken } from "@/lib/auth/token-storage";
import { WS_EVENTS } from "@/lib/constants";
import { deliveryKeys } from "@/lib/hooks/use-deliveries";
import type { DeliveryBoard, DeliveryTripDetail, GeoFix } from "@/lib/types";

interface LocationEvent { tripId: string; employeeId: string; lat: number; lng: number; at?: string }

/**
 * Keep the delivery pages live: trip / stop broadcasts refetch the board and
 * the open trip; location pings patch `lastLocation` straight into the cache
 * so agent markers move without a refetch. The socket is the shared
 * singleton that RealtimeNotifications also uses; we only add listeners.
 */
export function useDeliveryRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const socket = getSocket(token);

    const onTripOrStop = () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.boards() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.trips() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.exceptions() });
    };
    const onLocation = (e: LocationEvent) => {
      const fix: GeoFix = { lat: e.lat, lng: e.lng, at: e.at };
      queryClient.setQueriesData<DeliveryBoard>({ queryKey: deliveryKeys.boards() }, (b) =>
        b ? { ...b, trips: b.trips.map((t) => (t.id === e.tripId ? { ...t, lastLocation: fix } : t)) } : b,
      );
      queryClient.setQueryData<DeliveryTripDetail>(deliveryKeys.trip(e.tripId), (t) => (t ? { ...t, lastLocation: fix } : t));
      queryClient.setQueryData<GeoFix[]>(deliveryKeys.path(e.tripId), (p) => (p ? [...p, fix] : p));
    };

    socket.on(WS_EVENTS.DELIVERY_TRIP, onTripOrStop);
    socket.on(WS_EVENTS.DELIVERY_STOP, onTripOrStop);
    socket.on(WS_EVENTS.DELIVERY_LOCATION, onLocation);
    if (!socket.connected) socket.connect();
    return () => {
      socket.off(WS_EVENTS.DELIVERY_TRIP, onTripOrStop);
      socket.off(WS_EVENTS.DELIVERY_STOP, onTripOrStop);
      socket.off(WS_EVENTS.DELIVERY_LOCATION, onLocation);
    };
  }, [queryClient]);
}
