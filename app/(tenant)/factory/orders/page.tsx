"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Package,
  IndianRupee,
  Plus,
  Calendar,
  Factory,
  Send,
  CheckCircle2,
  Truck,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  Loader2 as LoaderIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormModal } from "@/components/shared/form-modal";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { FactoryOrder, FactoryOrderStatus } from "@/lib/types";
import { useFactoryOrders, useCreateFactoryOrder, useFactoryProducts } from "@/lib/hooks/use-factory";
import { useProducts } from "@/lib/hooks/use-products";

// --- Status Color Map ---

const factoryOrderStatusMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  draft: { label: "Draft", variant: "default" },
  sent: { label: "Sent", variant: "info" },
  confirmed: { label: "Confirmed", variant: "warning" },
  fulfilled: { label: "Fulfilled", variant: "success" },
  cancelled: { label: "Cancelled", variant: "error" },
};

// --- Factory Names ---

const FACTORY_NAMES = ["Gujarat Dairy Co-op", "Amul Processing Unit"];

// --- Helpers ---

function formatINR(amount: number): string {
  return `INR ${amount.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// --- Item Form Data ---

interface ItemFormData {
  productId: string;
  quantity: string;
  factoryPrice: string;
}

const emptyItem: ItemFormData = {
  productId: "",
  quantity: "",
  factoryPrice: "",
};

// --- Main Page ---

export default function FactoryOrdersPage() {
  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [factoryFilter, setFactoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch products and factory products for lookups
  const { data: allProductsData } = useProducts({ pageSize: 200 });
  const allProducts = useMemo(() => allProductsData?.data ?? [], [allProductsData]);
  const { data: factoryProductsData } = useFactoryProducts({ pageSize: 200 });
  const factoryProductsList = useMemo(() => factoryProductsData?.data ?? [], [factoryProductsData]);

  // Product name lookup
  function getProductName(productId: string): string {
    return allProducts.find((p: any) => p.id === productId)?.name ?? "Unknown Product";
  }

  // Data fetching with real API
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useFactoryOrders({
    page,
    pageSize,
    factoryName: factoryFilter !== "all" ? factoryFilter : undefined,
    status: statusFilter !== "all" ? (statusFilter as FactoryOrderStatus) : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // Mutations
  const createFactoryOrder = useCreateFactoryOrder();

  const orders = ordersData?.data || [];

  // Expanded row
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Create PO modal
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formFactoryName, setFormFactoryName] = useState("");
  const [formItems, setFormItems] = useState<ItemFormData[]>([{ ...emptyItem }]);
  const [formNotes, setFormNotes] = useState("");

  // --- Filtered orders ---

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        search === "" ||
        order.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.factoryName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const matchesFactory =
        factoryFilter === "all" || order.factoryName === factoryFilter;

      const orderDate = new Date(order.orderedAt);
      const matchesDateFrom =
        !dateFrom || orderDate >= new Date(dateFrom);
      const matchesDateTo =
        !dateTo || orderDate <= new Date(dateTo + "T23:59:59.999Z");

      return matchesSearch && matchesStatus && matchesFactory && matchesDateFrom && matchesDateTo;
    });
  }, [orders, search, statusFilter, factoryFilter, dateFrom, dateTo]);

  // --- Stats ---

  const stats = useMemo(() => {
    const totalPOs = orders.length;
    const pendingConfirmation = orders.filter(
      (o) => o.status === "draft" || o.status === "sent"
    ).length;
    const totalOrdered = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Outstanding = confirmed + sent orders (not yet fulfilled/cancelled)
    const outstanding = orders
      .filter((o) => o.status === "sent" || o.status === "confirmed")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return { totalPOs, pendingConfirmation, totalOrdered, outstanding };
  }, [orders]);

  // --- Form handlers ---

  function openCreateModal() {
    setFormFactoryName(FACTORY_NAMES[0]);
    setFormItems([{ ...emptyItem }]);
    setFormNotes("");
    setFormOpen(true);
  }

  function addItemRow() {
    setFormItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItemRow(index: number) {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItemField(
    index: number,
    field: keyof ItemFormData,
    value: string
  ) {
    setFormItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  // Get factory price suggestion for a product
  function getFactoryPriceSuggestion(productId: string): number | null {
    const fp = factoryProductsList.find(
      (fp: any) => fp.productId === productId && fp.factoryName === formFactoryName
    );
    return fp?.factoryPrice ?? null;
  }

  function handleFormSubmit() {
    if (!formFactoryName) {
      toast.error("Please select a factory");
      return;
    }
    if (formItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    for (let i = 0; i < formItems.length; i++) {
      const item = formItems[i];
      if (!item.productId) {
        toast.error(`Item ${i + 1}: Please select a product`);
        return;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        toast.error(`Item ${i + 1}: Enter a valid quantity`);
        return;
      }
      if (!item.factoryPrice || Number(item.factoryPrice) <= 0) {
        toast.error(`Item ${i + 1}: Enter a valid factory price`);
        return;
      }
    }

    setIsSubmitting(true);

    const input = {
      factoryName: formFactoryName,
      items: formItems.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        factoryPrice: Number(item.factoryPrice),
      })),
      notes: formNotes || undefined,
    };

    createFactoryOrder.mutate(input, {
      onSuccess: () => {
        setFormOpen(false);
        setIsSubmitting(false);
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });
  }

  // --- Status action handlers ---
  // Note: Status update functionality would need a corresponding API endpoint
  function handleStatusChange(orderId: string, newStatus: FactoryOrderStatus) {
    // TODO: Implement status update mutation when API endpoint is available
    const statusLabels: Record<string, string> = {
      sent: "Sent to Factory",
      confirmed: "Marked as Confirmed",
      fulfilled: "Marked as Fulfilled",
    };
    toast.info(`Status update to "${statusLabels[newStatus]}" - API integration pending`);
  }

  function toggleExpand(orderId: string) {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  }

  // Available products for selected factory
  const availableProducts = useMemo(() => {
    return allProducts.filter((p: any) => p.isActive);
  }, [allProducts]);

  // --- Status timeline ---

  function renderTimeline(order: FactoryOrder) {
    const steps = [
      { key: "draft", label: "Created", date: order.orderedAt, icon: FileText },
      { key: "sent", label: "Sent to Factory", date: order.status !== "draft" ? order.orderedAt : undefined, icon: Send },
      { key: "confirmed", label: "Confirmed", date: order.confirmedAt, icon: CheckCircle2 },
      { key: "fulfilled", label: "Fulfilled", date: order.fulfilledAt, icon: Truck },
    ];

    const statusOrder = ["draft", "sent", "confirmed", "fulfilled"];
    const currentIdx = statusOrder.indexOf(order.status);

    return (
      <div className="flex items-center gap-1 overflow-x-auto py-2">
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIdx;
          const StepIcon = step.icon;
          return (
            <div key={step.key} className="flex items-center gap-1">
              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <StepIcon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] text-center font-medium text-muted-foreground">
                  {step.label}
                </span>
                {step.date && isCompleted && (
                  <span className="text-[9px] text-muted-foreground">
                    {formatDate(step.date)}
                  </span>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 w-6 shrink-0 ${
                    idx < currentIdx ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // --- Loading State ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading factory orders...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Factory Orders"
          description="Manage purchase orders to factories"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load factory orders. {error.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Factory Orders"
        description="Manage purchase orders to factories"
        action={
          <Button
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            onClick={openCreateModal}
          >
            <Plus className="h-4 w-4" />
            Create PO
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total POs"
          value={stats.totalPOs}
          description="All purchase orders"
          icon={FileText}
        />
        <StatCard
          title="Pending Confirmation"
          value={stats.pendingConfirmation}
          description="Draft & sent POs"
          icon={Clock}
        />
        <StatCard
          title="Total Ordered"
          value={formatINR(stats.totalOrdered)}
          description="All time value"
          icon={IndianRupee}
        />
        <StatCard
          title="Outstanding to Factory"
          value={formatINR(stats.outstanding)}
          description="Sent & confirmed POs"
          icon={AlertCircle}
        />
      </div>

      {/* Filter Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-subtle rounded-xl p-4"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by PO number..."
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={factoryFilter} onValueChange={setFactoryFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="All Factories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Factories</SelectItem>
                {FACTORY_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From date"
                className="flex-1"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To date"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* PO List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-xl p-12 text-center"
            >
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-lg font-medium">
                No purchase orders found
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Try adjusting your filters or create a new PO.
              </p>
            </motion.div>
          ) : (
            filteredOrders.map((order, index) => {
              const isExpanded = expandedOrderId === order.id;

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                >
                  <div className="glass rounded-xl overflow-hidden">
                    {/* PO Summary Row */}
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => toggleExpand(order.id)}
                    >
                      {/* PO Number */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-semibold font-mono text-sm">
                            {order.poNumber}
                          </span>
                          <StatusBadge
                            status={order.status}
                            colorMap={factoryOrderStatusMap}
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Factory className="h-3 w-3" />
                            {order.factoryName}
                          </span>
                          <span className="hidden xs:inline">|</span>
                          <span className="hidden xs:inline flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div className="hidden md:flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                          {order.totalAmount.toLocaleString("en-IN")}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Total Amount
                        </span>
                      </div>

                      {/* Date */}
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(order.orderedAt)}
                        </span>
                      </div>

                      {/* Expand icon */}
                      <div className="shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border/50 px-4 py-3 bg-muted/20 space-y-4">
                            {/* Status Timeline */}
                            {order.status !== "cancelled" && (
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                                  Status Timeline
                                </h4>
                                {renderTimeline(order)}
                              </div>
                            )}

                            {/* Notes */}
                            {order.notes && (
                              <div className="glass-subtle rounded-lg p-3">
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Notes:</span> {order.notes}
                                </p>
                              </div>
                            )}

                            {/* Items Table */}
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                                Order Items
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-muted-foreground border-b border-border/30">
                                      <th className="text-left py-2 pr-4 font-medium">Product</th>
                                      <th className="text-center py-2 pr-4 font-medium">Qty</th>
                                      <th className="text-right py-2 pr-4 font-medium">Factory Price</th>
                                      <th className="text-right py-2 font-medium">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items.map((item) => (
                                      <tr
                                        key={item.id}
                                        className="border-b border-border/20 last:border-0"
                                      >
                                        <td className="py-2 pr-4 font-medium">
                                          {item.product?.name ?? getProductName(item.productId)}
                                        </td>
                                        <td className="py-2 pr-4 text-center">
                                          {item.quantity}
                                        </td>
                                        <td className="py-2 pr-4 text-right text-muted-foreground">
                                          {formatINR(item.factoryPrice)}
                                        </td>
                                        <td className="py-2 text-right font-semibold">
                                          {formatINR(item.totalPrice)}
                                        </td>
                                      </tr>
                                    ))}
                                    <tr className="border-t border-border/50">
                                      <td colSpan={3} className="py-2 text-right font-semibold">
                                        Grand Total
                                      </td>
                                      <td className="py-2 text-right font-bold">
                                        {formatINR(order.totalAmount)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2 border-t border-border/30">
                              {order.status === "draft" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(order.id, "sent");
                                  }}
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  Send to Factory
                                </Button>
                              )}
                              {order.status === "sent" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(order.id, "confirmed");
                                  }}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Mark Confirmed
                                </Button>
                              )}
                              {order.status === "confirmed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(order.id, "fulfilled");
                                  }}
                                >
                                  <Truck className="h-3.5 w-3.5" />
                                  Mark Fulfilled
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {ordersData?.pagination && (
        <div className="flex items-center justify-between glass-subtle rounded-xl px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {ordersData.pagination.total ?? orders.length} orders
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {ordersData.pagination.totalPages || 1}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= (ordersData.pagination.totalPages || 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      <FormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Create Purchase Order"
        description="Place a new purchase order to a factory"
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-4 py-2">
          {/* Factory */}
          <div className="space-y-1.5">
            <Label htmlFor="po-factory">Factory</Label>
            <Select value={formFactoryName} onValueChange={setFormFactoryName}>
              <SelectTrigger id="po-factory" className="w-full">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {FACTORY_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Order Items</Label>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={addItemRow}
              >
                <Plus className="h-3 w-3" />
                Add Item
              </Button>
            </div>

            {formItems.map((item, idx) => {
              const suggestedPrice = item.productId
                ? getFactoryPriceSuggestion(item.productId)
                : null;

              return (
                <div
                  key={idx}
                  className="glass-subtle rounded-lg p-3 space-y-2 relative"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Item {idx + 1}
                    </span>
                    {formItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItemRow(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Product select */}
                  <div className="space-y-1">
                    <Label className="text-[10px]">Product</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(val) => {
                        updateItemField(idx, "productId", val);
                        // Auto-fill factory price if available
                        const fp = factoryProductsList.find(
                          (fp: any) => fp.productId === val && fp.factoryName === formFactoryName
                        );
                        if (fp) {
                          updateItemField(idx, "factoryPrice", String(fp.factoryPrice));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Quantity</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItemField(idx, "quantity", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">
                        Factory Price (INR)
                        {suggestedPrice !== null && (
                          <span className="text-muted-foreground ml-1">
                            suggested: {suggestedPrice}
                          </span>
                        )}
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.factoryPrice}
                        onChange={(e) =>
                          updateItemField(idx, "factoryPrice", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Line total */}
                  {item.quantity && item.factoryPrice && (
                    <div className="text-right text-xs text-muted-foreground">
                      Line total: {formatINR(Number(item.quantity) * Number(item.factoryPrice))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Form total */}
            {formItems.some((i) => i.quantity && i.factoryPrice) && (
              <div className="glass-subtle rounded-lg p-3 text-right">
                <span className="text-sm font-semibold">
                  PO Total:{" "}
                  {formatINR(
                    formItems.reduce(
                      (sum, i) =>
                        sum + (Number(i.quantity) || 0) * (Number(i.factoryPrice) || 0),
                      0
                    )
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="po-notes">Notes (optional)</Label>
            <Textarea
              id="po-notes"
              placeholder="Add any special instructions..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
              onClick={handleFormSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create PO"}
            </Button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
