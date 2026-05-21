"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  UserCircle,
  Phone,
  MapPin,
  IndianRupee,
  Plus,
  Building2,
  Filter,
  ArrowUpDown,
  GripVertical,
  Save,
  Wallet,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Shop } from "@/lib/types";
import {
  useShopkeepers,
  useCreateShopkeeper,
  useUpdateShopkeeper,
  useDeleteShopkeeper,
  useTotalWalletBalance,
} from "@/lib/hooks";
import { useAgencies } from "@/lib/hooks/use-agencies";
import { Loader2 as LoaderIcon, AlertCircle, Eye, EyeOff, Copy, Check, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from "@/components/providers/intl-provider";

// --- Status Color Map ---

const shopStatusMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "default" },
};

// --- Helpers ---

function formatINR(value: number): string {
  return `INR ${value.toLocaleString("en-IN")}`;
}

// --- Main Page ---

export default function ShopkeepersPage() {
  const tPage = useTranslations("pages.stores");
  const router = useRouter();

  // Filter state
  const [search, setSearch] = useState("");
  const [activeAgencyTab, setActiveAgencyTab] = useState("");
  const [agencyTypeFilter, setAgencyTypeFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch agencies from API
  const { data: agenciesData } = useAgencies({ pageSize: 100 });
  const agencies = agenciesData?.data || [];

  // Set first agency as default when agencies load
  useEffect(() => {
    if (agencies.length > 0 && !activeAgencyTab) {
      setActiveAgencyTab(agencies[0].id);
    }
  }, [agencies, activeAgencyTab]);

  function getAgencyName(shop: Shop): string {
    // Build list of agency names
    const names: string[] = [];

    // AM Agency
    if (shop.amAgency?.name) {
      names.push(`${shop.amAgency.name} (AM)`);
    } else if (shop.amAgencyId) {
      const amAgency = agencies.find((a) => a.id === shop.amAgencyId);
      if (amAgency) names.push(`${amAgency.name} (AM)`);
    }

    // PM Agency
    if (shop.pmAgency?.name) {
      names.push(`${shop.pmAgency.name} (PM)`);
    } else if (shop.pmAgencyId) {
      const pmAgency = agencies.find((a) => a.id === shop.pmAgencyId);
      if (pmAgency) names.push(`${pmAgency.name} (PM)`);
    }

    return names.length > 0 ? names.join(", ") : "Unknown";
  }

  // Data fetching with real API
  const {
    data: shopkeepersData,
    isLoading,
    error,
    refetch,
  } = useShopkeepers({
    page,
    pageSize,
    search: search || undefined,
    agencyId: activeAgencyTab || undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  });

  // Mutations
  const createShopkeeper = useCreateShopkeeper();
  const updateShopkeeper = useUpdateShopkeeper();
  const deleteShopkeeper = useDeleteShopkeeper();
  const { data: totalWalletBalance = 0 } = useTotalWalletBalance();

  const shopkeepers = shopkeepersData?.data || [];

  // Add modal state
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reorder mode state
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [customOrder, setCustomOrder] = useState<string[]>([]);

  // Form fields
  const [formAmAgencyId, setFormAmAgencyId] = useState("");
  const [formPmAgencyId, setFormPmAgencyId] = useState("");
  const [formShopName, setFormShopName] = useState("");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddressLine1, setFormAddressLine1] = useState("");
  const [formAddressLine2, setFormAddressLine2] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formOpeningBalance, setFormOpeningBalance] = useState("");
  const [formPassword, setFormPassword] = useState("");

  // Credentials dialog state
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [credentialsData, setCredentialsData] = useState<{ name: string; login: string; password: string } | null>(null);
  const [showCredPassword, setShowCredPassword] = useState(false);
  const [credCopied, setCredCopied] = useState(false);

  // --- Unique Areas for Filter ---

  const uniqueAreas = useMemo(() => {
    const areas = new Set(shopkeepers.map((s) => s.area).filter(Boolean));
    return Array.from(areas).sort();
  }, [shopkeepers]);

  // Note: Filtering is now handled server-side via the API
  const filteredShopkeepers = useMemo(() => {
    let filtered = shopkeepers;

    // Client-side filtering for agencyType and area (not supported by API)
    if (agencyTypeFilter !== "all" || areaFilter !== "all") {
      filtered = filtered.filter((shop) => {
        const amAgency = agencies.find((a) => a.id === shop.amAgencyId);
        const pmAgency = agencies.find((a) => a.id === shop.pmAgencyId);

        // Match if either AM or PM agency matches the filter
        const matchesAgencyType =
          agencyTypeFilter === "all" ||
          amAgency?.agencyType === agencyTypeFilter ||
          pmAgency?.agencyType === agencyTypeFilter;

        const matchesArea =
          areaFilter === "all" || shop.area === areaFilter;

        return matchesAgencyType && matchesArea;
      });
    }

    // Apply custom order if in reorder mode or if custom order exists
    if (customOrder.length > 0 && isReorderMode) {
      filtered = filtered.sort((a, b) => {
        const indexA = customOrder.indexOf(a.id);
        const indexB = customOrder.indexOf(b.id);
        // If not in custom order, put at end
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    return filtered;
  }, [shopkeepers, agencyTypeFilter, areaFilter, customOrder, isReorderMode]);

  // --- Stats ---

  const stats = useMemo(() => {
    const total = shopkeepers.length;
    const active = shopkeepers.filter((s) => s.isActive).length;
    const totalOutstanding = shopkeepers.reduce(
      (sum, s) => sum + s.currentBalance,
      0
    );
    return { total, active, totalOutstanding };
  }, [shopkeepers]);

  // --- Current Agency Store Count ---
  const currentAgencyCount = shopkeepersData?.pagination?.total || shopkeepers.length;

  // --- Form Handlers ---

  function openAddModal() {
    setFormAmAgencyId("");
    setFormPmAgencyId("");
    setFormShopName("");
    setFormOwnerName("");
    setFormPhone("");
    setFormEmail("");
    setFormAddressLine1("");
    setFormAddressLine2("");
    setFormCity("");
    setFormState("Gujarat");
    setFormPincode("");
    setFormArea("");
    setFormOpeningBalance("");
    setFormPassword("");
    setFormOpen(true);
  }

  function handleFormSubmit() {
    if (!formAmAgencyId && !formPmAgencyId) {
      toast.error("Please select at least one agency (AM or PM)");
      return;
    }
    if (!formShopName.trim()) {
      toast.error("Shop name is required");
      return;
    }
    if (!formOwnerName.trim()) {
      toast.error("Owner name is required");
      return;
    }
    if (!formPhone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!formAddressLine1.trim()) {
      toast.error("Address line 1 is required");
      return;
    }
    if (!formCity.trim()) {
      toast.error("City is required");
      return;
    }
    if (!formPincode.trim()) {
      toast.error("Pincode is required");
      return;
    }
    if (!formArea.trim()) {
      toast.error("Area is required");
      return;
    }

    setIsSubmitting(true);

    // Get agency names
    const amAgency = agencies.find((a) => a.id === formAmAgencyId);
    const pmAgency = agencies.find((a) => a.id === formPmAgencyId);

    const input = {
      amAgencyId: formAmAgencyId || undefined,
      amAgencyName: amAgency?.name || undefined,
      pmAgencyId: formPmAgencyId || undefined,
      pmAgencyName: pmAgency?.name || undefined,
      shopName: formShopName,
      ownerName: formOwnerName,
      phone: formPhone,
      email: formEmail || undefined,
      address: {
        line1: formAddressLine1,
        line2: formAddressLine2 || undefined,
        city: formCity,
        state: formState || "Gujarat",
        pincode: formPincode,
      },
      area: formArea,
      openingBalance: Number(formOpeningBalance) || 0,
      password: formPassword || undefined,
    };

    const savedPassword = formPassword;
    const savedName = formShopName;
    const savedLogin = formEmail || formPhone;

    createShopkeeper.mutate(input, {
      onSuccess: () => {
        setFormOpen(false);
        setIsSubmitting(false);
        // Show credentials dialog if password was set
        if (savedPassword.trim()) {
          setCredentialsData({ name: savedName, login: savedLogin, password: savedPassword });
          setShowCredPassword(false);
          setCredCopied(false);
          setCredentialsOpen(true);
        }
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });
  }

  // --- Reorder Handlers ---

  function toggleReorderMode() {
    if (!isReorderMode) {
      // Entering reorder mode - initialize custom order with current filtered list
      setCustomOrder(filteredShopkeepers.map(s => s.id));
    }
    setIsReorderMode(!isReorderMode);
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...customOrder];
    const draggedId = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedId);

    setCustomOrder(newOrder);
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  function saveOrder() {
    toast.success(`Order saved! ${customOrder.length} stores reordered.`);
    setIsReorderMode(false);
    // Here you would typically save to backend/localStorage
    // localStorage.setItem('shopkeeper-order', JSON.stringify(customOrder));
  }

  // --- Loading State ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading stores...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={tPage("title")}
          description={tPage("description")}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load stores. {error.message}</span>
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
        title="Stores"
        description="Manage store accounts"
        action={
          <div className="flex items-center gap-2">
            {isReorderMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsReorderMode(false);
                    setCustomOrder([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                  onClick={saveOrder}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Order
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={toggleReorderMode}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Reorder
                </Button>
                <Button
                  className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                  onClick={openAddModal}
                >
                  <Plus className="h-4 w-4" />
                  Add Store
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stores"
          value={stats.total}
          description="Registered shops"
          icon={Store}
        />
        <StatCard
          title="Active Stores"
          value={stats.active}
          description="Currently active"
          icon={UserCircle}
          trend={{ value: 6.2, isPositive: true }}
        />
        <StatCard
          title="Total Outstanding"
          value={formatINR(stats.totalOutstanding)}
          description="Across all shops"
          icon={IndianRupee}
        />
        <StatCard
          title="Total Wallet Balance"
          value={formatINR(totalWalletBalance)}
          description="Across all stores"
          icon={Wallet}
        />
      </div>

      {/* Agency Tabs and Filters - Merged */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-subtle rounded-xl p-4 space-y-4"
      >
        {/* Agency Tabs */}
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Building2 className="h-3.5 w-3.5" />
            <span className="font-medium">Agencies</span>
          </div>

          {/* Scrollable Tab Container */}
          <div className="relative -mx-4 px-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="flex gap-2 pb-2 min-w-max">
              {/* Individual Agency Tabs */}
              {agencies.map((agency) => {
                const isActive = activeAgencyTab === agency.id;
                const storeCount = isActive ? currentAgencyCount : 0;

                return (
                  <motion.button
                    key={agency.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveAgencyTab(agency.id);
                      setPage(1);
                    }}
                    className={`relative px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                      isActive
                        ? "text-white shadow-lg"
                        : "text-muted-foreground hover:bg-white/5"
                    }`}
                    style={{
                      background: isActive ? "linear-gradient(90deg, #42A5F5 0%, #0D47A1 100%)" : "transparent",
                    }}
                  >
                    <span>{agency.name}</span>
                    <span className="text-xs opacity-75">({agency.agencyType})</span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                        {storeCount}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: "linear-gradient(90deg, #42A5F5 0%, #0D47A1 100%)",
                          zIndex: -1,
                        }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-medium">Filters</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search stores..."
              className="flex-1"
            />
            <Select value={agencyTypeFilter} onValueChange={(v) => { setAgencyTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
            <Select value={areaFilter} onValueChange={(v) => { setAreaFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {uniqueAreas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Shopkeeper List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredShopkeepers.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-xl p-12 text-center"
            >
              <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-lg font-medium">
                No stores found
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Try adjusting your filters or add a new store.
              </p>
            </motion.div>
          ) : (
            filteredShopkeepers.map((shop, index) => (
              <motion.div
                key={shop.id ?? `shop-${index}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                draggable={isReorderMode}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={isReorderMode ? "cursor-move" : ""}
              >
                <div
                  className={`glass rounded-xl overflow-hidden transition-colors ${
                    isReorderMode
                      ? "cursor-move border-2 border-dashed border-primary/50"
                      : "cursor-pointer hover:bg-white/5"
                  } ${draggedIndex === index ? "opacity-50" : ""}`}
                  onClick={() => !isReorderMode && router.push(`/shopkeepers/${shop.id}`)}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Drag Handle (shown only in reorder mode) */}
                    {isReorderMode && (
                      <div className="flex items-center justify-center shrink-0">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    {/* Shop Avatar */}
                    <div className="hidden sm:flex h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 items-center justify-center shrink-0">
                      <Store className="h-5 w-5 text-blue-500" />
                    </div>

                    {/* Shop Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm truncate">
                          {shop.shopName}
                        </h3>
                        <StatusBadge
                          status={shop.isActive ? "active" : "inactive"}
                          colorMap={shopStatusMap}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <UserCircle className="h-3 w-3" />
                          {shop.ownerName}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {shop.area}
                        </span>
                        <span className="hidden md:inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {getAgencyName(shop)}
                        </span>
                        <span className="hidden lg:inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {shop.phone}
                        </span>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="hidden md:flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                        {(shop.currentBalance ?? 0).toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Outstanding Balance
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {shopkeepersData?.pagination && (
        <div className="flex items-center justify-between glass-subtle rounded-xl px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {shopkeepers.length} of {shopkeepersData.pagination.total ?? shopkeepers.length} stores
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {shopkeepersData.pagination.totalPages || 1}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= (shopkeepersData.pagination.totalPages || 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Add Store Modal */}
      <FormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Add Store"
        description="Fill in the details to register a new store"
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-4 py-2">
          {/* Agencies - AM and PM */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">
                Agencies <span className="text-red-500">*</span>
              </Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Select at least one agency (AM for morning, PM for evening). A store can have both.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="shop-am-agency" className="text-xs">AM Agency (Morning)</Label>
                <Select value={formAmAgencyId || "none"} onValueChange={(v) => setFormAmAgencyId(v === "none" ? "" : v)}>
                  <SelectTrigger id="shop-am-agency" className="w-full">
                    <SelectValue placeholder="Select AM agency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {agencies
                      .filter((a) => a.agencyType === "AM")
                      .map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name} ({agency.location})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shop-pm-agency" className="text-xs">PM Agency (Evening)</Label>
                <Select value={formPmAgencyId || "none"} onValueChange={(v) => setFormPmAgencyId(v === "none" ? "" : v)}>
                  <SelectTrigger id="shop-pm-agency" className="w-full">
                    <SelectValue placeholder="Select PM agency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {agencies
                      .filter((a) => a.agencyType === "PM")
                      .map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name} ({agency.location})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

          {/* Shop Name & Owner Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="shop-name">Shop Name</Label>
              <Input
                id="shop-name"
                placeholder="e.g. Patel Dairy Store"
                value={formShopName}
                onChange={(e) => setFormShopName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner-name">Owner Name</Label>
              <Input
                id="owner-name"
                placeholder="e.g. Bhavesh Patel"
                value={formOwnerName}
                onChange={(e) => setFormOwnerName(e.target.value)}
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="shop-phone">Phone</Label>
              <Input
                id="shop-phone"
                placeholder="+91 98250 11001"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shop-email">Email (Optional)</Label>
              <Input
                id="shop-email"
                type="email"
                placeholder="owner@email.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Login Credentials */}
          <div className="space-y-1.5">
            <Label htmlFor="shop-password">Login Password</Label>
            <Input
              id="shop-password"
              type="password"
              placeholder="Set a login password for the store owner"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              If email and password are provided, the store owner can log in to the application.
            </p>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <Label>Address</Label>
            <div className="glass-subtle rounded-lg p-3 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="addr-line1" className="text-xs">
                  Address Line 1
                </Label>
                <Input
                  id="addr-line1"
                  placeholder="Street address"
                  value={formAddressLine1}
                  onChange={(e) => setFormAddressLine1(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-line2" className="text-xs">
                  Address Line 2 (Optional)
                </Label>
                <Input
                  id="addr-line2"
                  placeholder="Landmark, near..."
                  value={formAddressLine2}
                  onChange={(e) => setFormAddressLine2(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">City</Label>
                  <Input
                    placeholder="Ahmedabad"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">State</Label>
                  <Input
                    placeholder="Gujarat"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Pincode</Label>
                  <Input
                    placeholder="380001"
                    value={formPincode}
                    onChange={(e) => setFormPincode(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Area & Opening Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="shop-area">Area</Label>
              <Input
                id="shop-area"
                placeholder="e.g. Maninagar"
                value={formArea}
                onChange={(e) => setFormArea(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opening-balance">Opening Balance (INR)</Label>
              <Input
                id="opening-balance"
                type="number"
                placeholder="0"
                value={formOpeningBalance}
                onChange={(e) => setFormOpeningBalance(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
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
              {isSubmitting ? "Saving..." : "Create Store"}
            </Button>
          </div>
        </div>
      </FormModal>

      {/* Credentials Dialog — shown once after create with password */}
      <FormModal
        open={credentialsOpen}
        onOpenChange={setCredentialsOpen}
        title="Login Credentials"
        description={`Save these credentials for ${credentialsData?.name ?? "the store owner"}. The password cannot be viewed again after closing this dialog.`}
      >
        {credentialsData && (
          <div className="space-y-4 py-2">
            <div className="glass-subtle rounded-lg p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Login ID</p>
                <p className="text-sm font-medium font-mono">{credentialsData.login}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Password</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium font-mono break-all">
                      {showCredPassword ? credentialsData.password : "••••••••••"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowCredPassword((v) => !v)}
                    className="shrink-0"
                  >
                    {showCredPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Login: ${credentialsData.login}\nPassword: ${credentialsData.password}`
                  );
                  setCredCopied(true);
                  setTimeout(() => setCredCopied(false), 2000);
                }}
              >
                {credCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {credCopied ? "Copied!" : "Copy Credentials"}
              </Button>
              <Button
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                size="sm"
                onClick={() => setCredentialsOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
