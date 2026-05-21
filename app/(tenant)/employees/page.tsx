"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  Phone,
  Mail,
  Store,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Truck,
  Loader2 as LoaderIcon,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Employee, EmployeeRole } from "@/lib/types";
import { EMPLOYEE_ROLE_LABELS } from "@/lib/constants";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "@/lib/hooks";
import { useTranslations } from "@/components/providers/intl-provider";

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

export default function EmployeesPage() {
  const tPage = useTranslations("pages.employees");
  const router = useRouter();

  // Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Data fetching with real API
  const {
    data: employeesData,
    isLoading,
    error,
    refetch,
  } = useEmployees({
    page,
    pageSize,
    search: search || undefined,
    employeeRole: roleFilter !== "all" ? (roleFilter as EmployeeRole) : undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  });

  // Mutations
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const employees = employeesData?.data || [];

  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  // Credentials dialog state (shown after create or password reset)
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [credentialsData, setCredentialsData] = useState<{ name: string; login: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state (shared for add/edit)
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<EmployeeRole>("collector");
  const [formPassword, setFormPassword] = useState("");

  // Note: Filtering is now handled server-side via the API
  const filtered = employees;

  // --- Form Handlers ---

  function resetForm() {
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormRole("collector");
    setFormPassword("");
  }

  function openEditModal(employee: Employee) {
    setEditingEmployee(employee);
    setFormName(employee.name);
    setFormPhone(employee.phone);
    setFormEmail(employee.email || "");
    setFormRole(employee.employeeRole);
    setFormPassword("");
    setEditModalOpen(true);
  }

  function confirmDelete(employee: Employee) {
    setDeletingEmployee(employee);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (!deletingEmployee) return;
    deleteEmployee.mutate(deletingEmployee.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeletingEmployee(null);
      },
    });
  }

  function handleEditEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEmployee) return;

    if (!formName.trim()) {
      toast.error("Employee name is required");
      return;
    }
    if (!formPhone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setIsSubmitting(true);

    const input: Record<string, unknown> = {
      name: formName,
      phone: formPhone,
      email: formEmail || undefined,
      employeeRole: formRole,
    };
    if (formPassword.trim()) {
      input.password = formPassword;
    }

    const savedPassword = formPassword;
    const savedName = formName;
    const savedLogin = formEmail || formPhone;

    updateEmployee.mutate(
      { id: editingEmployee.id, input },
      {
        onSuccess: () => {
          setEditModalOpen(false);
          setIsSubmitting(false);
          setEditingEmployee(null);
          resetForm();
          // Show credentials dialog if password was changed
          if (savedPassword.trim()) {
            setCredentialsData({ name: savedName, login: savedLogin, password: savedPassword });
            setShowPassword(false);
            setCopied(false);
            setCredentialsOpen(true);
          }
        },
        onError: () => {
          setIsSubmitting(false);
        },
      }
    );
  }

  function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();

    if (!formName.trim()) {
      toast.error("Employee name is required");
      return;
    }
    if (!formPhone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!formRole) {
      toast.error("Employee role is required");
      return;
    }
    if (!formPassword.trim()) {
      toast.error("Password is required");
      return;
    }

    setIsSubmitting(true);

    const input = {
      name: formName,
      phone: formPhone,
      email: formEmail || undefined,
      employeeRole: formRole,
      password: formPassword,
    };

    const savedPassword = formPassword;
    const savedName = formName;
    const savedLogin = formEmail || formPhone;

    createEmployee.mutate(input, {
      onSuccess: () => {
        setAddModalOpen(false);
        setIsSubmitting(false);
        resetForm();
        // Show credentials dialog
        setCredentialsData({ name: savedName, login: savedLogin, password: savedPassword });
        setShowPassword(false);
        setCopied(false);
        setCredentialsOpen(true);
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });
  }

  // --- Table Columns ---

  const tableColumns: ColumnDef<Employee>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (row) => (
        <div className="min-w-[140px]">
          <div className="font-semibold text-sm">{row.name}</div>
          {row.email && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Mail className="h-3 w-3" />
              {row.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "employeeRole",
      header: "Role",
      sortable: true,
      cell: (row) => (
        <StatusBadge
          status={row.employeeRole}
          colorMap={roleColorMap}
        />
      ),
    },
    {
      key: "assignedShopCount",
      header: "Assigned Shops",
      sortable: true,
      className: "text-center",
      cell: (row) => (
        <span className="flex items-center justify-center gap-1 text-sm">
          <Store className="h-3.5 w-3.5 text-muted-foreground" />
          {row.assignedShopCount}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      sortable: false,
      cell: (row) => (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          {row.phone}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <StatusBadge
          status={row.isActive ? "active" : "inactive"}
          colorMap={statusColorMap}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              confirmDelete(row);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  // Stats
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.isActive).length;
    const collectors = employees.filter(
      (e) => e.employeeRole === "collector" || e.employeeRole === "both"
    ).length;
    const deliveryAgents = employees.filter(
      (e) => e.employeeRole === "delivery" || e.employeeRole === "both"
    ).length;

    return { total, active, collectors, deliveryAgents };
  }, [employees]);

  // --- Loading State ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading employees...</p>
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
            <span>Failed to load employees. {error.message}</span>
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
        title="Employees"
        description="Manage your field employees"
        action={
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-gradient-primary text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={stats.total}
          description="all employees"
          icon={Users}
        />
        <StatCard
          title="Active Employees"
          value={stats.active}
          description="currently active"
          icon={UserCheck}
        />
        <StatCard
          title="Collectors"
          value={stats.collectors}
          description="collection agents"
          icon={Shield}
        />
        <StatCard
          title="Delivery Agents"
          value={stats.deliveryAgents}
          description="delivery personnel"
          icon={Truck}
        />
      </div>

      {/* Filter Row */}
      <div className="glass-subtle rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="collector">Collector</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="both">Both</SelectItem>
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

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employees..."
            className="flex-1"
          />
        </div>
      </div>

      {/* Employee Table */}
      <DataTable
        columns={tableColumns as unknown as ColumnDef<Record<string, unknown>>[]}
        data={filtered as unknown as Record<string, unknown>[]}
        onRowClick={(row) => router.push(`/employees/${(row as any).id}`)}
        pagination={
          employeesData
            ? {
                page: employeesData.page ?? page,
                pageSize: employeesData.pageSize ?? pageSize,
                total: employeesData.total ?? 0,
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
              }
            : undefined
        }
      />

      {/* Add Employee Modal */}
      <FormModal
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) resetForm();
        }}
        title="Add Employee"
        description="Create a new field employee account"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emp-name">Full Name *</Label>
            <Input
              id="emp-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter employee name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="emp-phone">Phone *</Label>
              <Input
                id="emp-phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-email">Email</Label>
              <Input
                id="emp-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-role">Role *</Label>
            <Select value={formRole} onValueChange={(val) => setFormRole(val as EmployeeRole)}>
              <SelectTrigger id="emp-role" className="w-full">
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
            <Label htmlFor="emp-password">Password *</Label>
            <Input
              id="emp-password"
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Set a login password"
            />
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
              className="bg-gradient-primary text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Employee"}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Edit Employee Modal */}
      <FormModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) {
            setEditingEmployee(null);
            resetForm();
          }
        }}
        title="Edit Employee"
        description={`Update details for ${editingEmployee?.name ?? "employee"}`}
      >
        <form onSubmit={handleEditEmployee} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-emp-name">Full Name *</Label>
            <Input
              id="edit-emp-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter employee name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-emp-phone">Phone *</Label>
              <Input
                id="edit-emp-phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-emp-email">Email</Label>
              <Input
                id="edit-emp-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-emp-role">Role *</Label>
            <Select value={formRole} onValueChange={(val) => setFormRole(val as EmployeeRole)}>
              <SelectTrigger id="edit-emp-role" className="w-full">
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
            <Label htmlFor="edit-emp-password">New Password</Label>
            <Input
              id="edit-emp-password"
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditModalOpen(false);
                setEditingEmployee(null);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Employee"
        description={`Are you sure you want to delete "${deletingEmployee?.name ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* Credentials Dialog — shown once after create or password reset */}
      <FormModal
        open={credentialsOpen}
        onOpenChange={setCredentialsOpen}
        title="Login Credentials"
        description={`Save these credentials for ${credentialsData?.name ?? "the employee"}. The password cannot be viewed again after closing this dialog.`}
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
                  <div className="flex-1 relative">
                    <p className="text-sm font-medium font-mono pr-10 break-all">
                      {showPassword ? credentialsData.password : "••••••••••"}
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
                    `Login: ${credentialsData.login}\nPassword: ${credentialsData.password}`
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
        )}
      </FormModal>
    </div>
  );
}
