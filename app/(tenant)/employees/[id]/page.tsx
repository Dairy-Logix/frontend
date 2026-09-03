"use client";

import { useState, useEffect } from "react";
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
import { ImageUploadField } from "@/components/shared/image-upload-field";
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
import type { Employee } from "@/lib/types";
import { EMPLOYEE_ROLE_LABELS } from "@/lib/constants";
import {
  useEmployee,
  useUpdateEmployee,
  useUpdateEmployeeStatus,
  useAssignShops,
  useUnassignShops,
  useDeliveryAssignment,
  useAssignDeliveryAgencies,
  useUnassignDeliveryAgencies,
  useAssignDeliveryShops,
  useUnassignDeliveryShops,
  useCollectorAssignment,
  useAssignCollectorAgencies,
  useUnassignCollectorAgencies,
  useCollectionsToday,
} from "@/lib/hooks/use-employees";
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

  // Delivery assignment hooks
  const { data: deliveryAssignment } = useDeliveryAssignment(employeeId);
  const assignDeliveryAgencies = useAssignDeliveryAgencies();
  const unassignDeliveryAgencies = useUnassignDeliveryAgencies();
  const assignDeliveryShops = useAssignDeliveryShops();
  const unassignDeliveryShops = useUnassignDeliveryShops();

  // Collector assignment hooks
  const { data: collectorAssignment } = useCollectorAssignment(employeeId);
  const assignCollectorAgencies = useAssignCollectorAgencies();
  const unassignCollectorAgencies = useUnassignCollectorAgencies();

  // Today's collections for this employee (en-CA gives a YYYY-MM-DD local date).
  const todayStr = new Date().toLocaleDateString("en-CA");
  const { data: collectionsToday } = useCollectionsToday(employeeId, todayStr);

  // Fetch agencies and all shopkeepers for the assign modal
  const { data: agenciesData, isLoading: agenciesLoading } = useAgencies({ pageSize: 100 });
  const { data: shopkeepersData, isLoading: shopsLoading } = useShopkeepers({ pageSize: 500 });
  const agencies = agenciesData?.data || [];
  const allShops = shopkeepersData?.data || [];

  // Refetch helper to refresh the collector's assigned-shop split after edits
  const { refetch: refetchAssigned } = useShopkeepers(
    { pageSize: 500, assignedEmployeeId: employeeId }
  );

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(employee?.name || "");
  const [editPhone, setEditPhone] = useState(employee?.phone || "");
  const [editEmail, setEditEmail] = useState(employee?.email || "");
  const [editRole, setEditRole] = useState(employee?.employeeRole || "");
  const [editPassword, setEditPassword] = useState("");
  // undefined = photo unchanged; string = newly uploaded key; null = removed
  const [editPhotoKey, setEditPhotoKey] = useState<string | null | undefined>(undefined);

  // Credentials dialog state (shown after password reset)
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [credentialsPassword, setCredentialsPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Deactivate dialog state
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Collector — Manage Agencies modal state
  const [manageCollectorAgenciesOpen, setManageCollectorAgenciesOpen] = useState(false);
  const [selectedCollectorAgencyIds, setSelectedCollectorAgencyIds] = useState<string[]>([]);
  const [manageCollectorAgenciesLoading, setManageCollectorAgenciesLoading] = useState(false);

  // Collector — Manage Stores modal state
  const [manageCollectorStoresOpen, setManageCollectorStoresOpen] = useState(false);
  const [selectedCollectorShopIds, setSelectedCollectorShopIds] = useState<string[]>([]);
  const [manageCollectorStoresLoading, setManageCollectorStoresLoading] = useState(false);

  // Close Collector Manage Agencies overlay on Escape & lock body scroll
  useEffect(() => {
    if (!manageCollectorAgenciesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setManageCollectorAgenciesOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [manageCollectorAgenciesOpen]);

  // Close Collector Manage Stores overlay on Escape & lock body scroll
  useEffect(() => {
    if (!manageCollectorStoresOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setManageCollectorStoresOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [manageCollectorStoresOpen]);

  // Delivery — Manage Agencies modal state
  const [manageAgenciesOpen, setManageAgenciesOpen] = useState(false);
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [manageAgenciesLoading, setManageAgenciesLoading] = useState(false);

  // Delivery — Manage Stores modal state
  const [manageStoresOpen, setManageStoresOpen] = useState(false);
  const [selectedDeliveryShopIds, setSelectedDeliveryShopIds] = useState<string[]>([]);
  const [manageStoresLoading, setManageStoresLoading] = useState(false);

  // Close Manage Agencies overlay on Escape & lock body scroll
  useEffect(() => {
    if (!manageAgenciesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setManageAgenciesOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [manageAgenciesOpen]);

  // Close Manage Stores overlay on Escape & lock body scroll
  useEffect(() => {
    if (!manageStoresOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setManageStoresOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [manageStoresOpen]);

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
    if (editPhotoKey !== undefined) {
      input.photoKey = editPhotoKey;
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
    setEditPhotoKey(undefined);
    setEditModalOpen(true);
  };

  // ---- Delivery assignment derived values & handlers ----
  const isDeliveryCapable =
    employee.employeeRole === "delivery" || employee.employeeRole === "both";
  const assignedAgencyIds = deliveryAssignment?.agencyIds ?? [];
  const deliveryShopIds = deliveryAssignment?.shopIds ?? [];
  const deliveryShopShifts = deliveryAssignment?.shopShifts ?? {};

  const assignedAgencies = agencies.filter((a) => assignedAgencyIds.includes(a.id));

  const shopBelongsToAgency = (
    shop: (typeof allShops)[number],
    agencyId: string
  ) => shop.amAgencyId === agencyId || shop.pmAgencyId === agencyId;

  // An agency is a store's morning or evening agency — that is the shift it
  // serves. Delivery routing is per (store, shift): the same store can have a
  // different driver in the morning and the evening.
  const shiftOfAgency = (shop: (typeof allShops)[number], agencyId: string): "AM" | "PM" =>
    shop.amAgencyId === agencyId ? "AM" : "PM";
  const deliveryKey = (shopId: string, shift: "AM" | "PM") => `${shopId}:${shift}`;
  const routedDeliveryKeys = Object.entries(deliveryShopShifts).flatMap(([shopId, shifts]) =>
    shifts.map((sh) => deliveryKey(shopId, sh))
  );
  const isRoutedForAgency = (shop: (typeof allShops)[number], agencyId: string) =>
    routedDeliveryKeys.includes(deliveryKey(shop.id, shiftOfAgency(shop, agencyId)));
  // Store + agency pairs another driver holds: shown as taken and not selectable
  // until released from that driver (the API refuses them anyway).
  const heldByOthers = new Map(
    (deliveryAssignment?.heldByOthers ?? []).map((h) => [deliveryKey(h.shopId, h.shift), h.employeeName])
  );

  const countRoutedStores = (agencyId: string) =>
    allShops.filter((shop) => shopBelongsToAgency(shop, agencyId) && isRoutedForAgency(shop, agencyId)).length;

  const countAgencyStores = (agencyId: string) =>
    allShops.filter((shop) => shopBelongsToAgency(shop, agencyId)).length;

  const openManageAgenciesModal = () => {
    setSelectedAgencyIds(assignedAgencyIds);
    setManageAgenciesOpen(true);
  };

  const toggleAgencyId = (agencyId: string) => {
    setSelectedAgencyIds((prev) =>
      prev.includes(agencyId)
        ? prev.filter((id) => id !== agencyId)
        : [...prev, agencyId]
    );
  };

  const handleSaveAgencies = async (e: React.FormEvent) => {
    e.preventDefault();
    setManageAgenciesLoading(true);
    try {
      const added = selectedAgencyIds.filter((id) => !assignedAgencyIds.includes(id));
      const removed = assignedAgencyIds.filter((id) => !selectedAgencyIds.includes(id));
      let skipped = 0;
      if (added.length > 0) {
        const res = await assignDeliveryAgencies.mutateAsync({ employeeId, agencyIds: added });
        skipped = res?.skipped ?? 0;
      }
      if (removed.length > 0) {
        await unassignDeliveryAgencies.mutateAsync({ employeeId, agencyIds: removed });
      }
      setManageAgenciesOpen(false);
      toast.success(`Updated delivery agencies for ${employee.name}`);
      if (skipped > 0) {
        toast.info(`${skipped} store shift${skipped === 1 ? " is" : "s are"} already with another driver and stayed there. Release them from that driver to move them.`);
      }
    } catch {
      // mutation hooks already surface error toasts
    } finally {
      setManageAgenciesLoading(false);
    }
  };

  // Selection state holds "shopId:AM" / "shopId:PM" keys.
  const openManageStoresModal = () => {
    setSelectedDeliveryShopIds(routedDeliveryKeys);
    setManageStoresOpen(true);
  };

  const toggleDeliveryShopSelection = (key: string) => {
    if (heldByOthers.has(key)) return;
    setSelectedDeliveryShopIds((prev) =>
      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]
    );
  };

  const toggleDeliveryAgencySelection = (agencyId: string) => {
    const agencyKeys = allShops
      .filter((shop) => shopBelongsToAgency(shop, agencyId))
      .map((shop) => deliveryKey(shop.id, shiftOfAgency(shop, agencyId)))
      .filter((k) => !heldByOthers.has(k));
    const allSelected = agencyKeys.every((k) => selectedDeliveryShopIds.includes(k));
    setSelectedDeliveryShopIds((prev) =>
      allSelected
        ? prev.filter((k) => !agencyKeys.includes(k))
        : [...new Set([...prev, ...agencyKeys])]
    );
  };

  const parseDeliveryKey = (key: string) => {
    const i = key.lastIndexOf(":");
    return { shopId: key.slice(0, i), shift: key.slice(i + 1) as "AM" | "PM" };
  };

  const handleSaveDeliveryStores = async (e: React.FormEvent) => {
    e.preventDefault();
    setManageStoresLoading(true);
    try {
      const added = selectedDeliveryShopIds.filter((k) => !routedDeliveryKeys.includes(k));
      const removed = routedDeliveryKeys.filter((k) => !selectedDeliveryShopIds.includes(k));
      if (added.length > 0) {
        await assignDeliveryShops.mutateAsync({ employeeId, entries: added.map(parseDeliveryKey) });
      }
      if (removed.length > 0) {
        await unassignDeliveryShops.mutateAsync({ employeeId, entries: removed.map(parseDeliveryKey) });
      }
      setManageStoresOpen(false);
      const count = new Set(selectedDeliveryShopIds.map((k) => parseDeliveryKey(k).shopId)).size;
      toast.success(
        `Routed ${count} store${count === 1 ? "" : "s"} to ${employee.name}`
      );
    } catch {
      // mutation hooks already surface error toasts
    } finally {
      setManageStoresLoading(false);
    }
  };

  // ---- Collector assignment derived values & handlers ----
  const isCollectorCapable =
    employee.employeeRole === "collector" || employee.employeeRole === "both";
  const collectorAssignedAgencyIds = collectorAssignment?.agencyIds ?? [];
  const collectorShopIds = collectorAssignment?.shopIds ?? [];

  const collectorAssignedAgencies = agencies.filter((a) =>
    collectorAssignedAgencyIds.includes(a.id)
  );

  const countCollectorRoutedStores = (agencyId: string) =>
    allShops.filter(
      (shop) =>
        shopBelongsToAgency(shop, agencyId) && collectorShopIds.includes(shop.id)
    ).length;

  // Stores actually handled per role: routed to this employee AND belonging to
  // one of their assigned agencies. Scoping to assigned agencies ignores stale
  // legacy routing (so 0 agencies ⇒ 0 stores), and the Set dedupes a store
  // shared by two of the agencies (counted once).
  const deliveryShopCount = new Set(
    allShops
      .filter(
        (shop) =>
          deliveryShopIds.includes(shop.id) &&
          assignedAgencyIds.some((aid) => shopBelongsToAgency(shop, aid) && isRoutedForAgency(shop, aid))
      )
      .map((shop) => shop.id)
  ).size;
  const collectionShopCount = new Set(
    allShops
      .filter(
        (shop) =>
          collectorShopIds.includes(shop.id) &&
          collectorAssignedAgencyIds.some((aid) => shopBelongsToAgency(shop, aid))
      )
      .map((shop) => shop.id)
  ).size;

  const openManageCollectorAgenciesModal = () => {
    setSelectedCollectorAgencyIds(collectorAssignedAgencyIds);
    setManageCollectorAgenciesOpen(true);
  };

  const toggleCollectorAgencyId = (agencyId: string) => {
    setSelectedCollectorAgencyIds((prev) =>
      prev.includes(agencyId)
        ? prev.filter((id) => id !== agencyId)
        : [...prev, agencyId]
    );
  };

  const handleSaveCollectorAgencies = async (e: React.FormEvent) => {
    e.preventDefault();
    setManageCollectorAgenciesLoading(true);
    try {
      const added = selectedCollectorAgencyIds.filter(
        (id) => !collectorAssignedAgencyIds.includes(id)
      );
      const removed = collectorAssignedAgencyIds.filter(
        (id) => !selectedCollectorAgencyIds.includes(id)
      );
      if (added.length > 0) {
        await assignCollectorAgencies.mutateAsync({ employeeId, agencyIds: added });
      }
      if (removed.length > 0) {
        await unassignCollectorAgencies.mutateAsync({ employeeId, agencyIds: removed });
      }
      setManageCollectorAgenciesOpen(false);
      toast.success(`Updated collector agencies for ${employee.name}`);
    } catch {
      // mutation hooks already surface error toasts
    } finally {
      setManageCollectorAgenciesLoading(false);
    }
  };

  const openManageCollectorStoresModal = () => {
    setSelectedCollectorShopIds(collectorShopIds);
    setManageCollectorStoresOpen(true);
  };

  const toggleCollectorShopSelection = (shopId: string) => {
    setSelectedCollectorShopIds((prev) =>
      prev.includes(shopId)
        ? prev.filter((id) => id !== shopId)
        : [...prev, shopId]
    );
  };

  const toggleCollectorStoreAgencySelection = (agencyId: string) => {
    const agencyShopIds = allShops
      .filter((shop) => shopBelongsToAgency(shop, agencyId))
      .map((shop) => shop.id);
    const allSelected = agencyShopIds.every((id) =>
      selectedCollectorShopIds.includes(id)
    );
    setSelectedCollectorShopIds((prev) =>
      allSelected
        ? prev.filter((id) => !agencyShopIds.includes(id))
        : [...new Set([...prev, ...agencyShopIds])]
    );
  };

  const handleSaveCollectorStores = async (e: React.FormEvent) => {
    e.preventDefault();
    setManageCollectorStoresLoading(true);
    try {
      const added = selectedCollectorShopIds.filter(
        (id) => !collectorShopIds.includes(id)
      );
      const removed = collectorShopIds.filter(
        (id) => !selectedCollectorShopIds.includes(id)
      );
      if (added.length > 0) {
        await assignShopsMutation.mutateAsync({ employeeId, shopIds: added });
      }
      if (removed.length > 0) {
        await unassignShopsMutation.mutateAsync({ employeeId, shopIds: removed });
      }
      await refetchAssigned();
      setManageCollectorStoresOpen(false);
      const count = selectedCollectorShopIds.length;
      toast.success(
        `Assigned ${count} store${count === 1 ? "" : "s"} to ${employee.name}`
      );
    } catch {
      // mutation hooks already surface error toasts
    } finally {
      setManageCollectorStoresLoading(false);
    }
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

      {/* Stat Cards — role-aware */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isCollectorCapable && (
          <StatCard
            title="Collection Shops"
            value={collectionShopCount}
            description="stores assigned for collection"
            icon={Store}
          />
        )}
        {isCollectorCapable && (
          <StatCard
            title="Collections Today"
            value={`₹${(collectionsToday?.clearedToday ?? 0).toLocaleString("en-IN")}`}
            description="payments collected today"
            icon={Shield}
          />
        )}
        {isDeliveryCapable && (
          <StatCard
            title="Delivery Shops"
            value={deliveryShopCount}
            description="stores assigned for delivery"
            icon={Truck}
          />
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isCollectorCapable && (
            <TabsTrigger value="collector">
              Collector Agencies ({collectorAssignedAgencyIds.length})
            </TabsTrigger>
          )}
          {isDeliveryCapable && (
            <TabsTrigger value="delivery">
              Delivery Agencies ({assignedAgencyIds.length})
            </TabsTrigger>
          )}
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

        {/* Collector Agencies Tab */}
        {isCollectorCapable && (
          <TabsContent value="collector">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Header with action buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={openManageCollectorStoresModal}
                  disabled={collectorAssignedAgencyIds.length === 0}
                >
                  <Store className="h-4 w-4" />
                  Manage Stores
                </Button>
                <Button
                  onClick={openManageCollectorAgenciesModal}
                  className="bg-gradient-primary text-white"
                >
                  <Building2 className="h-4 w-4" />
                  Manage Agencies
                </Button>
              </div>

              {/* Assigned Agencies */}
              {collectorAssignedAgencies.length === 0 ? (
                <div className="glass rounded-xl overflow-hidden">
                  <EmptyState
                    icon={Shield}
                    title="No collector agencies"
                    description="Assign one or more agencies so their stores are assigned to this collector."
                    action={{
                      label: "Manage Agencies",
                      onClick: openManageCollectorAgenciesModal,
                    }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {collectorAssignedAgencies.map((agency) => {
                    const routed = countCollectorRoutedStores(agency.id);
                    const total = countAgencyStores(agency.id);
                    return (
                      <div
                        key={agency.id}
                        className="glass rounded-xl p-4 flex items-start gap-3"
                      >
                        <div className="bg-muted rounded-lg p-2.5">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{agency.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {agency.location}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Store className="h-3.5 w-3.5" />
                            {routed} / {total} stores
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </TabsContent>
        )}

        {/* Delivery Agencies Tab */}
        {isDeliveryCapable && (
          <TabsContent value="delivery">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Header with action buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={openManageStoresModal}
                  disabled={assignedAgencyIds.length === 0}
                >
                  <Store className="h-4 w-4" />
                  Manage Stores
                </Button>
                <Button
                  onClick={openManageAgenciesModal}
                  className="bg-gradient-primary text-white"
                >
                  <Building2 className="h-4 w-4" />
                  Manage Agencies
                </Button>
              </div>

              {/* Assigned Agencies */}
              {assignedAgencies.length === 0 ? (
                <div className="glass rounded-xl overflow-hidden">
                  <EmptyState
                    icon={Truck}
                    title="No delivery agencies"
                    description="Assign one or more agencies so their stores are routed to this delivery person."
                    action={{
                      label: "Manage Agencies",
                      onClick: openManageAgenciesModal,
                    }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assignedAgencies.map((agency) => {
                    const routed = countRoutedStores(agency.id);
                    const total = countAgencyStores(agency.id);
                    return (
                      <div
                        key={agency.id}
                        className="glass rounded-xl p-4 flex items-start gap-3"
                      >
                        <div className="bg-muted rounded-lg p-2.5">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{agency.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {agency.location}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Store className="h-3.5 w-3.5" />
                            {routed} / {total} stores
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Employee Modal */}
      {editModalOpen && <FormModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Employee"
        description={`Update details for ${employee.name}`}
      >
        <form onSubmit={handleEditEmployee} className="space-y-4">
          <ImageUploadField
            label="Profile Photo"
            purpose="employee"
            currentUrl={employee.photoUrl}
            onChange={setEditPhotoKey}
            shape="circle"
            disabled={updateEmployee.isPending}
          />

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

      {/* Manage Collector Agencies Modal */}
      {manageCollectorAgenciesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in-0"
            onClick={() => setManageCollectorAgenciesOpen(false)}
          />
          {/* Panel */}
          <div className="relative z-10 bg-background rounded-lg border shadow-lg w-full max-w-2xl max-h-[85vh] mx-4 p-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Manage Collector Agencies</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setManageCollectorAgenciesOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Select the agencies whose stores are assigned to {employee.name}. All
                stores of a selected agency are assigned by default.
              </p>
            </div>
            <hr className="mb-4" />
            <form onSubmit={handleSaveCollectorAgencies} className="space-y-4">
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-2">
                {agenciesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <LoaderIcon className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground">Loading agencies...</p>
                    </div>
                  </div>
                ) : agencies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No agencies available
                  </div>
                ) : (
                  agencies.map((agency) => {
                    const isChecked = selectedCollectorAgencyIds.includes(agency.id);
                    return (
                      <div
                        key={agency.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleCollectorAgencyId(agency.id)}
                      >
                        <div className={`size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center ${isChecked ? "bg-primary border-primary text-primary-foreground" : ""}`}>
                          {isChecked && <Check className="size-3.5" />}
                        </div>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {agency.name} - {agency.location}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Summary */}
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedCollectorAgencyIds.length} agenc{selectedCollectorAgencyIds.length === 1 ? "y" : "ies"} selected
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setManageCollectorAgenciesOpen(false)}
                  disabled={manageCollectorAgenciesLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-primary text-white"
                  disabled={manageCollectorAgenciesLoading}
                >
                  {manageCollectorAgenciesLoading && <span className="mr-2">Loading...</span>}
                  Save Agencies
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Collector Stores Modal */}
      {manageCollectorStoresOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in-0"
            onClick={() => setManageCollectorStoresOpen(false)}
          />
          {/* Panel */}
          <div className="relative z-10 bg-background rounded-lg border shadow-lg w-full max-w-5xl max-h-[85vh] mx-4 p-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Manage Collector Stores</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setManageCollectorStoresOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Refine which stores of the assigned agencies are assigned to {employee.name}
              </p>
            </div>
            <hr className="mb-4" />
            <form onSubmit={handleSaveCollectorStores} className="space-y-4">
              {/* Store List - Grouped by assigned Agency */}
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                {(agenciesLoading || shopsLoading) ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <LoaderIcon className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground">Loading stores...</p>
                    </div>
                  </div>
                ) : collectorAssignedAgencies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No agencies assigned
                  </div>
                ) : (
                  collectorAssignedAgencies.map((agency) => {
                    const agencyShops = allShops.filter(
                      (shop) => shopBelongsToAgency(shop, agency.id)
                    );
                    if (agencyShops.length === 0) return null;

                    const allSelected = agencyShops.every((s) => selectedCollectorShopIds.includes(s.id));
                    const someSelected = agencyShops.some((s) => selectedCollectorShopIds.includes(s.id));

                    return (
                      <div key={agency.id} className="space-y-2">
                        {/* Agency Header */}
                        <div
                          className="flex items-center gap-2 sticky top-0 bg-background py-2 border-b cursor-pointer"
                          onClick={() => toggleCollectorStoreAgencySelection(agency.id)}
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
                            ({agencyShops.filter((s) => selectedCollectorShopIds.includes(s.id)).length}/{agencyShops.length} stores)
                          </span>
                        </div>

                        {/* Agency Stores - 2 Column Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                          {agencyShops.map((shop) => {
                            const isChecked = selectedCollectorShopIds.includes(shop.id);
                            return (
                              <div
                                key={shop.id}
                                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => toggleCollectorShopSelection(shop.id)}
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
                  {selectedCollectorShopIds.length} store{selectedCollectorShopIds.length === 1 ? "" : "s"} selected
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setManageCollectorStoresOpen(false)}
                  disabled={manageCollectorStoresLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-primary text-white"
                  disabled={manageCollectorStoresLoading}
                >
                  {manageCollectorStoresLoading && <span className="mr-2">Loading...</span>}
                  Save Stores
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Delivery Agencies Modal */}
      {manageAgenciesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in-0"
            onClick={() => setManageAgenciesOpen(false)}
          />
          {/* Panel */}
          <div className="relative z-10 bg-background rounded-lg border shadow-lg w-full max-w-2xl max-h-[85vh] mx-4 p-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Manage Delivery Agencies</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setManageAgenciesOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Select the agencies whose stores are routed to {employee.name}. All
                stores of a selected agency are assigned by default.
              </p>
            </div>
            <hr className="mb-4" />
            <form onSubmit={handleSaveAgencies} className="space-y-4">
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-2">
                {agenciesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <LoaderIcon className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground">Loading agencies...</p>
                    </div>
                  </div>
                ) : agencies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No agencies available
                  </div>
                ) : (
                  agencies.map((agency) => {
                    const isChecked = selectedAgencyIds.includes(agency.id);
                    return (
                      <div
                        key={agency.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleAgencyId(agency.id)}
                      >
                        <div className={`size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center ${isChecked ? "bg-primary border-primary text-primary-foreground" : ""}`}>
                          {isChecked && <Check className="size-3.5" />}
                        </div>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {agency.name} - {agency.location}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Summary */}
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedAgencyIds.length} agenc{selectedAgencyIds.length === 1 ? "y" : "ies"} selected
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setManageAgenciesOpen(false)}
                  disabled={manageAgenciesLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-primary text-white"
                  disabled={manageAgenciesLoading}
                >
                  {manageAgenciesLoading && <span className="mr-2">Loading...</span>}
                  Save Agencies
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Delivery Stores Modal */}
      {manageStoresOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in-0"
            onClick={() => setManageStoresOpen(false)}
          />
          {/* Panel */}
          <div className="relative z-10 bg-background rounded-lg border shadow-lg w-full max-w-5xl max-h-[85vh] mx-4 p-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Manage Delivery Stores</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setManageStoresOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Refine which stores of the assigned agencies are routed to {employee.name}
              </p>
            </div>
            <hr className="mb-4" />
            <form onSubmit={handleSaveDeliveryStores} className="space-y-4">
              {/* Store List - Grouped by assigned Agency */}
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                {(agenciesLoading || shopsLoading) ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <LoaderIcon className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground">Loading stores...</p>
                    </div>
                  </div>
                ) : assignedAgencies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No agencies assigned
                  </div>
                ) : (
                  assignedAgencies.map((agency) => {
                    const agencyShops = allShops.filter(
                      (shop) => shopBelongsToAgency(shop, agency.id)
                    );
                    if (agencyShops.length === 0) return null;

                    const freeShops = agencyShops.filter((s) => !heldByOthers.has(deliveryKey(s.id, shiftOfAgency(s, agency.id))));
                    const allSelected = freeShops.length > 0 && freeShops.every((s) => selectedDeliveryShopIds.includes(deliveryKey(s.id, shiftOfAgency(s, agency.id))));
                    const someSelected = freeShops.some((s) => selectedDeliveryShopIds.includes(deliveryKey(s.id, shiftOfAgency(s, agency.id))));
                    const heldCount = agencyShops.length - freeShops.length;

                    return (
                      <div key={agency.id} className="space-y-2">
                        {/* Agency Header */}
                        <div
                          className="flex items-center gap-2 sticky top-0 bg-background py-2 border-b cursor-pointer"
                          onClick={() => toggleDeliveryAgencySelection(agency.id)}
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
                            ({agencyShops.filter((s) => selectedDeliveryShopIds.includes(deliveryKey(s.id, shiftOfAgency(s, agency.id)))).length}/{agencyShops.length} stores · {shiftOfAgency(agencyShops[0], agency.id) === "AM" ? "morning" : "evening"}{heldCount ? ` · ${heldCount} with other drivers` : ""})
                          </span>
                        </div>

                        {/* Agency Stores - 2 Column Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                          {agencyShops.map((shop) => {
                            const shopKey = deliveryKey(shop.id, shiftOfAgency(shop, agency.id));
                            const isChecked = selectedDeliveryShopIds.includes(shopKey);
                            const holder = heldByOthers.get(shopKey);
                            return (
                              <div
                                key={shop.id}
                                title={holder ? `Release this store from ${holder} first` : undefined}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${holder ? "opacity-70 cursor-not-allowed bg-amber-50/40 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900" : "hover:bg-muted/50 cursor-pointer"}`}
                                onClick={() => toggleDeliveryShopSelection(shopKey)}
                              >
                                <div className={`mt-0.5 size-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center ${isChecked ? "bg-primary border-primary text-primary-foreground" : holder ? "bg-muted border-muted-foreground/30" : ""}`}>
                                  {isChecked && <Check className="size-3.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Store className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-medium">{shop.shopName}</span>
                                    {holder ? (
                                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                        With {holder}
                                      </span>
                                    ) : null}
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
                  {selectedDeliveryShopIds.length} store{selectedDeliveryShopIds.length === 1 ? "" : "s"} selected
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setManageStoresOpen(false)}
                  disabled={manageStoresLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-primary text-white"
                  disabled={manageStoresLoading}
                >
                  {manageStoresLoading && <span className="mr-2">Loading...</span>}
                  Save Stores
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
