"use client";

import { useState, useMemo } from "react";
import { todayIST } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Truck,
  Package,
  CheckCircle2,
  Plus,
  Store,
  Calendar,
  User,
  MapPin,
  Send,
  Navigation,
  CircleCheck,
  AlertTriangle,
  Loader2 as LoaderIcon,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Building2,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

import type { Delivery, DeliveryStatus } from "@/lib/types";
import {
  useDeliveries,
  useCreateDelivery,
  useUpdateDeliveryStatus,
  useBookedShops,
} from "@/lib/hooks";
import { useAgencies } from "@/lib/hooks/use-agencies";
import { useShopkeepers } from "@/lib/hooks/use-shopkeepers";
import { useEmployees } from "@/lib/hooks/use-employees";
import { useOrders } from "@/lib/hooks/use-orders";
import { useTranslations } from "@/components/providers/intl-provider";

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
  returned: { label: "Returned", variant: "error" },
};

// --- Tab definitions ---

type TabKey = "today" | "upcoming" | "completed" | "all";

const tabs: { key: TabKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

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

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isFuture(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  return dateOnly > today;
}

function todayDateValue(): string {
  return todayIST();
}

// --- Area-grouped shop picker ---

interface AreaGroup {
  area: string;
  shops: { id: string; shopName: string; area: string }[];
}

function groupShopsByArea(shops: { id: string; shopName: string; area: string }[]): AreaGroup[] {
  const map = new Map<string, AreaGroup>();
  for (const shop of shops) {
    const area = shop.area || "Other";
    if (!map.has(area)) map.set(area, { area, shops: [] });
    map.get(area)!.shops.push(shop);
  }
  return Array.from(map.values()).sort((a, b) => a.area.localeCompare(b.area));
}

function AreaShopPicker({
  areaGroups,
  selectedShopIds,
  onToggleShop,
  onToggleArea,
}: {
  areaGroups: AreaGroup[];
  selectedShopIds: string[];
  onToggleShop: (shopId: string) => void;
  onToggleArea: (shopIds: string[], allSelected: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleCollapse(area: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(area) ? next.delete(area) : next.add(area);
      return next;
    });
  }

  if (areaGroups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No shops with confirmed orders for this agency
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {areaGroups.map((group) => {
        const shopIds = group.shops.map((s) => s.id);
        const selectedInArea = shopIds.filter((id) => selectedShopIds.includes(id));
        const allSelected = selectedInArea.length === shopIds.length;
        const someSelected = selectedInArea.length > 0 && !allSelected;
        const isCollapsed = collapsed.has(group.area);

        return (
          <div key={group.area} className="border border-border/40 rounded-lg overflow-hidden">
            {/* Area header row */}
            <div
              className="flex items-center gap-2 px-3 py-2 bg-muted/40 cursor-pointer select-none hover:bg-muted/60 transition-colors"
              onClick={() => toggleCollapse(group.area)}
            >
              <div
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleArea(shopIds, allSelected);
                }}
              >
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                  onCheckedChange={() => onToggleArea(shopIds, allSelected)}
                  className={someSelected ? "opacity-70" : ""}
                />
              </div>
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm flex-1">{group.area}</span>
              <span className="text-xs text-muted-foreground">
                {selectedInArea.length}/{shopIds.length}
              </span>
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>

            {/* Shop rows */}
            {!isCollapsed && (
              <div className="divide-y divide-border/20">
                {group.shops.map((shop) => (
                  <label
                    key={shop.id}
                    className="flex items-center gap-2 px-3 py-2 pl-8 cursor-pointer hover:bg-muted/20 transition-colors"
                  >
                    <Checkbox
                      checked={selectedShopIds.includes(shop.id)}
                      onCheckedChange={() => onToggleShop(shop.id)}
                    />
                    <Store className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm">{shop.shopName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Main Page ---

export default function DeliveriesPage() {
  const tPage = useTranslations("pages.deliveries");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch lookup data
  const { data: agenciesData } = useAgencies({ pageSize: 100 });
  const { data: shopkeepersData } = useShopkeepers({ pageSize: 500 });
  const { data: employeesData } = useEmployees({ pageSize: 200 });

  const agencies = agenciesData?.data || [];
  const allShopkeepers = shopkeepersData?.data || [];
  const employeesLookup = employeesData?.data || [];

  const deliveryEmployees = useMemo(
    () => employeesLookup.filter((e) => (e.employeeRole === "delivery" || e.employeeRole === "both") && e.isActive),
    [employeesLookup]
  );

  function getEmployeeName(delivery: Delivery): string {
    if (delivery.employeeName) return delivery.employeeName;
    if (!delivery.employeeId) return "—";
    return employeesLookup.find((e) => e.id === delivery.employeeId)?.name ?? "Unknown";
  }

  function getShopName(shopId: string): string {
    return allShopkeepers.find((s) => s.id === shopId)?.shopName ?? "Unknown Shop";
  }

  // Data fetching
  const { data: deliveriesData, isLoading, error, refetch } = useDeliveries({
    page,
    pageSize,
    status: statusFilter !== "all" ? (statusFilter as DeliveryStatus) : undefined,
  });

  const createDelivery = useCreateDelivery();
  const updateDeliveryStatus = useUpdateDeliveryStatus();

  const deliveries = deliveriesData?.data || [];

  // --- Form state ---
  const [formOpen, setFormOpen] = useState(false);
  const [formAgencyId, setFormAgencyId] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formScheduledDate, setFormScheduledDate] = useState(todayDateValue());
  const [formNotes, setFormNotes] = useState("");
  const [formSelectedShopIds, setFormSelectedShopIds] = useState<string[]>([]);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    deliveryId: string;
    newStatus: DeliveryStatus;
    label: string;
  } | null>(null);

  // Fetch confirmed orders for the selected agency
  const { data: confirmedOrdersData, isLoading: ordersLoading } = useOrders({
    agencyId: formAgencyId || undefined,
    status: "confirmed",
    pageSize: 500,
    page: 1,
  });

  // Set of shopIds that have at least one confirmed order
  const confirmedShopIds = useMemo(() => {
    const orders = confirmedOrdersData?.data || [];
    return new Set(orders.map((o) => o.shopId).filter(Boolean));
  }, [confirmedOrdersData]);

  // Shopkeeper IDs already in an active delivery for this agency on this date
  const { data: bookedShopIds = [] } = useBookedShops(
    formAgencyId,
    formScheduledDate,
    formOpen && !!formAgencyId,
  );
  const bookedShopIdSet = useMemo(() => new Set(bookedShopIds), [bookedShopIds]);

  // Shops for selected agency that have confirmed orders AND are not already in a delivery for this date
  const shopsForAgency = useMemo(() => {
    if (!formAgencyId) return [];
    return allShopkeepers.filter(
      (s) =>
        s.isActive &&
        (s.amAgencyId === formAgencyId || s.pmAgencyId === formAgencyId) &&
        confirmedShopIds.has(s.id) &&
        !bookedShopIdSet.has(s.id)
    );
  }, [formAgencyId, allShopkeepers, confirmedShopIds, bookedShopIdSet]);

  const areaGroups = useMemo(
    () => groupShopsByArea(shopsForAgency.map((s) => ({ id: s.id, shopName: s.shopName, area: s.area || "Other" }))),
    [shopsForAgency]
  );

  const totalShops = shopsForAgency.length;
  const allSelected = totalShops > 0 && formSelectedShopIds.length === totalShops;

  // --- Filtered deliveries ---
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => {
      const employeeName = getEmployeeName(delivery).toLowerCase();
      const agencyName = (delivery.agencyName || "").toLowerCase();
      const shopNames = delivery.routeShops
        .map((rs) => (rs.shopName || getShopName(rs.shopId)).toLowerCase())
        .join(" ");

      const matchesSearch =
        search === "" ||
        (delivery.deliveryNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
        agencyName.includes(search.toLowerCase()) ||
        employeeName.includes(search.toLowerCase()) ||
        shopNames.includes(search.toLowerCase());

      let matchesTab = true;
      if (activeTab === "today") {
        matchesTab = !!delivery.scheduledDate && isToday(delivery.scheduledDate);
      } else if (activeTab === "upcoming") {
        matchesTab = !!delivery.scheduledDate && isFuture(delivery.scheduledDate) && delivery.status === "pending";
      } else if (activeTab === "completed") {
        matchesTab = delivery.status === "delivered";
      }

      return matchesSearch && matchesTab;
    });
  }, [deliveries, search, activeTab]);

  // --- Stats ---
  const stats = useMemo(() => {
    const todayDeliveries = deliveries.filter((d) => d.scheduledDate && isToday(d.scheduledDate)).length;
    const inTransit = deliveries.filter((d) => d.status === "in_transit" || d.status === "dispatched").length;
    const completedToday = deliveries.filter(
      (d) => d.status === "delivered" && d.deliveredAt && isToday(d.deliveredAt)
    ).length;
    return { todayDeliveries, inTransit, completedToday };
  }, [deliveries]);

  // --- Form handlers ---

  function openCreateModal() {
    setFormAgencyId(agencies[0]?.id ?? "");
    setFormEmployeeId("");
    setFormScheduledDate(todayDateValue());
    setFormNotes("");
    setFormSelectedShopIds([]);
    setFormOpen(true);
  }

  function handleAgencyChange(agencyId: string) {
    setFormAgencyId(agencyId);
    setFormSelectedShopIds([]);
  }

  function handleDateChange(date: string) {
    setFormScheduledDate(date);
    setFormSelectedShopIds([]);
  }

  function handleToggleShop(shopId: string) {
    setFormSelectedShopIds((prev) =>
      prev.includes(shopId) ? prev.filter((id) => id !== shopId) : [...prev, shopId]
    );
  }

  function handleToggleArea(shopIds: string[], allSelected: boolean) {
    if (allSelected) {
      setFormSelectedShopIds((prev) => prev.filter((id) => !shopIds.includes(id)));
    } else {
      setFormSelectedShopIds((prev) => Array.from(new Set([...prev, ...shopIds])));
    }
  }

  function handleSelectAllShops() {
    setFormSelectedShopIds(shopsForAgency.map((s) => s.id));
  }

  function handleClearShops() {
    setFormSelectedShopIds([]);
  }

  function handleFormSubmit() {
    if (!formAgencyId) {
      toast.error("Please select an agency");
      return;
    }
    if (formSelectedShopIds.length === 0) {
      toast.error("Please select at least one shop");
      return;
    }

    const selectedAgency = agencies.find((a) => a.id === formAgencyId);
    const assignedEmployeeId = formEmployeeId && formEmployeeId !== "none" ? formEmployeeId : undefined;
    const employee = assignedEmployeeId ? employeesLookup.find((e) => e.id === assignedEmployeeId) : undefined;

    const input = {
      agencyId: formAgencyId,
      agencyName: selectedAgency?.name,
      employeeId: assignedEmployeeId,
      employeeName: employee?.name,
      scheduledDate: formScheduledDate
        ? new Date(formScheduledDate).toISOString()
        : new Date().toISOString(),
      routeShops: formSelectedShopIds.map((shopId, index) => {
        const shop = allShopkeepers.find((s) => s.id === shopId);
        return {
          shopId,
          shopName: shop?.shopName,
          sequence: index + 1,
        };
      }),
      notes: formNotes || undefined,
    };

    createDelivery.mutate(input, {
      onSuccess: () => {
        setFormOpen(false);
      },
    });
  }

  // --- Status update handlers ---

  function openStatusConfirm(deliveryId: string, newStatus: DeliveryStatus, label: string) {
    setConfirmAction({ deliveryId, newStatus, label });
    setConfirmOpen(true);
  }

  function handleStatusUpdate() {
    if (!confirmAction) return;
    updateDeliveryStatus.mutate(
      { id: confirmAction.deliveryId, status: confirmAction.newStatus },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setConfirmAction(null);
        },
      }
    );
  }

  // --- Loading / Error states ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={tPage("title")} description={tPage("description")} />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load deliveries. {error.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
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
        title="Deliveries"
        description="Manage and track all deliveries"
        action={
          <Button
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            onClick={openCreateModal}
          >
            <Plus className="h-4 w-4" />
            Create Delivery
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Today's Deliveries" value={stats.todayDeliveries} description="Scheduled for today" icon={Calendar} />
        <StatCard title="In Transit" value={stats.inTransit} description="Currently on the road" icon={Truck} trend={{ value: 8, isPositive: true }} />
        <StatCard title="Completed Today" value={stats.completedToday} description="Delivered successfully" icon={CheckCircle2} />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-subtle rounded-xl p-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by agency, employee, store..."
            className="flex-1"
          />
        </div>
      </motion.div>

      {/* Delivery Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredDeliveries.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-xl p-12 text-center"
            >
              <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-lg font-medium">No deliveries found</p>
              <p className="text-muted-foreground text-sm mt-1">
                Try adjusting your filters or create a new delivery.
              </p>
            </motion.div>
          ) : (
            filteredDeliveries.map((delivery, index) => (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="glass rounded-xl p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold font-mono">
                          {(delivery as any).deliveryNumber ?? delivery.id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <StatusBadge status={delivery.status} colorMap={deliveryStatusColorMap} />
                      {delivery.agencyName && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground border border-border/40 rounded px-1.5 py-0.5">
                          <Building2 className="h-3 w-3" />
                          {delivery.agencyName}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {getEmployeeName(delivery)}
                      </span>
                      {delivery.scheduledDate && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(delivery.scheduledDate)}
                        </span>
                      )}
                      {delivery.deliveredAt && (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                          Delivered at {formatTime(delivery.deliveredAt)}
                        </span>
                      )}
                    </div>

                    {/* Route shops */}
                    <div className="flex flex-wrap items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {delivery.routeShops.length} shop{delivery.routeShops.length !== 1 ? "s" : ""}:
                      </span>
                      {delivery.routeShops.slice(0, 4).map((rs, i) => (
                        <span key={rs.shopId} className="text-sm">
                          <span className="inline-flex items-center gap-1">
                            <Store className="h-3 w-3 text-muted-foreground" />
                            {rs.shopName || getShopName(rs.shopId)}
                          </span>
                          {i < Math.min(delivery.routeShops.length, 4) - 1 && (
                            <span className="text-muted-foreground mx-1">&rarr;</span>
                          )}
                        </span>
                      ))}
                      {delivery.routeShops.length > 4 && (
                        <span className="text-xs text-muted-foreground">+{delivery.routeShops.length - 4} more</span>
                      )}
                    </div>

                    {delivery.notes && (
                      <p className="text-xs text-muted-foreground italic">{delivery.notes}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end shrink-0">
                    {delivery.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => openStatusConfirm(delivery.id, "dispatched", "Dispatched")}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Mark Dispatched
                      </Button>
                    )}
                    {delivery.status === "dispatched" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => openStatusConfirm(delivery.id, "in_transit", "In Transit")}
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Mark In Transit
                      </Button>
                    )}
                    {(delivery.status === "dispatched" || delivery.status === "in_transit") && (
                      <Button
                        size="sm"
                        className="gap-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                        onClick={() => openStatusConfirm(delivery.id, "delivered", "Delivered")}
                      >
                        <CircleCheck className="h-3.5 w-3.5" />
                        Mark Delivered
                      </Button>
                    )}
                    {delivery.status === "failed" && (
                      <div className="flex items-center gap-1.5 text-sm text-[var(--destructive)]">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Delivery Failed
                      </div>
                    )}
                    {delivery.status === "delivered" && (
                      <div className="flex items-center gap-1.5 text-sm text-[var(--success)]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {deliveriesData?.pagination && (
        <div className="flex items-center justify-between glass-subtle rounded-xl px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {filteredDeliveries.length} of {deliveriesData.pagination.total} deliveries
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {deliveriesData.pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (deliveriesData.pagination.totalPages || 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Delivery Modal */}
      <FormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Create Delivery"
        description="Assign a delivery run for an agency"
        className="sm:max-w-lg"
      >
        <div className="space-y-4 py-2">
          {/* Agency Select */}
          <div className="space-y-1.5">
            <Label htmlFor="delivery-agency">Agency</Label>
            <Select
              value={formAgencyId}
              onValueChange={handleAgencyChange}
            >
              <SelectTrigger id="delivery-agency" className="w-full">
                <SelectValue placeholder="Select agency" />
              </SelectTrigger>
              <SelectContent>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shops grouped by area */}
          {formAgencyId && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>
                  Shops
                  {formSelectedShopIds.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({formSelectedShopIds.length} of {totalShops} selected)
                    </span>
                  )}
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllShops}
                    disabled={allSelected || totalShops === 0}
                    className="h-7 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearShops}
                    disabled={formSelectedShopIds.length === 0}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
              <div className="glass-subtle rounded-lg p-2 max-h-[260px] overflow-y-auto">
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    Loading confirmed orders...
                  </div>
                ) : (
                  <AreaShopPicker
                    areaGroups={areaGroups}
                    selectedShopIds={formSelectedShopIds}
                    onToggleShop={handleToggleShop}
                    onToggleArea={handleToggleArea}
                  />
                )}
              </div>
            </div>
          )}

          {/* Employee Select */}
          <div className="space-y-1.5">
            <Label htmlFor="delivery-employee">
              Assign Employee
              <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
              <SelectTrigger id="delivery-employee" className="w-full">
                <SelectValue placeholder="Select delivery employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Unassigned —</SelectItem>
                {deliveryEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Date */}
          <div className="space-y-1.5">
            <Label htmlFor="delivery-date">Scheduled Date</Label>
            <Input
              id="delivery-date"
              type="date"
              value={formScheduledDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="delivery-notes">Notes (optional)</Label>
            <Textarea
              id="delivery-notes"
              placeholder="Add any delivery instructions..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
              onClick={handleFormSubmit}
              disabled={createDelivery.isPending}
            >
              {createDelivery.isPending ? "Creating..." : "Create Delivery"}
            </Button>
          </div>
        </div>
      </FormModal>

      {/* Confirm Status Update Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Mark as ${confirmAction?.label ?? ""}`}
        description={`Are you sure you want to update this delivery status to "${confirmAction?.label ?? ""}"?`}
        confirmLabel={`Mark ${confirmAction?.label ?? ""}`}
        variant="destructive"
        onConfirm={handleStatusUpdate}
      />
    </div>
  );
}
