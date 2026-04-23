"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Store,
  UserCircle,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Pencil,
  ArrowLeft,
  Building2,
  Loader2 as LoaderIcon,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  ShieldX,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormModal } from "@/components/shared/form-modal";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useShopkeeper, useUpdateShopkeeper } from "@/lib/hooks/use-shopkeepers";
import { useAgencies } from "@/lib/hooks/use-agencies";

// --- Status Color Maps ---

const shopStatusMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "default" },
};

// --- Helpers ---

function formatINR(value: number): string {
  return `INR ${(value ?? 0).toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// --- Main Page ---

export default function ShopkeeperDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.id as string;

  const { data: shop, isLoading, error, refetch } = useShopkeeper(shopId);
  const { data: agenciesData } = useAgencies({ pageSize: 100 });
  const updateShopkeeper = useUpdateShopkeeper();

  const agencies = agenciesData?.data || [];

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);

  // Edit form fields
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
  const [formPassword, setFormPassword] = useState("");

  // Credentials dialog state
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [credentialsPassword, setCredentialsPassword] = useState("");
  const [showCredPassword, setShowCredPassword] = useState(false);
  const [credCopied, setCredCopied] = useState(false);

  const agencyNames = useMemo(() => {
    if (!shop) return { am: null, pm: null, combined: "Unknown" };

    const names: string[] = [];
    let amName: string | null = null;
    let pmName: string | null = null;

    // AM Agency
    if (shop.amAgency?.name) {
      amName = shop.amAgency.name;
      names.push(`${amName} (AM)`);
    } else if (shop.amAgencyId) {
      const amAgency = agencies.find((a) => a.id === shop.amAgencyId);
      if (amAgency) {
        amName = amAgency.name;
        names.push(`${amName} (AM)`);
      }
    }

    // PM Agency
    if (shop.pmAgency?.name) {
      pmName = shop.pmAgency.name;
      names.push(`${pmName} (PM)`);
    } else if (shop.pmAgencyId) {
      const pmAgency = agencies.find((a) => a.id === shop.pmAgencyId);
      if (pmAgency) {
        pmName = pmAgency.name;
        names.push(`${pmName} (PM)`);
      }
    }

    return {
      am: amName,
      pm: pmName,
      combined: names.length > 0 ? names.join(", ") : "Unknown"
    };
  }, [shop, agencies]);

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading store...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/shopkeepers")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load store. {error.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Not Found ---
  if (!shop) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/shopkeepers")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="glass rounded-xl p-12 text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-lg font-medium">
            Store not found
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            The store you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  // --- Edit Form Handlers ---

  function openEditModal() {
    if (!shop) return;
    setFormAmAgencyId(shop.amAgencyId || "");
    setFormPmAgencyId(shop.pmAgencyId || "");
    setFormShopName(shop.shopName);
    setFormOwnerName(shop.ownerName);
    setFormPhone(shop.phone);
    setFormEmail(shop.email ?? "");
    setFormAddressLine1(shop.address?.line1 ?? "");
    setFormAddressLine2(shop.address?.line2 ?? "");
    setFormCity(shop.address?.city ?? "");
    setFormState(shop.address?.state ?? "");
    setFormPincode(shop.address?.pincode ?? "");
    setFormArea(shop.area ?? "");
    setFormPassword("");
    setEditOpen(true);
  }

  function handleEditSubmit() {
    if (!formShopName.trim() || !formOwnerName.trim() || !formPhone.trim()) return;
    if (!formAmAgencyId && !formPmAgencyId) {
      alert("Please select at least one agency (AM or PM)");
      return;
    }

    const passwordBeingSet = formPassword.trim();

    // Get agency names
    const amAgency = agencies.find((a) => a.id === formAmAgencyId);
    const pmAgency = agencies.find((a) => a.id === formPmAgencyId);

    updateShopkeeper.mutate(
      {
        id: shopId,
        input: {
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
            state: formState,
            pincode: formPincode,
          },
          area: formArea,
          password: passwordBeingSet || undefined,
        },
      },
      {
        onSuccess: () => {
          setEditOpen(false);
          if (passwordBeingSet) {
            setCredentialsPassword(passwordBeingSet);
            setShowCredPassword(false);
            setCredCopied(false);
            setCredentialsOpen(true);
          }
        },
      }
    );
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/shopkeepers")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Stores
        </Button>
      </div>

      {/* Page Header */}
      <PageHeader
        title={shop.shopName}
        description={`Managed by ${agencyNames.combined}`}
        action={
          <Button
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            onClick={openEditModal}
          >
            <Pencil className="h-4 w-4" />
            Edit Store
          </Button>
        }
      />

      {/* Info & Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass rounded-xl p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Shop Information</h3>
            <StatusBadge
              status={shop.isActive ? "active" : "inactive"}
              colorMap={shopStatusMap}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Owner Name</p>
                <p className="text-sm font-medium">{shop.ownerName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{shop.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">
                  {shop.email ?? "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium">
                  {shop.address?.line1 || "No address"}
                  {shop.address?.line2 ? `, ${shop.address.line2}` : ""}
                </p>
                {(shop.address?.city || shop.address?.state) && (
                  <p className="text-xs text-muted-foreground">
                    {shop.address.city}{shop.address.state ? `, ${shop.address.state}` : ""}{shop.address.pincode ? ` - ${shop.address.pincode}` : ""}
                  </p>
                )}
              </div>
            </div>

            {shop.area && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Area</p>
                  <p className="text-sm font-medium">
                    {shop.area}
                    {shop.zone ? ` (${shop.zone} Zone)` : ""}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Agency</p>
                <p className="text-sm font-medium">{agencyNames.combined}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${shop.hasLoginAccess ? "bg-green-500/10" : "bg-muted"}`}>
                {shop.hasLoginAccess ? (
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <ShieldX className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Login Access</p>
                <p className="text-sm font-medium">
                  {shop.hasLoginAccess ? "Enabled" : "Not configured"}
                </p>
                {shop.hasLoginAccess && shop.email && (
                  <p className="text-xs text-muted-foreground">
                    Logs in with {shop.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-base font-semibold mb-4">Balance</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 glass-subtle rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Wallet Balance</p>
                <p className="text-lg font-bold">{formatINR(shop.walletBalance)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-blue-500" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 glass-subtle rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                <p className="text-lg font-bold">{formatINR(shop.currentBalance)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-orange-500" />
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
              <p>
                Member since {formatDate(shop.createdAt)}
              </p>
              <p>Last updated {formatDate(shop.updatedAt)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="glass rounded-xl p-6">
              <h3 className="text-base font-semibold mb-4">Shop Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Shop Name</span>
                  <span className="font-medium">{shop.shopName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-medium">{shop.ownerName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{shop.phone}</span>
                </div>
                {shop.area && (
                  <div className="flex justify-between py-2 border-b border-border/30">
                    <span className="text-muted-foreground">Area</span>
                    <span className="font-medium">{shop.area}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Agency</span>
                  <span className="font-medium">{agencyNames.combined}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge
                    status={shop.isActive ? "active" : "inactive"}
                    colorMap={shopStatusMap}
                  />
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Login Access</span>
                  <span className={`font-medium ${shop.hasLoginAccess ? "text-green-500" : "text-muted-foreground"}`}>
                    {shop.hasLoginAccess ? "Enabled" : "Not configured"}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Edit Store Modal */}
      <FormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Store"
        description="Update store details"
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
                <Label htmlFor="edit-shop-am-agency" className="text-xs">AM Agency (Morning)</Label>
                <Select value={formAmAgencyId || "none"} onValueChange={(v) => setFormAmAgencyId(v === "none" ? "" : v)}>
                  <SelectTrigger id="edit-shop-am-agency" className="w-full">
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
                <Label htmlFor="edit-shop-pm-agency" className="text-xs">PM Agency (Evening)</Label>
                <Select value={formPmAgencyId || "none"} onValueChange={(v) => setFormPmAgencyId(v === "none" ? "" : v)}>
                  <SelectTrigger id="edit-shop-pm-agency" className="w-full">
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
              <Label htmlFor="edit-shop-name">Shop Name</Label>
              <Input
                id="edit-shop-name"
                placeholder="e.g. Patel Dairy Store"
                value={formShopName}
                onChange={(e) => setFormShopName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-owner-name">Owner Name</Label>
              <Input
                id="edit-owner-name"
                placeholder="e.g. Bhavesh Patel"
                value={formOwnerName}
                onChange={(e) => setFormOwnerName(e.target.value)}
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-shop-phone">Phone</Label>
              <Input
                id="edit-shop-phone"
                placeholder="+91 98250 11001"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-shop-email">Email (Optional)</Label>
              <Input
                id="edit-shop-email"
                type="email"
                placeholder="owner@email.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Login Credentials */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-shop-password" className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              {shop.hasLoginAccess ? "Reset Password" : "Set Login Password"}
            </Label>
            <Input
              id="edit-shop-password"
              type="password"
              placeholder={shop.hasLoginAccess ? "Leave blank to keep current password" : "Set a login password for the store owner"}
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              {shop.hasLoginAccess
                ? "Leave blank to keep the current password. Enter a new value to reset it."
                : "Provide email above and a password to enable login access for this store owner."}
            </p>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <Label>Address</Label>
            <div className="glass-subtle rounded-lg p-3 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-addr-line1" className="text-xs">
                  Address Line 1
                </Label>
                <Input
                  id="edit-addr-line1"
                  placeholder="Street address"
                  value={formAddressLine1}
                  onChange={(e) => setFormAddressLine1(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-addr-line2" className="text-xs">
                  Address Line 2 (Optional)
                </Label>
                <Input
                  id="edit-addr-line2"
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

          {/* Area */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-shop-area">Area</Label>
            <Input
              id="edit-shop-area"
              placeholder="e.g. Maninagar"
              value={formArea}
              onChange={(e) => setFormArea(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={updateShopkeeper.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
              onClick={handleEditSubmit}
              disabled={updateShopkeeper.isPending}
            >
              {updateShopkeeper.isPending ? "Saving..." : "Update Store"}
            </Button>
          </div>
        </div>
      </FormModal>

      {/* Credentials Dialog — shown after password reset */}
      <FormModal
        open={credentialsOpen}
        onOpenChange={setCredentialsOpen}
        title="Password Updated"
        description="Save these credentials — the password cannot be retrieved later."
      >
        <div className="space-y-4 py-2">
          {/* Login ID */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Login ID</Label>
            <div className="glass-subtle rounded-lg px-3 py-2 text-sm font-medium">
              {shop.email || shop.phone}
            </div>
          </div>

          {/* Password with show/hide */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Password</Label>
            <div className="flex items-center gap-2">
              <div className="glass-subtle rounded-lg px-3 py-2 text-sm font-mono flex-1">
                {showCredPassword ? credentialsPassword : "\u2022".repeat(credentialsPassword.length || 8)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowCredPassword(!showCredPassword)}
              >
                {showCredPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Copy button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              const text = `Login ID: ${shop.email || shop.phone}\nPassword: ${credentialsPassword}`;
              navigator.clipboard.writeText(text);
              setCredCopied(true);
              setTimeout(() => setCredCopied(false), 2000);
            }}
          >
            {credCopied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Credentials
              </>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            This password will not be shown again. Please save it securely.
          </p>
        </div>
      </FormModal>
    </div>
  );
}
