"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Truck,
  MapPin,
  Clock,
  User,
  Store,
  Calendar,
  Package,
  CheckCircle2,
  Send,
  Navigation,
  CircleCheck,
  Radio,
  MessageSquare,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";

import type { Delivery, DeliveryStatus, DeliveryTracking } from "@/lib/types";
import { useDeliveries } from "@/lib/hooks/use-deliveries";
import { useOrders } from "@/lib/hooks/use-orders";
import { useShopkeepers } from "@/lib/hooks/use-shopkeepers";
import { useEmployees } from "@/lib/hooks/use-employees";
import { Loader2 as LoaderIcon } from "lucide-react";

// --- Delivery Status Color Map ---

const deliveryStatusColorMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  pending: { label: "Pending", variant: "default" },
  dispatched: { label: "Dispatched", variant: "info" },
  in_transit: { label: "In Transit", variant: "warning" },
  delivered: { label: "Delivered", variant: "success" },
  failed: { label: "Failed", variant: "error" },
};

// --- Timeline status icon config ---

const timelineStatusConfig: Record<
  string,
  { color: string; bgColor: string }
> = {
  pending: { color: "text-muted-foreground", bgColor: "bg-muted" },
  scheduled: { color: "text-muted-foreground", bgColor: "bg-muted" },
  dispatched: { color: "text-[var(--info)]", bgColor: "bg-[var(--info)]/10" },
  in_transit: { color: "text-[var(--warning-dark)]", bgColor: "bg-[var(--warning)]/10" },
  delivered: { color: "text-[var(--success)]", bgColor: "bg-[var(--success)]/10" },
  failed: { color: "text-[var(--destructive)]", bgColor: "bg-[var(--destructive)]/10" },
  returned: { color: "text-[var(--destructive)]", bgColor: "bg-[var(--destructive)]/10" },
};

// --- Helpers ---

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
}

// --- Main Page ---

export default function DeliveryTrackingPage() {
  // Fetch data from API
  const { data: deliveriesData, isLoading: deliveriesLoading } = useDeliveries({ pageSize: 200 });
  const { data: ordersData } = useOrders({ pageSize: 200 });
  const { data: shopkeepersData } = useShopkeepers({ pageSize: 200 });
  const { data: employeesData } = useEmployees({ pageSize: 200 });

  const ordersList = useMemo(() => ordersData?.data ?? [], [ordersData]);
  const shopkeepersList = useMemo(() => shopkeepersData?.data ?? [], [shopkeepersData]);
  const employeesList = useMemo(() => employeesData?.data ?? [], [employeesData]);

  // Lookup helpers
  function getEmployeeName(employeeId: string): string {
    return employeesList.find((e: any) => e.id === employeeId)?.name ?? "Unknown";
  }
  function getEmployeePhone(employeeId: string): string {
    return employeesList.find((e: any) => e.id === employeeId)?.phone ?? "";
  }
  function getShopName(shopId: string): string {
    return shopkeepersList.find((s: any) => s.id === shopId)?.shopName ?? "Unknown Shop";
  }
  function getShopArea(shopId: string): string {
    return shopkeepersList.find((s: any) => s.id === shopId)?.area ?? "";
  }
  function getOrderNumber(orderId: string): string {
    return ordersList.find((o: any) => o.id === orderId)?.orderNumber ?? "N/A";
  }

  // Local deliveries state (synced from API, updated locally for tracking)
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    if (deliveriesData?.data) setDeliveries(deliveriesData.data);
  }, [deliveriesData]);

  // Selected delivery
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    deliveryId: string;
    newStatus: DeliveryStatus;
    label: string;
  } | null>(null);

  // --- Active deliveries (dispatched + in_transit) ---

  const activeDeliveries = useMemo(() => {
    return deliveries.filter(
      (d) => d.status === "dispatched" || d.status === "in_transit"
    );
  }, [deliveries]);

  // --- Selected delivery ---

  const selectedDelivery = useMemo(() => {
    if (!selectedDeliveryId) return activeDeliveries[0] ?? null;
    return deliveries.find((d) => d.id === selectedDeliveryId) ?? null;
  }, [selectedDeliveryId, activeDeliveries, deliveries]);

  // Auto-select first active delivery if none selected
  const effectiveSelectedId = selectedDelivery?.id ?? null;

  // --- Status update handlers ---

  function openStatusConfirm(
    deliveryId: string,
    newStatus: DeliveryStatus,
    label: string
  ) {
    setConfirmAction({ deliveryId, newStatus, label });
    setConfirmOpen(true);
  }

  function handleStatusUpdate() {
    if (!confirmAction) return;

    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== confirmAction.deliveryId) return d;
        const newTrackingPoint: DeliveryTracking = {
          id: `track-live-${Date.now()}`,
          deliveryId: d.id,
          latitude: d.trackingHistory.length > 0
            ? d.trackingHistory[d.trackingHistory.length - 1].latitude + 0.005
            : 23.0225,
          longitude: d.trackingHistory.length > 0
            ? d.trackingHistory[d.trackingHistory.length - 1].longitude - 0.003
            : 72.5714,
          timestamp: new Date().toISOString(),
          status: confirmAction.newStatus,
          notes: `Status updated to ${confirmAction.label}`,
        };
        return {
          ...d,
          status: confirmAction.newStatus,
          deliveredAt:
            confirmAction.newStatus === "delivered"
              ? new Date().toISOString()
              : d.deliveredAt,
          trackingHistory: [...d.trackingHistory, newTrackingPoint],
          updatedAt: new Date().toISOString(),
        };
      })
    );

    toast.success(`Delivery marked as ${confirmAction.label}`);
    setConfirmOpen(false);
    setConfirmAction(null);
  }

  // --- Loading State ---
  if (deliveriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading delivery tracking...</p>
        </div>
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Delivery Tracking"
        description="Real-time tracking of active deliveries"
      />

      {activeDeliveries.length === 0 && !selectedDelivery ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-xl p-12 text-center"
        >
          <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-lg font-medium">
            No active deliveries
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            There are currently no dispatched or in-transit deliveries to track.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Active Delivery List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="h-4 w-4 text-[var(--warning-dark)]" />
              <h2 className="font-semibold text-sm">
                Active Deliveries ({activeDeliveries.length})
              </h2>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {activeDeliveries.map((delivery, index) => (
                  <motion.button
                    key={delivery.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    onClick={() => setSelectedDeliveryId(delivery.id)}
                    className={`w-full text-left rounded-xl p-3 transition-all ${
                      effectiveSelectedId === delivery.id
                        ? "glass ring-2 ring-[var(--info)]/50"
                        : "glass-subtle hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-sm font-semibold">
                        {(delivery as any).deliveryNumber ?? (delivery.orderId ? getOrderNumber(delivery.orderId) : delivery.id.slice(-8).toUpperCase())}
                      </span>
                      <StatusBadge
                        status={delivery.status}
                        colorMap={deliveryStatusColorMap}
                      />
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        {getEmployeeName(delivery.employeeId)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Store className="h-3 w-3" />
                        {delivery.routeShops.length} stop(s)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {delivery.trackingHistory.length > 0
                          ? `Last update: ${formatTime(
                              delivery.trackingHistory[
                                delivery.trackingHistory.length - 1
                              ].timestamp
                            )}`
                          : "No updates yet"}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel: Selected Delivery Details */}
          <div className="lg:col-span-2 space-y-4">
            {selectedDelivery ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDelivery.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Delivery Info Card */}
                  <div className="glass rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-lg p-2 text-white">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {(selectedDelivery as any).deliveryNumber ?? (selectedDelivery.orderId ? getOrderNumber(selectedDelivery.orderId) : selectedDelivery.id.slice(-8).toUpperCase())}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Delivery #{selectedDelivery.id}
                          </p>
                        </div>
                      </div>
                      <StatusBadge
                        status={selectedDelivery.status}
                        colorMap={deliveryStatusColorMap}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Employee */}
                      <div className="glass-subtle rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Delivery Employee
                          </span>
                        </div>
                        <p className="font-medium">
                          {getEmployeeName(selectedDelivery.employeeId)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getEmployeePhone(selectedDelivery.employeeId)}
                        </p>
                      </div>

                      {/* Schedule */}
                      <div className="glass-subtle rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Scheduled Date
                          </span>
                        </div>
                        <p className="font-medium">
                          {formatDate(selectedDelivery.scheduledDate)}
                        </p>
                        {selectedDelivery.deliveredAt && (
                          <p className="text-xs text-[var(--success)]">
                            Delivered at {formatTime(selectedDelivery.deliveredAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stores to Visit */}
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Stores to Visit
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedDelivery.routeShops.map((rs) => (
                          <div
                            key={rs.shopId}
                            className="glass-subtle rounded-lg px-3 py-2 flex items-center gap-2"
                          >
                            <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {rs.sequence}
                            </span>
                            <div>
                              <p className="text-sm font-medium">
                                {getShopName(rs.shopId)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getShopArea(rs.shopId)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/30">
                      {selectedDelivery.status === "dispatched" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() =>
                              openStatusConfirm(
                                selectedDelivery.id,
                                "in_transit",
                                "In Transit"
                              )
                            }
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            Mark In Transit
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                            onClick={() =>
                              openStatusConfirm(
                                selectedDelivery.id,
                                "delivered",
                                "Delivered"
                              )
                            }
                          >
                            <CircleCheck className="h-3.5 w-3.5" />
                            Mark Delivered
                          </Button>
                        </>
                      )}
                      {selectedDelivery.status === "in_transit" && (
                        <Button
                          size="sm"
                          className="gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                          onClick={() =>
                            openStatusConfirm(
                              selectedDelivery.id,
                              "delivered",
                              "Delivered"
                            )
                          }
                        >
                          <CircleCheck className="h-3.5 w-3.5" />
                          Mark Delivered
                        </Button>
                      )}
                      {selectedDelivery.status === "delivered" && (
                        <div className="flex items-center gap-1.5 text-sm text-[var(--success)]">
                          <CheckCircle2 className="h-4 w-4" />
                          This delivery has been completed
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tracking Timeline */}
                  <div className="glass rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Tracking Timeline</h3>
                      <span className="text-xs text-muted-foreground">
                        ({selectedDelivery.trackingHistory.length} updates)
                      </span>
                    </div>

                    {selectedDelivery.trackingHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground text-sm">
                          No tracking updates yet
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border/50" />

                        <div className="space-y-0">
                          {[...selectedDelivery.trackingHistory]
                            .reverse()
                            .map((trackPoint, index) => {
                              const config =
                                timelineStatusConfig[trackPoint.status];
                              const isFirst = index === 0;

                              return (
                                <motion.div
                                  key={trackPoint.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    duration: 0.2,
                                    delay: index * 0.05,
                                  }}
                                  className="relative flex gap-4 pb-6 last:pb-0"
                                >
                                  {/* Timeline dot */}
                                  <div className="relative z-10 shrink-0">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor} ${
                                        isFirst
                                          ? "ring-2 ring-offset-2 ring-offset-background ring-[var(--info)]/30"
                                          : ""
                                      }`}
                                    >
                                      {trackPoint.status === "delivered" ? (
                                        <CheckCircle2
                                          className={`h-4 w-4 ${config.color}`}
                                        />
                                      ) : trackPoint.status === "dispatched" ? (
                                        <Send
                                          className={`h-3.5 w-3.5 ${config.color}`}
                                        />
                                      ) : trackPoint.status === "in_transit" ? (
                                        <Navigation
                                          className={`h-3.5 w-3.5 ${config.color}`}
                                        />
                                      ) : trackPoint.status === "failed" ? (
                                        <Package
                                          className={`h-3.5 w-3.5 ${config.color}`}
                                        />
                                      ) : (
                                        <Clock
                                          className={`h-3.5 w-3.5 ${config.color}`}
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Timeline content */}
                                  <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <StatusBadge
                                        status={trackPoint.status}
                                        colorMap={deliveryStatusColorMap}
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        {formatDateTime(trackPoint.timestamp)}
                                      </span>
                                    </div>

                                    {trackPoint.notes && (
                                      <div className="flex items-start gap-1.5 mt-1.5">
                                        <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                        <p className="text-sm text-muted-foreground">
                                          {trackPoint.notes}
                                        </p>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground/70">
                                      <MapPin className="h-3 w-3" />
                                      <span>
                                        {trackPoint.latitude.toFixed(4)},{" "}
                                        {trackPoint.longitude.toFixed(4)}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="glass rounded-xl p-12 text-center">
                <Truck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  Select a delivery from the list to view tracking details
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Status Update Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Mark as ${confirmAction?.label ?? ""}`}
        description={`Are you sure you want to update this delivery status to "${confirmAction?.label ?? ""}"? This action will update the delivery tracking.`}
        confirmLabel={`Mark ${confirmAction?.label ?? ""}`}
        variant="destructive"
        onConfirm={handleStatusUpdate}
      />
    </div>
  );
}
