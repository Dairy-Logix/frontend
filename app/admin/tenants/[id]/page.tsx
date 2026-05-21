"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  IndianRupee,
  Users,
  UserCheck,
  Pencil,
  ShieldOff,
  ShieldCheck,
  Trash2,
  MapPin,
  Mail,
  Phone,
  Building2,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormModal } from "@/components/shared/form-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTenant, useUpdateTenant, useDeleteTenant, useTenantStats } from "@/lib/hooks";
import { AdminSubscriptionTab } from "./subscription-tab";
import { toast } from "sonner";


const tenantStatusColorMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "default" },
  suspended: { label: "Suspended", variant: "error" },
};

const planLabels: Record<string, string> = {
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function TenantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  // Fetch real tenant data
  const { data: tenant, isLoading, error, refetch } = useTenant(tenantId);
  const { data: tenantStats } = useTenantStats(tenantId);
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();

  // Derive tenantName early (before useEffect)
  const tenantName = tenant?.companyName || tenant?.name || "Unknown";

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Initialize edit form when tenant data loads
  useEffect(() => {
    if (tenant) {
      setEditName(tenant.companyName || tenant.name || "");
      setEditContact(tenant.ownerName || "");
      setEditEmail(tenant.ownerEmail || "");
      setEditPhone(tenant.ownerPhone || "");
    }
  }, [tenant]);

  // Suspend/Activate dialog state
  const [suspendOpen, setSuspendOpen] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tenant Not Found"
          description="Unable to load tenant details"
          action={
            <Button variant="outline" asChild>
              <Link href="/admin/tenants">
                <ArrowLeft className="h-4 w-4" />
                Back to Tenants
              </Link>
            </Button>
          }
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load tenant. {(error as Error).message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tenant Not Found"
          description="The requested tenant could not be found."
          action={
            <Button variant="outline" asChild>
              <Link href="/admin/tenants">
                <ArrowLeft className="h-4 w-4" />
                Back to Tenants
              </Link>
            </Button>
          }
        />
        <Card className="glass">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tenant exists with the ID &quot;{tenantId}&quot;. It may have been
              removed or the URL is incorrect.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/admin/tenants">Return to Tenant List</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = tenant.status === "active";

  const openEditModal = () => {
    setEditName(tenantName);
    setEditContact(tenant.ownerName);
    setEditEmail(tenant.ownerEmail);
    setEditPhone(tenant.ownerPhone);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!tenant) return;

    updateTenant.mutate({
      id: tenantId,
      input: {
        companyName: editName,
        ownerName: editContact,
        ownerEmail: editEmail,
        ownerPhone: editPhone,
      },
    }, {
      onSuccess: () => {
        setEditOpen(false);
      },
    });
  };

  const handleSuspendActivate = async () => {
    if (!tenant) return;

    const newStatus = tenant.status === "active" ? "inactive" : "active";
    updateTenant.mutate({
      id: tenantId,
      input: { status: newStatus as any },
    }, {
      onSuccess: () => {
        setSuspendOpen(false);
      },
    });
  };

  const handleDelete = async () => {
    deleteTenant.mutate(tenantId, {
      onSuccess: () => {
        setDeleteOpen(false);
        router.push("/admin/tenants");
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenantName}
        description={`Manage details and configuration for ${tenantName}.`}
        action={
          <Button variant="outline" asChild>
            <Link href="/admin/tenants">
              <ArrowLeft className="h-4 w-4" />
              Back to Tenants
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* ==================== Overview Tab ==================== */}
        <TabsContent value="overview" className="space-y-6">
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <StatCard
                title="Orders"
                value={(tenantStats?.totalOrders ?? 0).toLocaleString("en-IN")}
                icon={ShoppingCart}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Revenue"
                value={`INR ${(tenantStats?.totalRevenue ?? 0).toLocaleString("en-IN")}`}
                icon={IndianRupee}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Stores"
                value={tenantStats?.totalShopkeepers ?? 0}
                icon={Users}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Agencies"
                value={tenantStats?.totalAgencies ?? tenant.agencyCount ?? 0}
                icon={Building2}
              />
            </motion.div>
          </motion.div>

          {/* Tenant Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle>Tenant Information</CardTitle>
                <CardDescription>
                  Core details about this tenant organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Business Name</p>
                        <p className="text-sm text-muted-foreground">{tenantName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="h-4 w-4 mt-0.5 text-muted-foreground text-xs font-mono">/</span>
                      <div>
                        <p className="text-sm font-medium">Slug</p>
                        <p className="text-sm text-muted-foreground font-mono">{tenant.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <UserCheck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Contact Person</p>
                        <p className="text-sm text-muted-foreground">{tenant.ownerName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{tenant.ownerEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{tenant.ownerPhone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {tenant.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Address</p>
                          <p className="text-sm text-muted-foreground">
                            {tenant.address}
                            <br />
                            {tenant.city && tenant.state && `${tenant.city}, ${tenant.state}`}
                            {tenant.pincode && ` ${tenant.pincode}`}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <span className="h-4 w-4 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Plan</p>
                        <Badge variant="secondary" className="mt-1">
                          {planLabels[tenant.subscriptionPlan || tenant.plan] || tenant.subscriptionPlan || tenant.plan}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="h-4 w-4 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <div className="mt-1">
                          <StatusBadge
                            status={tenant.status}
                            colorMap={tenantStatusColorMap}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tenant.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button variant="outline" onClick={openEditModal}>
              <Pencil className="h-4 w-4" />
              Edit Details
            </Button>
            <Button
              variant="outline"
              onClick={() => setSuspendOpen(true)}
            >
              {isActive ? (
                <ShieldOff className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {isActive ? "Suspend Tenant" : "Activate Tenant"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Tenant
            </Button>
          </motion.div>
        </TabsContent>

        {/* ==================== Subscription Tab ==================== */}
        <TabsContent value="subscription" className="space-y-6">
          <AdminSubscriptionTab tenantId={tenantId} />
        </TabsContent>

        {/* ==================== Configuration Tab ==================== */}
        <TabsContent value="configuration" className="space-y-6">
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Feature Toggles - moved to Subscription tab */}
            <motion.div variants={itemVariants}>
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Enabled Features</CardTitle>
                  <CardDescription>
                    Read-only summary. Manage features in the Subscription tab.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {tenant.features &&
                    typeof tenant.features === "object" &&
                    Object.entries(tenant.features).filter(([, v]) => v).length > 0 ? (
                      Object.entries(tenant.features)
                        .filter(([, v]) => v)
                        .map(([k]) => (
                          <Badge key={k} variant="secondary">
                            {k}
                          </Badge>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No features enabled. Apply a plan from the Subscription tab.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Limits */}
            <motion.div variants={itemVariants}>
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Resource Limits</CardTitle>
                  <CardDescription>
                    Current usage against configured limits. Edit limits in the Subscription tab.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-3">
                    {(() => {
                      const limits: any = tenant.limits || {};
                      const agencyCount = tenantStats?.totalAgencies ?? tenant.agencyCount ?? 0;
                      const storeCount = tenantStats?.totalShopkeepers ?? 0;
                      const productCount = tenantStats?.totalProducts ?? 0;
                      const maxAgencies = limits?.maxAgencies ?? 0;
                      const maxStores = limits?.maxShopkeepers ?? 0;
                      const maxProducts = limits?.maxProducts ?? 0;
                      return (
                        <>
                          <div className="space-y-2">
                            <Label>Max Agencies</Label>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold">{agencyCount}</span>
                              <span className="text-sm text-muted-foreground">
                                / {maxAgencies}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-primary transition-all"
                                style={{
                                  width: `${maxAgencies > 0 ? Math.min(100, (agencyCount / maxAgencies) * 100) : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Max Shopkeepers</Label>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold">{storeCount}</span>
                              <span className="text-sm text-muted-foreground">
                                / {maxStores}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-primary transition-all"
                                style={{
                                  width: `${maxStores > 0 ? Math.min(100, (storeCount / maxStores) * 100) : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Max Products</Label>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold">{productCount}</span>
                              <span className="text-sm text-muted-foreground">
                                / {maxProducts}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-primary transition-all"
                                style={{
                                  width: `${maxProducts > 0 ? Math.min(100, (productCount / maxProducts) * 100) : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </motion.div>
        </TabsContent>

      </Tabs>

      {/* ==================== Edit Modal ==================== */}
      <FormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Tenant Details"
        description="Update the basic information for this tenant."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Business Name</Label>
            <Input
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-contact">Contact Person</Label>
            <Input
              id="edit-contact"
              value={editContact}
              onChange={(e) => setEditContact(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={updateTenant.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={updateTenant.isPending}>
              {updateTenant.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {updateTenant.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </FormModal>

      {/* ==================== Suspend/Activate Dialog ==================== */}
      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={isActive ? "Suspend Tenant" : "Activate Tenant"}
        description={
          isActive
            ? `Are you sure you want to suspend "${tenantName}"? All users under this tenant will lose access until the tenant is reactivated.`
            : `Are you sure you want to activate "${tenantName}"? This will restore access for all users under this tenant.`
        }
        confirmLabel={isActive ? "Suspend" : "Activate"}
        variant={isActive ? "destructive" : "default"}
        onConfirm={handleSuspendActivate}
        isLoading={updateTenant.isPending}
      />

      {/* ==================== Delete Dialog ==================== */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Tenant"
        description={`Are you sure you want to permanently delete "${tenantName}"? This action cannot be undone and will remove all associated data including agencies, stores, orders, and invoices.`}
        confirmLabel="Delete Permanently"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteTenant.isPending}
      />
    </div>
  );
}
