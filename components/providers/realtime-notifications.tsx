"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket, disconnectSocket } from "@/lib/socket/socket";
import { getAccessToken } from "@/lib/auth/token-storage";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useFeature } from "@/lib/hooks/use-feature";
import { orderKeys } from "@/lib/hooks/use-orders";
import { notificationKeys } from "@/lib/hooks/use-notifications";
import { TENANT_ROUTES, WS_EVENTS } from "@/lib/constants";
import { showNotificationToast } from "@/components/notifications/notification-toast";

interface ShopkeeperOrderActivity {
  orderId: string;
  orderNumber: string;
  shopName: string;
  action: "placed" | "updated";
  agencyId?: string;
  // The admin's resolved channel toggles for this event (server-authoritative).
  channels?: { toast: boolean; bell: boolean };
}

/**
 * Subscribes the tenant's web staff (admin / employees) to live order activity
 * from shopkeepers. When a shopkeeper places or updates an order, the backend
 * emits `shopkeeper:order` to the tenant room with the admin's resolved channel
 * toggles. We show a toast when `toast` is on, and refresh the DB-backed bell
 * (the backend persists the record) when `bell` is on. The orders list is always
 * refreshed.
 *
 * Renders nothing. Mounted inside the tenant layout, so super admins (who live
 * under /admin) never reach it. Shopkeepers are excluded explicitly — they
 * shouldn't be notified about their own activity.
 */
export function RealtimeNotifications() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  const appNotificationsEnabled = useFeature("appNotifications");

  const isStaff = role === "tenant_admin" || role === "employee";
  const active = isAuthenticated && isStaff && appNotificationsEnabled;

  useEffect(() => {
    if (!active) return;

    const token = getAccessToken();
    if (!token) return;

    const socket = getSocket(token);

    const handleActivity = (data: ShopkeeperOrderActivity) => {
      const placed = data.action === "placed";
      const verb = placed ? "placed a new order" : "updated an order";
      const title = placed ? "New order placed" : "Order updated";
      const message = `${data.shopName} ${verb} — order #${data.orderNumber}`;

      // The backend only emits when at least one channel is on, and carries the
      // resolved flags. Default to both on if a flag is somehow absent.
      const toast = data.channels?.toast !== false;
      const bell = data.channels?.bell !== false;

      if (toast) {
        showNotificationToast({
          variant: placed ? "success" : "info",
          icon: placed ? ShoppingCart : Pencil,
          actor: "Shopkeeper",
          title,
          message,
          meta: "Just now",
          actionLabel: "View order",
          onAction: () => router.push(TENANT_ROUTES.ORDER_DETAIL(data.orderId)),
        });
      }

      // The persisted record was written server-side — pull it into the bell.
      if (bell) {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      }

      // Keep the orders list (and any order detail) fresh without a manual refresh.
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    };

    socket.on(WS_EVENTS.SHOPKEEPER_ORDER, handleActivity);
    if (!socket.connected) socket.connect();

    return () => {
      socket.off(WS_EVENTS.SHOPKEEPER_ORDER, handleActivity);
    };
  }, [active, queryClient, router]);

  // Tear the connection down entirely when the user is no longer an active
  // staff session (logout, role change, feature disabled).
  useEffect(() => {
    if (!active) disconnectSocket();
  }, [active]);

  return null;
}
