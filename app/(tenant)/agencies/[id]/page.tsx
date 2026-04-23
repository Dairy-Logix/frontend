"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Store,
  Pencil,
  ArrowLeft,
  Calendar,
  Loader2 as LoaderIcon,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SearchInput } from "@/components/shared/search-input";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useAgency, useUpdateAgency } from "@/lib/hooks/use-agencies";
import { useShopkeepersByAgency } from "@/lib/hooks/use-shopkeepers";
import { AGENCY_TYPE_LABELS } from "@/lib/constants";
import type { Employee, Shop } from "@/lib/types";

const agencyStatusColorMap: Record<
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

export default function AgencyDetailsPage() {
  const params = useParams();
  const agencyId = params.id as string;

  const { data: agency, isLoading, error, refetch } = useAgency(agencyId);
  const { data: shopkeepers } = useShopkeepersByAgency(agencyId);
  const updateAgency = useUpdateAgency();

  const agencyShopkeepers = shopkeepers || [];

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [shopkeeperSearch, setShopkeeperSearch] = useState("");

  const filteredShopkeepers = useMemo(() => {
    if (!shopkeeperSearch) return agencyShopkeepers;
    const q = shopkeeperSearch.toLowerCase();
    return agencyShopkeepers.filter(
      (s: Shop) =>
        s.ownerName?.toLowerCase().includes(q) ||
        s.shopName?.toLowerCase().includes(q) ||
        s.area?.toLowerCase().includes(q)
    );
  }, [shopkeeperSearch, agencyShopkeepers]);

  const handleEditAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    updateAgency.mutate(
      {
        id: agencyId,
        input: {
          name: formData.get("name") as string,
          location: formData.get("location") as string,
          agencyType: formData.get("agencyType") as "AM" | "PM",
          contactPerson: (formData.get("contactPerson") as string) || undefined,
          phone: (formData.get("phone") as string) || undefined,
          email: (formData.get("email") as string) || undefined,
          address:
            (formData.get("line1") as string)
              ? {
                  line1: formData.get("line1") as string,
                  line2: (formData.get("line2") as string) || undefined,
                  city: formData.get("city") as string,
                  state: formData.get("state") as string,
                  pincode: formData.get("pincode") as string,
                }
              : undefined,
        },
      },
      {
        onSuccess: () => setEditModalOpen(false),
      }
    );
  };

  const handleDeactivate = () => {
    if (!agency) return;
    updateAgency.mutate(
      {
        id: agencyId,
        input: { isActive: !agency.isActive },
      },
      {
        onSuccess: () => setDeactivateDialogOpen(false),
      }
    );
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading agency...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/agencies" className="hover:text-foreground transition-colors">
            Back to Agencies
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load agency. {error.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/agencies" className="hover:text-foreground transition-colors">
            Back to Agencies
          </Link>
        </div>
        <div className="glass rounded-xl p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Agency Not Found</h2>
          <p className="text-muted-foreground">
            The agency you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <Link
          href="/agencies"
          className="hover:text-foreground transition-colors"
        >
          Back to Agencies
        </Link>
      </motion.div>

      {/* Page Header */}
      <PageHeader
        title={agency.name}
        description={agency.location}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setDeactivateDialogOpen(true)}
            >
              {agency.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 hover:opacity-90"
              onClick={() => setEditModalOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              Edit Agency
            </Button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Stores"
          value={agencyShopkeepers.length || agency.shopkeeperCount}
          description="registered shops"
          icon={Store}
        />
        <motion.div
          whileHover={{ y: -2, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass rounded-xl p-6 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-lg p-2 text-white">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <StatusBadge
              status={agency.isActive ? "active" : "inactive"}
              colorMap={agencyStatusColorMap}
              className="w-fit"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Since {new Date(agency.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shopkeepers">
            Stores ({agencyShopkeepers.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-xl p-6"
            >
              <h3 className="text-base font-semibold mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Agency Type
                    </p>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={agency.agencyType}
                        colorMap={agencyTypeColorMap}
                      />
                      <span className="text-sm font-medium">
                        {AGENCY_TYPE_LABELS[agency.agencyType] || agency.agencyType}
                      </span>
                    </div>
                  </div>
                </div>
                {agency.contactPerson && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Contact Person
                      </p>
                      <p className="text-sm font-medium">
                        {agency.contactPerson}
                      </p>
                    </div>
                  </div>
                )}
                {agency.phone && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{agency.phone}</p>
                    </div>
                  </div>
                )}
                {agency.email && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{agency.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="glass rounded-xl p-6"
            >
              <h3 className="text-base font-semibold mb-4">Address</h3>
              {agency.address ? (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{agency.address.line1}</p>
                    {agency.address.line2 && (
                      <p className="text-muted-foreground">
                        {agency.address.line2}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      {agency.address.city}, {agency.address.state}{" "}
                      {agency.address.pincode}
                    </p>
                    {agency.address.country && (
                      <p className="text-muted-foreground">
                        {agency.address.country}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {agency.location || "No address recorded"}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </TabsContent>

        {/* Shopkeepers Tab */}
        <TabsContent value="shopkeepers">
          <div className="space-y-4">
            <SearchInput
              value={shopkeeperSearch}
              onChange={setShopkeeperSearch}
              placeholder="Search stores by name, shop, or area..."
              className="max-w-md"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShopkeepers.map((shop: Shop, index: number) => (
                <ShopkeeperCard key={shop.id ?? `shop-${index}`} shop={shop} index={index} />
              ))}
              {filteredShopkeepers.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {shopkeeperSearch
                      ? "No stores found matching your search."
                      : "No stores assigned to this agency."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Agency Modal */}
      <FormModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Agency"
        description={`Update details for ${agency.name}`}
      >
        <form onSubmit={handleEditAgency} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Agency Name</Label>
            <Input
              id="edit-name"
              name="name"
              placeholder="e.g. North Zone Branch"
              defaultValue={agency.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-agencyType">Agency Type</Label>
            <Select name="agencyType" defaultValue={agency.agencyType}>
              <SelectTrigger id="edit-agencyType" className="w-full">
                <SelectValue placeholder="Select distribution type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">Morning Distribution (AM)</SelectItem>
                <SelectItem value="PM">Evening Distribution (PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-location">Location</Label>
            <Input
              id="edit-location"
              name="location"
              placeholder="e.g. Ahmedabad"
              defaultValue={agency.location}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-line1">Address Line 1</Label>
            <Input
              id="edit-line1"
              name="line1"
              placeholder="Street address"
              defaultValue={agency.address?.line1 ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-line2">Address Line 2</Label>
            <Input
              id="edit-line2"
              name="line2"
              placeholder="Landmark, area (optional)"
              defaultValue={agency.address?.line2 ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-city">City</Label>
              <Input
                id="edit-city"
                name="city"
                placeholder="City"
                defaultValue={agency.address?.city ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-state">State</Label>
              <Input
                id="edit-state"
                name="state"
                placeholder="State"
                defaultValue={agency.address?.state ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-pincode">Pincode</Label>
            <Input
              id="edit-pincode"
              name="pincode"
              placeholder="e.g. 380001"
              defaultValue={agency.address?.pincode ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-contactPerson">Contact Person</Label>
            <Input
              id="edit-contactPerson"
              name="contactPerson"
              placeholder="Full name"
              defaultValue={agency.contactPerson ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                name="phone"
                placeholder="+91 XXXXX XXXXX"
                defaultValue={agency.phone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                placeholder="agency@example.com"
                defaultValue={agency.email ?? ""}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 hover:opacity-90"
              disabled={updateAgency.isPending}
            >
              {updateAgency.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        title={`${agency.isActive ? "Deactivate" : "Activate"} Agency`}
        description={`Are you sure you want to ${agency.isActive ? "deactivate" : "activate"} "${agency.name}"? ${agency.isActive ? "This will affect all employees and stores under this agency." : "This will re-enable operations for this agency."}`}
        confirmLabel={agency.isActive ? "Deactivate" : "Activate"}
        variant={agency.isActive ? "destructive" : "default"}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}

function ShopkeeperCard({ shop, index }: { shop: Shop; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="glass-subtle rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm">{shop.shopName}</h4>
          <p className="text-sm text-muted-foreground">{shop.ownerName}</p>
        </div>
        <StatusBadge
          status={shop.isActive ? "active" : "inactive"}
          colorMap={{
            active: { label: "Active", variant: "success" },
            inactive: { label: "Inactive", variant: "default" },
          }}
        />
      </div>
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          {shop.phone}
        </div>
        {shop.area && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {shop.area}{shop.address?.city ? `, ${shop.address.city}` : ""}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-xs text-muted-foreground">Outstanding Balance</span>
        <span className="text-sm font-semibold">
          INR {(shop.currentBalance ?? 0).toLocaleString("en-IN")}
        </span>
      </div>
    </motion.div>
  );
}
