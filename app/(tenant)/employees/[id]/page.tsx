"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Phone,
  Mail,
  Building2,
  Store,
  Pencil,
  ArrowLeft,
  Shield,
  Truck,
  X,
  Plus,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Employee } from "@/lib/types";
import { EMPLOYEE_ROLE_LABELS } from "@/lib/constants";
import { useEmployee, useUpdateEmployee, useUpdateEmployeeStatus, useAssignShops, useUnassignShops } from "@/lib/hooks/use-employees";
import { useAgencies } from "@/lib/hooks/use-agencies";
import { useShopkeepers, shopkeeperKeys } from "@/lib/hooks/use-shopkeepers";
import { employeeKeys } from "@/lib/hooks/use-employees";
import { shopkeeperService } from "@/lib/api/services/shopkeeper.service";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 as LoaderIcon, AlertCircle as AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const statusColorMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "error" },
};

const roleColorMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  collector: { label: "Collector", variant: "info" },
  delivery: { label: "Delivery", variant: "warning" },
  both: { label: "Both", variant: "success" },
};

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  // Fetch employee from API
  const { data: employee, isLoading, error, refetch } = useEmployee(employeeId);

  const updateEmployee = useUpdateEmployee();
  const updateStatus = useUpdateEmployeeStatus();
  const assignShopsMutation = useAssignShops();
  const unassignShopsMutation = useUnassignShops();
  const queryClient = useQueryClient();

  // Fetch agencies and all shopkeepers for the assign modal
  const { data: agenciesData, isLoading: agenciesLoading } = useAgencies({ pageSize: 100 });
  const { data: shopkeepersData, isLoading: shopsLoading } = useShopkeepers({ pageSize: 500 });
  const agencies = agenciesData?.data || [];
  const allShops = shopkeepersData?.data || [];

  // Fetch assigned shops for this employee via API filter
  const { data: assignedShopsData, refetch: refetchAssigned } = useShopkeepers(
    { pageSize: 500, assignedEmployeeId: employeeId }
  );
  const assignedShops = assignedShopsData?.data || [];

  const agencyLookup = useMemo(() =>
    Object.fromEntries(agencies.map((a) => [a.id, a])),
    [agencies]
  );

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(employee?.name || "");
  const [editPhone, setEditPhone] = useState(employee?.phone || "");
  const [editEmail, setEditEmail] = useState(employee?.email || "");
  const [editRole, setEditRole] = useState(employee?.employeeRole || "");
  const [editPassword, setEditPassword] = useState("");

  // Credentials dialog state (shown after password reset)
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [credentialsPassword, setCredentialsPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Deactivate dialog state
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Assign shops modal state
  const [assignShopsModalOpen, setAssignShopsModalOpen] = useState(false);
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Close assign shops overlay on Escape & lock body scroll
  useEffect(() => {
    if (!assignShopsModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAssignShopsModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [assignShopsModalOpen]);

  // Unassign shop dialog state
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [shopToUnassign, setShopToUnassign] = useState<string | null>(null);
  const [unassignLoading, setUnassignLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading employee...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/employees" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Employees
        </Link>
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load employee. {error.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <Link
          href="/employees"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Link>
        <EmptyState
          icon={Users}
          title="Employee not found"
          description="The employee you are looking for does not exist."
          action={{
            label: "Back to Employees",
            onClick: () => router.push("/employees"),
          }}
        />
      </div>
    );
  }

  const handleEditEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editPhone || !editRole) {
      toast.error("Please fill in all required fields");
      return;
    }

    const input: Record<string, unknown> = {
      name: editName,
      phone: editPhone,
      email: editEmail || undefined,
      employeeRole: editRole,
    };
    if (editPassword.trim()) {
      input.password = editPassword;
    }

    const savedPassword = editPassword;

    updateEmployee.mutate(
      { id: employeeId, input },
      {
        onSuccess: () => {
          setEditModalOpen(false);
          setEditPassword("");
          // Show credentials dialog if password was changed
          if (savedPassword.trim()) {
            setCredentialsPassword(savedPassword);
            setShowPassword(false);
            setCopied(false);
            setCredentialsOpen(true);
          }
        },
      }
    );
  };

  const handleDeactivate = () => {
    setDeactivateLoading(true);
    updateStatus.mutate(
      { id: employeeId, isActive: !employee.isActive },
      {
        onSettled: () => {
          setDeactivateLoading(false);
          setDeactivateOpen(false);
        },
      },
    );
  };

  const openEditModal = () => {
    setEditName(employee.name);
    setEditPhone(employee.phone);
    setEditEmail(employee.email || "");
    setEditRole(employee.employeeRole);
    setEditPassword("");
    setEditModalOpen(true);
  };

  const openAssignShopsModal = () => {
    // Pre-select currently assigned shops
    setSelectedShopIds(assignedShops.map((s) => s.id));
    setAssignShopsModalOpen(true);
  };

  const handleAssignShops = async (e: React.FormEvent) => {
    e.preventDefault();

    setAssignLoading(true);
    try {
      const currentAssignedIds = assignedShops.map((s) => s.id);
      const toAssign = selectedShopIds.filter((id) => !currentAssignedIds.includes(id));
      const toUnassign = currentAssignedIds.filter((id) => !selectedShopIds.includes(id));

      // Each direction is a single bulk call to the new
      // /employees/:id/assignments endpoint — one round-trip each, not N.
      if (toAssign.length > 0) {
        await assignShopsMutation.mutateAsync({ employeeId, shopIds: toAssign });
      }
      if (toUnassign.length > 0) {
        await unassignShopsMutation.mutateAsync({ employeeId, shopIds: toUnassign });
      }

      await refetchAssigned();
      setAssignShopsModalOpen(false);
      const count = selectedShopIds.length;
      toast.success(`Successfully assigned ${count} shop${count === 1 ? "" : "s"} to ${employee.name}`);
    } catch {
      toast.error("Failed to update shop assignments");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassignShop = (shopId: string) => {
    setShopToUnassign(shopId);
    setUnassignDialogOpen(true);
  };

  const confirmUnassignShop = async () => {
    if (!shopToUnassign) return;

    setUnassignLoading(true);
    try {
      const shop = allShops.find((s) => s.id === shopToUnassign);
      await unassignShopsMutation.mutateAsync({
        employeeId,
        shopIds: [shopToUnassign],
      });
      await refetchAssigned();
      setUnassignDialogOpen(false);
      setShopToUnassign(null);
      toast.success(`Removed "${shop?.shopName}" from ${employee.name}'s assignments`);
    } catch {
      toast.error("Failed to unassign shop");
    } finally {
      setUnassignLoading(false);
    }
  };

  const toggleShopSelection = (shopId: string) => {
    setSelectedShopIds((prev) =>
      prev.includes(shopId)
        ? prev.filter((id) => id !== shopId)
        : [...prev, shopId]
    );
  };

  const toggleAgencySelection = (agencyId: string) => {
    const agencyShopIds = allShops
      .filter((shop) => shop.amAgencyId === agencyId || shop.pmAgencyId === agencyId)
      .map((shop) => shop.id);
    const allSelected = agencyShopIds.every((id) => selectedShopIds.includes(id));
    setSelectedShopIds((prev) =>
      allSelected
        ? prev.filter((id) => !agencyShopIds.includes(id))
        : [...new Set([...prev, ...agencyShopIds])]
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/employees"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Employees
      </Link>

      {/* Page Header */}
      <PageHeader
        title={employee.name}
        description={EMPLOYEE_ROLE_LABELS[employee.employeeRole]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openEditModal}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant={employee.isActive ? "destructive" : "default"}
              onClick={() => setDeactivateOpen(true)}
            >
              {employee.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        }
      />

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-xl p-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2.5">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium">{employee.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2.5">
              <Phone className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{employee.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2.5">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">
                {employee.email || "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2.5">
              {employee.employeeRole === "collector" ? (
                <Shield className="h-5 w-5 text-muted-foreground" />
              ) : employee.employeeRole === "delivery" ? (
                <Truck className="h-5 w-5 text-muted-foreground" />
              ) : (
                <UserCheck className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <StatusBadge
                status={employee.employeeRole}
                colorMap={roleColorMap}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-2.5">
              <UserCheck className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusBadge
                status={employee.isActive ? "active" : "inactive"}
                colorMap={statusColorMap}
              />
            </div>
          </div>

        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Assigned Shops"
          value={assignedShops.length}
          description="shops under management"
          icon={Store}
        />
        <StatCard
          title="Collections Today"
          value={0}
          description="payments collected"
          icon={Shield}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shops">
            Assigned Shops ({assignedShops.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-xl p-6 space-y-6"
          >
            <h3 className="text-lg font-semibold">Profile Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Employee ID
                </p>
                <p className="text-sm font-mono">{employee.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  User ID
                </p>
                <p className="text-sm font-mono">{employee.userId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Joined
                </p>
                <p className="text-sm">
                  {new Date(employee.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Last Updated
                </p>
                <p className="text-sm">
                  {new Date(employee.updatedAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Role Description
                </p>
                <p className="text-sm">
                  {EMPLOYEE_ROLE_LABELS[employee.employeeRole]}
                </p>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Assigned Shops Tab */}
        <TabsContent value="shops">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Assign Shops Button */}
            <div className="flex justify-end">
              <Button
                onClick={openAssignShopsModal}
                className="bg-gradient-primary text-white"
              >
                <Plus className="h-4 w-4" />
                Assign Shops
              </Button>
            </div>

            {/* Shops Table */}
            <div className="glass rounded-xl overflow-hidden">
              {assignedShops.length === 0 ? (
                <EmptyState
                  icon={Store}
                  title="No assigned shops"
                  description="This employee does not have any shops assigned yet."
                  action={{
                    label: "Assign Shops",
                    onClick: openAssignShopsModal,
                  }}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Agency</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedShops.map((shop, index) => (
                      <TableRow key={shop.id}>
                        <TableCell
                          className="cursor-pointer"
                          onClick={() => router.push(`/shopkeepers/${shop.id}`)}
                        >
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{shop.shopName}</span>
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-muted-foreground cursor-pointer"
                          onClick={() => router.push(`/shopkeepers/${shop.id}`)}
                        >
                          {shop.ownerName}
                        </TableCell>
                        <TableCell
                          className="cursor-pointer"
                          onClick={() => router.push(`/shopkeepers/${shop.id}`)}
                        >
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            {shop.amAgency?.name || shop.pmAgency?.name || agencyLookup[shop.amAgencyId || ""]?.name || agencyLookup[shop.pmAgencyId || ""]?.name || "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-muted-foreground cursor-pointer"
                          onClick={() => router.push(`/shopkeepers/${shop.id}`)}
                        >
                          {shop.area}
                        </TableCell>
                        <TableCell
                          className="cursor-pointer"
                          onClick={() => router.push(`/shopkeepers/${shop.id}`)}
                        >
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {shop.phone}
                          </span>
                        </TableCell>
                        <TableCell
                          className="cursor-pointer"
                          onClick={() => router.push(`/shopkeepers/${shop.id}`)}
                        >
                          <StatusBadge
                            status={shop.isActive ? "active" : "inactive"}
                            colorMap={statusColorMap}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnassignShop(shop.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Edit Employee Modal */}
      {editModalOpen && <FormModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Employee"
        description={`Update details for ${employee.name}`}
      >
        <form onSubmit={handleEditEmployee} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name *</Label>
            <Input
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter employee name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role">Role *</Label>
            <Select value={editRole} onValueChange={setEditRole}>
              <SelectTrigger id="edit-role" className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collector">
                  {EMPLOYEE_ROLE_LABELS.collector}
                </SelectItem>
                <SelectItem value="delivery">
                  {EMPLOYEE_ROLE_LABELS.delivery}
                </SelectItem>
                <SelectItem value="both">
                  {EMPLOYEE_ROLE_LABELS.both}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password" className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              Reset Password
            </Label>
            <Input
              id="edit-password"
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />
            <p className="text-[11px] text-muted-foreground">
              Leave blank to keep the current password. Enter a new value to reset it.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={updateEmployee.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white"
              disabled={updateEmployee.isPending}
            >
              {updateEmployee.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </FormModal>}

      {/* Deactivate Confirm Dialog */}
      {deactivateOpen && <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title={employee.isActive ? "Deactivate Employee" : "Activate Employee"}
        description={
          employee.isActive
            ? `Are you sure you want to deactivate "${employee.name}"? They will no longer be able to log in or perform field operations.`
            : `Are you sure you want to activate "${employee.name}"? They will be able to log in and resume field operations.`
        }
        confirmLabel={employee.isActive ? "Deactivate" : "Activate"}
        variant={employee.isActive ? "destructive" : "default"}
        onConfirm={handleDeactivate}
        isLoading={deactivateLoading}
      />}

      {/* Assign Shops Modal — uses plain overlay to avoid Radix Dialog render loop */}
      {assignShopsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in-0"
            onClick={() => setAssignShopsModalOpen(false)}
          />
          {/* Panel */}
          <div className="relative z-10 bg-background rounded-lg border shadow-lg w-full max-w-5xl max-h-[85vh] mx-4 p-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Assign Shops</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setAssignShopsModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Select shops from all agencies to assign to {employee.name}
              </p>
            </div>
            <hr className="mb-4" />
            <form onSubmit={handleAssignShops} className="space-y-4">
              {/* Shop List - Grouped by Agency */}
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                {(agenciesLoading || shopsLoading) ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <LoaderIcon className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground">Loading shops...</p>
                    </div>
                  </div>
                ) : allShops.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No shops available
                  </div>
                ) : (
                  agencies.map((agency) => {
                    const agencyShops = allShops.filter(
                      (shop) => shop.amAgencyId === agency.id || shop.pmAgencyId === agency.id
                    );
                    if (agencyShops.length === 0) return null;

                    const allSelected = agencyShops.every((s) => selectedShopIds.includes(s.id));
                    const someSelected = agencyShops.some((s) => selectedShopIds.includes(s.id));

                    return (
                      <div key={agency.id} className="space-y-2">
                        {/* Agency Header */}
                        <div
                          className="flex items-center gap-2 sticky top-0 bg-background py-2 border-b cursor-pointer"
                          onClick={() => toggleAgencySelection(agency.id)}
                        >
                          <div className={`size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center ${allSelected ? "bg-primary border-primary text-primary-foreground" : someSelected ? "bg-primary border-primary text-primary-foreground" : ""}`}>
                            {allSelected && <Check className="size-3.5" />}
                            {!allSelected && someSelected && <span className="block w-2 h-0.5 bg-current" />}
                          </div>
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-semibold text-sm">
                            {agency.name} - {agency.location}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            ({agencyShops.filter((s) => selectedShopIds.includes(s.id)).length}/{agencyShops.length} shops)
                          </span>
                        </div>

                        {/* Agency Shops - 2 Column Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                          {agencyShops.map((shop) => {
                            const isChecked = selectedShopIds.includes(shop.id);
                            return (
                              <div
                                key={shop.id}
                                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => toggleShopSelection(shop.id)}
                              >
                                <div className={`mt-0.5 size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center ${isChecked ? "bg-primary border-primary text-primary-foreground" : ""}`}>
                                  {isChecked && <Check className="size-3.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Store className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-medium">{shop.shopName}</span>
                                    <StatusBadge
                                      status={shop.isActive ? "active" : "inactive"}
                                      colorMap={statusColorMap}
                                    />
                                  </div>
                                  <div className="text-sm text-muted-foreground space-y-0.5">
                                    <div>Owner: {shop.ownerName}</div>
                                    <div>Area: {shop.area}</div>
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {shop.phone}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Summary */}
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedShopIds.length} shop{selectedShopIds.length === 1 ? "" : "s"} selected
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssignShopsModalOpen(false)}
                  disabled={assignLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-primary text-white"
                  disabled={assignLoading}
                >
                  {assignLoading && <span className="mr-2">Loading...</span>}
                  Save Assignments
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unassign Shop Confirm Dialog */}
      {unassignDialogOpen && <ConfirmDialog
        open={unassignDialogOpen}
        onOpenChange={setUnassignDialogOpen}
        title="Remove Shop Assignment"
        description={
          shopToUnassign
            ? `Are you sure you want to remove "${allShops.find((s) => s.id === shopToUnassign)?.shopName}" from ${employee.name}'s assignments?`
            : ""
        }
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={confirmUnassignShop}
        isLoading={unassignLoading}
      />}

      {/* Credentials Dialog — shown after password reset */}
      {credentialsOpen && <FormModal
        open
        onOpenChange={setCredentialsOpen}
        title="Password Updated"
        description={`New password for ${employee.name}. This cannot be viewed again after closing.`}
      >
        <div className="space-y-4 py-2">
          <div className="glass-subtle rounded-lg p-4 space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Login ID</p>
              <p className="text-sm font-medium font-mono">{employee.email || employee.phone}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">New Password</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium font-mono break-all">
                    {showPassword ? credentialsPassword : "••••••••••"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  `Login: ${employee.email || employee.phone}\nPassword: ${credentialsPassword}`
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Credentials"}
            </Button>
            <Button
              className="bg-gradient-primary text-white"
              size="sm"
              onClick={() => setCredentialsOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </FormModal>}
    </div>
  );
}
