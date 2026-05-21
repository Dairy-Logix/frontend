"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Store,
  Plus,
  Loader2 as LoaderIcon,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SearchInput } from "@/components/shared/search-input";
import { FormModal } from "@/components/shared/form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { AGENCY_TYPE_LABELS } from "@/lib/constants";
import type { Agency, AgencyType } from "@/lib/types";
import {
  useAgencies,
  useCreateAgency,
  useUpdateAgency,
  useDeleteAgency,
  useToggleAcceptingOrders,
} from "@/lib/hooks";
import { useTranslations } from "@/components/providers/intl-provider";

const statusColorMap: Record<
  string,
  { label: string; variant: "success" | "default" }
> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "default" },
};

const agencyTypeColorMap: Record<
  string,
  { label: string; variant: "info" | "warning" }
> = {
  AM: { label: "AM", variant: "info" },
  PM: { label: "PM", variant: "warning" },
};

export default function AgenciesPage() {
  const tPage = useTranslations("pages.agencies");
  const router = useRouter();

  // Filter state
  const [search, setSearch] = useState("");
  const [agencyTypeFilter, setAgencyTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Data fetching with real API
  const {
    data: agenciesData,
    isLoading,
    error,
    refetch,
  } = useAgencies({
    page,
    pageSize,
    search: search || undefined,
    agencyType: agencyTypeFilter !== "all" ? (agencyTypeFilter as AgencyType) : undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  });

  // Mutations
  const createAgency = useCreateAgency();
  const updateAgency = useUpdateAgency();
  const deleteAgency = useDeleteAgency();
  const toggleAcceptingOrders = useToggleAcceptingOrders();

  const agencies = agenciesData?.data || [];

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for Add Agency
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    contactPerson: "",
    phone: "",
    email: "",
    agencyType: "" as AgencyType | "",
  });

  // Note: Filtering is now handled server-side via the API
  const filtered = agencies;

  // Stats
  const stats = useMemo(() => {
    const total = agencies.length;
    const active = agencies.filter((a) => a.isActive).length;
    const totalShopkeepers = agencies.reduce((sum, a) => sum + (a.shopkeeperCount || 0), 0);

    return { total, active, totalShopkeepers };
  }, [agencies]);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      contactPerson: "",
      phone: "",
      email: "",
      agencyType: "" as AgencyType | "",
    });
  };

  const handleAddAgency = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Agency name is required");
      return;
    }
    if (!formData.location.trim()) {
      toast.error("Location is required");
      return;
    }
    if (!formData.agencyType) {
      toast.error("Agency type is required");
      return;
    }

    setIsSubmitting(true);

    const input = {
      name: formData.name,
      location: formData.location,
      agencyType: formData.agencyType as AgencyType,
      address: formData.line1 && formData.city && formData.state && formData.pincode
        ? {
            line1: formData.line1,
            line2: formData.line2 || undefined,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          }
        : undefined,
      contactPerson: formData.contactPerson || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
    };

    createAgency.mutate(input, {
      onSuccess: () => {
        setAddModalOpen(false);
        setIsSubmitting(false);
        resetForm();
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });
  };

  // --- Loading State ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading agencies...</p>
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
            <span>Failed to load agencies. {error.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agencies"
        description="Manage your distribution agencies"
        action={
          <Button
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 hover:opacity-90"
            onClick={() => setAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Agency
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Agencies"
          value={stats.total}
          description="registered agencies"
          icon={Building2}
          trend={{ value: 12.0, isPositive: true }}
        />
        <StatCard
          title="Active Agencies"
          value={stats.active}
          description="currently active"
          icon={Building2}
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatCard
          title="Total Stores"
          value={stats.totalShopkeepers}
          description="across all agencies"
          icon={Store}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search agencies by name, location, or contact..."
          className="max-w-md"
        />
        <Select value={agencyTypeFilter} onValueChange={setAgencyTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Agency Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="AM">Morning (AM)</SelectItem>
            <SelectItem value="PM">Evening (PM)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agency Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agencies.map((agency, index) => (
          <AgencyCard
            key={agency.id ?? `agency-${index}`}
            agency={agency}
            index={index}
            onClick={() => router.push(`/agencies/${agency.id}`)}
            onToggleAcceptingOrders={(checked) =>
              toggleAcceptingOrders.mutate({ id: agency.id, isAcceptingOrders: checked })
            }
          />
        ))}
        {agencies.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No agencies found matching your search.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {agenciesData?.pagination && (
        <div className="flex items-center justify-between glass-subtle rounded-xl px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {agencies.length} of {agenciesData.pagination.total ?? agencies.length} agencies
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {agenciesData.pagination.totalPages || 1}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= (agenciesData.pagination.totalPages || 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Add Agency Modal */}
      <FormModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Add Agency"
        description="Create a new distribution agency"
      >
        <form onSubmit={handleAddAgency} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agency Name</Label>
            <Input
              id="name"
              placeholder="e.g. North Zone Branch"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agencyType">Agency Type</Label>
            <Select
              value={formData.agencyType}
              onValueChange={(value) => handleFormChange("agencyType", value)}
              required
            >
              <SelectTrigger id="agencyType" className="w-full">
                <SelectValue placeholder="Select distribution type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">Morning Distribution (AM)</SelectItem>
                <SelectItem value="PM">Evening Distribution (PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. Ahmedabad"
              value={formData.location}
              onChange={(e) => handleFormChange("location", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line1">Address Line 1</Label>
            <Input
              id="line1"
              placeholder="Street address"
              value={formData.line1}
              onChange={(e) => handleFormChange("line1", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="line2">Address Line 2</Label>
            <Input
              id="line2"
              placeholder="Landmark, area (optional)"
              value={formData.line2}
              onChange={(e) => handleFormChange("line2", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="City"
                value={formData.city}
                onChange={(e) => handleFormChange("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="State"
                value={formData.state}
                onChange={(e) => handleFormChange("state", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              placeholder="e.g. 380001"
              value={formData.pincode}
              onChange={(e) => handleFormChange("pincode", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              placeholder="Full name"
              value={formData.contactPerson}
              onChange={(e) => handleFormChange("contactPerson", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={(e) => handleFormChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="agency@example.com"
                value={formData.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddModalOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 hover:opacity-90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Agency"}
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}

function AgencyCard({
  agency,
  index,
  onClick,
  onToggleAcceptingOrders,
}: {
  agency: Agency;
  index: number;
  onClick: () => void;
  onToggleAcceptingOrders: (checked: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass rounded-xl p-6 cursor-pointer transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-lg p-2.5 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base">{agency.name}</h3>
              <StatusBadge
                status={agency.agencyType}
                colorMap={agencyTypeColorMap}
              />
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {agency.location}
            </div>
          </div>
        </div>
        <StatusBadge
          status={agency.isActive ? "active" : "inactive"}
          colorMap={statusColorMap}
        />
      </div>

      {agency.contactPerson && (
        <div className="text-sm text-muted-foreground mb-1">
          <span className="font-medium text-foreground">
            {agency.contactPerson}
          </span>
        </div>
      )}

      {agency.phone && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
          <Phone className="h-3.5 w-3.5" />
          {agency.phone}
        </div>
      )}

      {agency.email && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Mail className="h-3.5 w-3.5" />
          {agency.email}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-sm">
          <Store className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{agency.shopkeeperCount}</span>
          <span className="text-muted-foreground">Shops</span>
        </div>
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-muted-foreground">Accepting Orders</span>
          <Switch
            checked={agency.isAcceptingOrders}
            onCheckedChange={onToggleAcceptingOrders}
          />
        </div>
      </div>
    </motion.div>
  );
}
