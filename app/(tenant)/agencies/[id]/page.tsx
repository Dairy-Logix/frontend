"use client";

import { useState, useMemo, useEffect } from "react";
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
  Truck,
  Pencil,
  ArrowLeft,
  Calendar,
  Loader2 as LoaderIcon,
  AlertCircle,
  Check,
  X,
  Plus,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { useAgency, useUpdateAgency } from "@/lib/hooks/use-agencies";
import { useShopkeepersByAgency } from "@/lib/hooks/use-shopkeepers";
import {
  useEmployees,
  useAssignDeliveryAgencies,
  useUnassignDeliveryAgencies,
  useAssignCollectorAgencies,
  useUnassignCollectorAgencies,
} from "@/lib/hooks/use-employees";
import { OrderCycleFields } from "@/components/shared/order-cycle-fields";
import { validateOrderCycle } from "@/lib/order-cycle";
import { AGENCY_TYPE_LABELS } from "@/lib/constants";
import type { Employee, Shop, OrderCycle } from "@/lib/types";

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

const employeeRoleColorMap: Record<
  string,
  { label: string; variant: "info" | "warning" | "success" | "default" }
> = {
  collector: { label: "Collector", variant: "info" },
  delivery: { label: "Delivery", variant: "warning" },
  both: { label: "Collector + Delivery", variant: "success" },
};

export default function AgencyDetailsPage() {
  const params = useParams();
  const agencyId = params.id as string;

  const { data: agency, isLoading, error, refetch } = useAgency(agencyId);
  const { data: shopkeepers } = useShopkeepersByAgency(agencyId);
  const updateAgency = useUpdateAgency();

  // Delivery staff currently assigned to THIS agency.
  const { data: staffData, refetch: refetchStaff } = useEmployees({
    agencyId,
    pageSize: 100,
  });
  const deliveryStaff = staffData?.data ?? [];

  // Candidate pool for the assign modal: all delivery-capable, active employees.
  const { data: allDeliveryData } = useEmployees({ pageSize: 200 });
  const deliveryCandidates = (allDeliveryData?.data ?? []).filter(
    (e: Employee) => e.employeeRole !== "collector" && e.isActive
  );

  const assignStaff = useAssignDeliveryAgencies();
  const unassignStaff = useUnassignDeliveryAgencies();

  // Collectors currently assigned to THIS agency.
  const { data: collectorData, refetch: refetchCollectors } = useEmployees({
    collectorAgencyId: agencyId,
    pageSize: 100,
  });
  const collectorStaff = collectorData?.data ?? [];

  // Candidate pool for collectors: all collector-capable, active employees.
  const collectorCandidates = (allDeliveryData?.data ?? []).filter(
    (e: Employee) => e.employeeRole !== "delivery" && e.isActive
  );

  const assignCollectorAgencies = useAssignCollectorAgencies();
  const unassignCollectorAgencies = useUnassignCollectorAgencies();

  const agencyShopkeepers = shopkeepers || [];

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Assign-delivery-staff modal state.
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [savingStaff, setSavingStaff] = useState(false);

  // Assign-collectors modal state.
  const [assignCollectorsModalOpen, setAssignCollectorsModalOpen] =
    useState(false);
  const [selectedCollectorIds, setSelectedCollectorIds] = useState<string[]>(
    []
  );
  const [savingCollectors, setSavingCollectors] = useState(false);

  // Edit-modal multi-select picker state.
  const [editDeliveryIds, setEditDeliveryIds] = useState<string[]>([]);
  const [editCollectorIds, setEditCollectorIds] = useState<string[]>([]);

  // Seed the modal selection from the currently-assigned staff whenever it opens.
  useEffect(() => {
    if (assignModalOpen) {
      setSelectedStaffIds(deliveryStaff.map((e: Employee) => e.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignModalOpen]);

  useEffect(() => {
    if (assignCollectorsModalOpen) {
      setSelectedCollectorIds(collectorStaff.map((e: Employee) => e.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignCollectorsModalOpen]);

  // Seed the edit-modal pickers from the currently-assigned staff when it opens.
  useEffect(() => {
    if (editModalOpen) {
      setEditDeliveryIds(deliveryStaff.map((e: Employee) => e.id));
      setEditCollectorIds(collectorStaff.map((e: Employee) => e.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editModalOpen]);

  const toggleStaffSelection = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleCollectorSelection = (id: string) => {
    setSelectedCollectorIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleEditDeliveryId = (id: string) => {
    setEditDeliveryIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleEditCollectorId = (id: string) => {
    setEditCollectorIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleRemoveStaff = async (emp: Employee) => {
    try {
      await unassignStaff.mutateAsync({
        employeeId: emp.id,
        agencyIds: [agencyId],
      });
      await refetchStaff();
      toast.success(`Removed ${emp.name} from ${agency?.name ?? "this agency"}`);
    } catch {
      // mutation hook already toasts the error
    }
  };

  const handleSaveStaff = async () => {
    if (!agency) return;
    const assignedIds = deliveryStaff.map((e: Employee) => e.id);
    const added = selectedStaffIds.filter((id) => !assignedIds.includes(id));
    const removed = assignedIds.filter(
      (id: string) => !selectedStaffIds.includes(id)
    );
    setSavingStaff(true);
    try {
      await Promise.all([
        ...added.map((id) =>
          assignStaff.mutateAsync({ employeeId: id, agencyIds: [agencyId] })
        ),
        ...removed.map((id: string) =>
          unassignStaff.mutateAsync({ employeeId: id, agencyIds: [agencyId] })
        ),
      ]);
      await refetchStaff();
      setAssignModalOpen(false);
      toast.success(`Updated delivery staff for ${agency.name}`);
    } catch {
      toast.error("Failed to update delivery staff. Please try again.");
    } finally {
      setSavingStaff(false);
    }
  };

  const handleRemoveCollector = async (emp: Employee) => {
    try {
      await unassignCollectorAgencies.mutateAsync({
        employeeId: emp.id,
        agencyIds: [agencyId],
      });
      await refetchCollectors();
      toast.success(`Removed ${emp.name} from ${agency?.name ?? "this agency"}`);
    } catch {
      // mutation hook already toasts the error
    }
  };

  const handleSaveCollectors = async () => {
    if (!agency) return;
    const assignedIds = collectorStaff.map((e: Employee) => e.id);
    const added = selectedCollectorIds.filter(
      (id) => !assignedIds.includes(id)
    );
    const removed = assignedIds.filter(
      (id: string) => !selectedCollectorIds.includes(id)
    );
    setSavingCollectors(true);
    try {
      await Promise.all([
        ...added.map((id) =>
          assignCollectorAgencies.mutateAsync({
            employeeId: id,
            agencyIds: [agencyId],
          })
        ),
        ...removed.map((id: string) =>
          unassignCollectorAgencies.mutateAsync({
            employeeId: id,
            agencyIds: [agencyId],
          })
        ),
      ]);
      await refetchCollectors();
      setAssignCollectorsModalOpen(false);
      toast.success(`Updated collectors for ${agency.name}`);
    } catch {
      toast.error("Failed to update collectors. Please try again.");
    } finally {
      setSavingCollectors(false);
    }
  };

  // Order-cycle tab: a draft seeded from the agency, saved via the same update hook.
  const EMPTY_CYCLE: OrderCycle = {
    dayStartTime: "",
    orderOpenTime: "",
    orderCutoff: "",
    autoToggle: false,
  };
  const [cycleDraft, setCycleDraft] = useState<OrderCycle>(EMPTY_CYCLE);
  useEffect(() => {
    if (agency) setCycleDraft(agency.orderCycle ?? EMPTY_CYCLE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agency?.id]);

  const handleSaveCycle = () => {
    const cycleError = validateOrderCycle(cycleDraft);
    if (cycleError) {
      toast.error(cycleError);
      return;
    }
    updateAgency.mutate(
      { id: agencyId, input: { orderCycle: cycleDraft } },
      { onSuccess: () => toast.success("Order cycle updated") },
    );
  };
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
          vehicleNumber: (formData.get("vehicleNumber") as string) || undefined,
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
        onSuccess: async () => {
          const assignedDeliveryIds = deliveryStaff.map((emp: Employee) => emp.id);
          const addedDelivery = editDeliveryIds.filter(
            (id) => !assignedDeliveryIds.includes(id)
          );
          const removedDelivery = assignedDeliveryIds.filter(
            (id: string) => !editDeliveryIds.includes(id)
          );

          const assignedCollectorIds = collectorStaff.map(
            (emp: Employee) => emp.id
          );
          const addedCollector = editCollectorIds.filter(
            (id) => !assignedCollectorIds.includes(id)
          );
          const removedCollector = assignedCollectorIds.filter(
            (id: string) => !editCollectorIds.includes(id)
          );

          try {
            await Promise.all([
              ...addedDelivery.map((id) =>
                assignStaff.mutateAsync({ employeeId: id, agencyIds: [agencyId] })
              ),
              ...removedDelivery.map((id: string) =>
                unassignStaff.mutateAsync({ employeeId: id, agencyIds: [agencyId] })
              ),
              ...addedCollector.map((id) =>
                assignCollectorAgencies.mutateAsync({
                  employeeId: id,
                  agencyIds: [agencyId],
                })
              ),
              ...removedCollector.map((id: string) =>
                unassignCollectorAgencies.mutateAsync({
                  employeeId: id,
                  agencyIds: [agencyId],
                })
              ),
            ]);
            await Promise.all([refetchStaff(), refetchCollectors()]);
          } catch {
            // mutation hooks already toast their own errors
          } finally {
            setEditModalOpen(false);
          }
        },
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
          <TabsTrigger value="order-cycle">Order Cycle</TabsTrigger>
          <TabsTrigger value="staff">
            Staff ({deliveryStaff.length + collectorStaff.length})
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
                {agency.vehicleNumber && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Vehicle Number</p>
                      <p className="text-sm font-medium">{agency.vehicleNumber}</p>
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

        {/* Order Cycle Tab */}
        <TabsContent value="order-cycle">
          <div className="max-w-2xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Order cycle / business day</h3>
              <p className="text-muted-foreground text-sm">
                Controls when this agency&apos;s business day rolls over and,
                optionally, when ordering automatically opens and closes. Leave
                the rollover at 00:00 for a standard midnight-to-midnight day.
              </p>
            </div>
            <OrderCycleFields value={cycleDraft} onChange={setCycleDraft} />
            <div className="flex justify-end">
              <Button
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 hover:opacity-90"
                onClick={handleSaveCycle}
                disabled={updateAgency.isPending}
              >
                {updateAgency.isPending ? "Saving..." : "Save Order Cycle"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Staff Tab — delivery persons + collectors managed together */}
        <TabsContent value="staff">
          <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Delivery Staff</h3>
                <p className="text-muted-foreground text-sm">
                  Delivery persons assigned here cover all of this agency&apos;s
                  stores. Assigning auto-routes this agency&apos;s stores to them.
                </p>
              </div>
              <Button
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 hover:opacity-90"
                onClick={() => setAssignModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Assign Delivery Persons
              </Button>
            </div>

            {deliveryStaff.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No delivery persons assigned to this agency.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deliveryStaff.map((emp: Employee, index: number) => (
                  <motion.div
                    key={emp.id ?? `staff-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="glass-subtle rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{emp.name}</h4>
                          <StatusBadge
                            status={emp.employeeRole}
                            colorMap={employeeRoleColorMap}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveStaff(emp)}
                        disabled={unassignStaff.isPending}
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {emp.phone}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        Stores routed
                      </span>
                      <span className="text-sm font-semibold">
                        {emp.assignedDeliveryShopCount} stores
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Collectors</h3>
                <p className="text-muted-foreground text-sm">
                  Collectors assigned here cover all of this agency&apos;s
                  stores. Assigning auto-routes this agency&apos;s stores to them.
                </p>
              </div>
              <Button
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 hover:opacity-90"
                onClick={() => setAssignCollectorsModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Assign Collectors
              </Button>
            </div>

            {collectorStaff.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No collectors assigned to this agency.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collectorStaff.map((emp: Employee, index: number) => (
                  <motion.div
                    key={emp.id ?? `collector-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="glass-subtle rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{emp.name}</h4>
                          <StatusBadge
                            status={emp.employeeRole}
                            colorMap={employeeRoleColorMap}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveCollector(emp)}
                        disabled={unassignCollectorAgencies.isPending}
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {emp.phone}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        Stores routed
                      </span>
                      <span className="text-sm font-semibold">
                        {emp.assignedShopCount} stores
                      </span>
                    </div>
                  </motion.div>
                ))}
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
          {/* Row 1: Agency Name | Agency Type */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Row 2: Location | Pincode */}
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="edit-pincode">Pincode</Label>
              <Input
                id="edit-pincode"
                name="pincode"
                placeholder="e.g. 380001"
                defaultValue={agency.address?.pincode ?? ""}
              />
            </div>
          </div>

          {/* Row 3: Address Line 1 */}
          <div className="space-y-2">
            <Label htmlFor="edit-line1">Address Line 1</Label>
            <Input
              id="edit-line1"
              name="line1"
              placeholder="Street address"
              defaultValue={agency.address?.line1 ?? ""}
            />
          </div>

          {/* Row 4: Address Line 2 */}
          <div className="space-y-2">
            <Label htmlFor="edit-line2">Address Line 2</Label>
            <Input
              id="edit-line2"
              name="line2"
              placeholder="Landmark, area (optional)"
              defaultValue={agency.address?.line2 ?? ""}
            />
          </div>

          {/* Row 5: City | State */}
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

          {/* Row 6: Contact Person | Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-contactPerson">Contact Person</Label>
              <Input
                id="edit-contactPerson"
                name="contactPerson"
                placeholder="Full name"
                defaultValue={agency.contactPerson ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                name="phone"
                placeholder="+91 XXXXX XXXXX"
                defaultValue={agency.phone ?? ""}
              />
            </div>
          </div>

          {/* Row 7: Email | Vehicle Number */}
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="edit-vehicleNumber">Vehicle Number</Label>
              <Input
                id="edit-vehicleNumber"
                name="vehicleNumber"
                placeholder="e.g. GJ 01 AB 1234"
                defaultValue={agency.vehicleNumber ?? ""}
              />
            </div>
          </div>

          {/* Row 8: Delivery Employees | Collectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delivery Employees</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start font-normal"
                  >
                    {editDeliveryIds.length > 0
                      ? `${editDeliveryIds.length} selected`
                      : "Select delivery employees"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-64 overflow-y-auto">
                  <DropdownMenuLabel>Delivery employees</DropdownMenuLabel>
                  {deliveryCandidates.map((emp: Employee) => (
                    <DropdownMenuCheckboxItem
                      key={emp.id}
                      checked={editDeliveryIds.includes(emp.id)}
                      onCheckedChange={() => toggleEditDeliveryId(emp.id)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {`${emp.name} (${emp.phone})`}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2">
              <Label>Collectors</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start font-normal"
                  >
                    {editCollectorIds.length > 0
                      ? `${editCollectorIds.length} selected`
                      : "Select collectors"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-64 overflow-y-auto">
                  <DropdownMenuLabel>Collectors</DropdownMenuLabel>
                  {collectorCandidates.map((emp: Employee) => (
                    <DropdownMenuCheckboxItem
                      key={emp.id}
                      checked={editCollectorIds.includes(emp.id)}
                      onCheckedChange={() => toggleEditCollectorId(emp.id)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {`${emp.name} (${emp.phone})`}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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

      {/* Assign Delivery Persons Modal */}
      <FormModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        title="Assign Delivery Persons"
        description={`Select delivery persons to cover ${agency.name}'s stores`}
      >
        <div className="space-y-4">
          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
            {deliveryCandidates.length === 0 && (
              <div className="text-center py-8">
                <Truck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No delivery-capable employees available.
                </p>
              </div>
            )}
            {deliveryCandidates.map((emp: Employee) => {
              const selected = selectedStaffIds.includes(emp.id);
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggleStaffSelection(emp.id)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border/60 p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div
                    className={`h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 ${
                      selected
                        ? "bg-gradient-to-r from-red-500 to-orange-500 border-0 text-white"
                        : "border-border"
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{emp.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {emp.phone}
                    </p>
                  </div>
                  <StatusBadge
                    status={emp.employeeRole}
                    colorMap={employeeRoleColorMap}
                  />
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignModalOpen(false)}
              disabled={savingStaff}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 hover:opacity-90"
              onClick={handleSaveStaff}
              disabled={savingStaff}
            >
              {savingStaff ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </FormModal>

      {/* Assign Collectors Modal */}
      <FormModal
        open={assignCollectorsModalOpen}
        onOpenChange={setAssignCollectorsModalOpen}
        title="Assign Collectors"
        description={`Select collectors to cover ${agency.name}'s stores`}
      >
        <div className="space-y-4">
          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
            {collectorCandidates.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No collector-capable employees available.
                </p>
              </div>
            )}
            {collectorCandidates.map((emp: Employee) => {
              const selected = selectedCollectorIds.includes(emp.id);
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggleCollectorSelection(emp.id)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border/60 p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div
                    className={`h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 ${
                      selected
                        ? "bg-gradient-to-r from-red-500 to-orange-500 border-0 text-white"
                        : "border-border"
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{emp.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {emp.phone}
                    </p>
                  </div>
                  <StatusBadge
                    status={emp.employeeRole}
                    colorMap={employeeRoleColorMap}
                  />
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignCollectorsModalOpen(false)}
              disabled={savingCollectors}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 hover:opacity-90"
              onClick={handleSaveCollectors}
              disabled={savingCollectors}
            >
              {savingCollectors ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
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
