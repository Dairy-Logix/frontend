"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  IndianRupee,
  ArrowLeft,
  Store,
  Calendar,
  FileText,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";

import type { Order, OrderStatus } from "@/lib/types";
import { useOrder, useDeleteOrder } from "@/lib/hooks/use-orders";
import { useShopkeepers } from "@/lib/hooks/use-shopkeepers";
import { useAgencies } from "@/lib/hooks/use-agencies";
import { useProducts } from "@/lib/hooks/use-products";
import { Loader2 as LoaderIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// --- Order Status Color Map ---

const orderStatusColorMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  placed: { label: "Placed", variant: "info" },
  confirmed: { label: "Confirmed", variant: "success" },
  dispatched: { label: "Dispatched", variant: "warning" },
  delivered: { label: "Delivered", variant: "success" },
  completed: { label: "Completed", variant: "default" },
};

// --- Status timeline flow ---

const statusFlow: OrderStatus[] = [
  "placed",
  "confirmed",
  "dispatched",
  "delivered",
  "completed",
];

const statusTimelineConfig: Record<
  string,
  { label: string; icon: typeof ShoppingCart }
> = {
  placed: { label: "Placed", icon: Clock },
  pending: { label: "Pending", icon: Clock },
  confirmed: { label: "Confirmed", icon: CheckCircle2 },
  processing: { label: "Processing", icon: Clock },
  ready: { label: "Ready", icon: Package },
  dispatched: { label: "Dispatched", icon: Truck },
  delivered: { label: "Delivered", icon: Package },
  completed: { label: "Completed", icon: CheckCircle2 },
  returned: { label: "Returned", icon: XCircle },
};

// --- Status action map ---

const statusActionMap: Record<
  string,
  { label: string; nextStatus: OrderStatus; confirmTitle: string; confirmDesc: string }
> = {
  placed: {
    label: "Confirm Order",
    nextStatus: "confirmed",
    confirmTitle: "Confirm Order",
    confirmDesc: "Are you sure you want to confirm this order? The store will be notified.",
  },
  confirmed: {
    label: "Dispatch Order",
    nextStatus: "dispatched",
    confirmTitle: "Dispatch Order",
    confirmDesc: "Are you sure you want to mark this order as dispatched?",
  },
  dispatched: {
    label: "Mark Delivered",
    nextStatus: "delivered",
    confirmTitle: "Mark Delivered",
    confirmDesc: "Are you sure you want to mark this order as delivered?",
  },
  delivered: {
    label: "Complete Order",
    nextStatus: "completed",
    confirmTitle: "Complete Order",
    confirmDesc: "Are you sure you want to mark this order as completed? This action is final.",
  },
};

// --- Helpers ---

function formatINR(amount: number | undefined): string {
  return `INR ${(amount ?? 0).toLocaleString("en-IN")}`;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusIndex(status: OrderStatus): number {
  return statusFlow.indexOf(status);
}

// --- Main Page ---

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  // Fetch order from API
  const { data: orderData, isLoading: orderLoading, error: orderError } = useOrder(orderId);

  // Fetch lookups
  const { data: shopkeepersData } = useShopkeepers({ pageSize: 200 });
  const { data: agenciesData } = useAgencies({ pageSize: 200 });
  const { data: productsData } = useProducts({ pageSize: 200 });

  const shopkeepers = useMemo(() => shopkeepersData?.data ?? [], [shopkeepersData]);
  const agencies = useMemo(() => agenciesData?.data ?? [], [agenciesData]);
  const products = useMemo(() => productsData?.data ?? [], [productsData]);

  // Lookup helpers
  function getShopName(shopId: string): string {
    return shopkeepers.find((s: any) => s.id === shopId)?.shopName ?? "Unknown Shop";
  }
  function getShopOwner(shopId: string): string {
    return shopkeepers.find((s: any) => s.id === shopId)?.ownerName ?? "Unknown";
  }
  function getAgencyName(agencyId: string): string {
    return agencies.find((a: any) => a.id === agencyId)?.name ?? "Unknown Agency";
  }
  function getAgencyLocation(agencyId: string): string {
    return agencies.find((a: any) => a.id === agencyId)?.location ?? "";
  }
  function getProductName(productId: string): string {
    return products.find((p: any) => p.id === productId)?.name ?? "Unknown Product";
  }
  function getProductDisplay(productId: string): string {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return "";
    return `${product.shortName} (${product.category})`;
  }

  // Local order state (synced from API)
  const [order, setOrder] = useState<Order | undefined>(undefined);

  useEffect(() => {
    if (orderData) setOrder(orderData);
  }, [orderData]);

  const deleteOrder = useDeleteOrder();

  // Confirm action dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Loading state
  if (orderLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (orderError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/orders")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load order. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/orders")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </div>
        <div className="glass rounded-xl p-12 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-lg font-medium">Order not found</p>
          <p className="text-muted-foreground text-sm mt-1">
            The order you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);
  const action = statusActionMap[order.status];

  function handleStatusUpdate() {
    if (!action) return;
    setIsUpdating(true);

    setTimeout(() => {
      const now = new Date().toISOString();
      const timestampField = `${action.nextStatus}At` as keyof Order;

      setOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: action.nextStatus,
          [timestampField]: now,
          updatedAt: now,
        };
      });

      toast.success(`Order status updated to ${orderStatusColorMap[action.nextStatus].label}`);
      setIsUpdating(false);
      setConfirmOpen(false);
    }, 600);
  }

  async function handleDeleteOrder() {
    if (!window.confirm("Delete this order? All related invoices and payments will also be deleted. This cannot be undone.")) return;
    await deleteOrder.mutateAsync(orderId);
    router.push("/orders");
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/orders")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
      </div>

      {/* Page Header */}
      <PageHeader
        title={order.orderNumber}
        description={`Order placed on ${formatDateTime(order.placedAt)}`}
      />

      {/* Status Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold mb-6">Order Progress</h3>

        <div className="relative">
            {/* Timeline bar */}
            <div className="flex items-center justify-between">
              {statusFlow.map((status, index) => {
                const config = statusTimelineConfig[status];
                const Icon = config.icon;
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                // Get the timestamp for this status
                const timestampKey = `${status}At` as keyof Order;
                const timestamp = order[timestampKey] as string | undefined;

                return (
                  <div key={status} className="flex flex-col items-center relative z-10 flex-1">
                    {/* Circle */}
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: isCurrent ? 1.1 : 1 }}
                      className={`
                        h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all
                        ${
                          isCompleted
                            ? "bg-gradient-to-r from-red-500 to-orange-500 border-orange-500 text-white"
                            : "bg-muted border-border text-muted-foreground"
                        }
                        ${isCurrent ? "ring-4 ring-orange-500/20" : ""}
                      `}
                    >
                      <Icon className="h-4 w-4" />
                    </motion.div>

                    {/* Label */}
                    <span
                      className={`text-xs mt-2 font-medium ${
                        isCompleted ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {config.label}
                    </span>

                    {/* Timestamp */}
                    {timestamp && (
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDateTime(timestamp)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Connecting lines */}
            <div className="absolute top-5 left-0 right-0 flex px-[20%]" style={{ transform: "translateY(-50%)" }}>
              {statusFlow.slice(0, -1).map((status, index) => {
                const isCompleted = index < currentStatusIndex;
                return (
                  <div
                    key={`line-${status}`}
                    className={`flex-1 h-0.5 ${
                      isCompleted
                        ? "bg-gradient-to-r from-red-500 to-orange-500"
                        : "bg-border"
                    }`}
                  />
                );
              })}
            </div>
          </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass rounded-xl p-6 lg:col-span-1"
        >
          <h3 className="text-sm font-semibold mb-4">Order Information</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Order Number</p>
                <p className="font-semibold font-mono">{order.orderNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Store className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Shop</p>
                <p className="font-medium">{getShopName(order.shopId)}</p>
                <p className="text-xs text-muted-foreground">{getShopOwner(order.shopId)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Agency</p>
                <p className="font-medium">{getAgencyName(order.agencyId)}</p>
                <p className="text-xs text-muted-foreground">{getAgencyLocation(order.agencyId)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Placed Date</p>
                <p className="font-medium">{formatDateTime(order.placedAt)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={order.status} colorMap={orderStatusColorMap} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-border/50 space-y-2">
            {action && (
              <Button
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                onClick={() => setConfirmOpen(true)}
              >
                <ChevronRight className="h-4 w-4" />
                {action.label}
              </Button>
            )}
            {order.status !== "delivered" && order.status !== "completed" && (
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={handleDeleteOrder}
                disabled={deleteOrder.isPending}
              >
                <XCircle className="h-4 w-4" />
                Delete Order
              </Button>
            )}
          </div>
        </motion.div>

        {/* Items Table + Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass rounded-xl p-6 lg:col-span-2"
        >
          <h3 className="text-sm font-semibold mb-4">Order Items</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                    Product
                  </th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                    Variant
                  </th>
                  <th className="text-center py-2 pr-4 font-medium text-muted-foreground">
                    Qty
                  </th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground">
                    Unit Price
                  </th>
                  <th className="text-right py-2 font-medium text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => {
                  const qtyPerUnit = (item as any).quantityPerUnit ?? 1;
                  const isPiece = qtyPerUnit <= 1;
                  const piecePrice =
                    qtyPerUnit > 1 && item.unitPrice
                      ? item.unitPrice / qtyPerUnit
                      : item.unitPrice;
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.4 + index * 0.05 }}
                      className="border-b border-border/20 last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <p className="font-medium">{getProductName(item.productId)}</p>
                        {!isPiece && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {qtyPerUnit} pcs × {formatINR(piecePrice)} = {formatINR(item.unitPrice)}/crate
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-muted-foreground">
                          {getProductDisplay(item.productId)}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-center font-medium">
                        {item.quantity}
                      </td>
                      <td className="py-3 pr-4 text-right text-muted-foreground">
                        {formatINR(item.unitPrice)}
                        {!isPiece && (
                          <span className="block text-[11px]">/crate</span>
                        )}
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {formatINR(item.totalPrice)}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Order Summary */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center justify-between w-full max-w-xs">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm font-medium">{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between w-full max-w-xs pt-2 border-t border-border/50">
                <span className="text-base font-semibold">Total</span>
                <span className="text-base font-bold flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {order.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Notes Section */}
      {order.notes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Notes
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {order.notes}
          </p>
        </motion.div>
      )}

      {/* Status Update Confirm Dialog */}
      {action && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={action.confirmTitle}
          description={action.confirmDesc}
          confirmLabel={action.label}
          onConfirm={handleStatusUpdate}
          isLoading={isUpdating}
        />
      )}

    </div>
  );
}
