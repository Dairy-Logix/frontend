"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, UserCheck, UserX, Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUsers, useTenants } from "@/lib/hooks";
import type { User, UserRole } from "@/lib/types";
import { useTranslations } from "@/components/providers/intl-provider";

const userStatusColorMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "default" },
  suspended: { label: "Suspended", variant: "error" },
};

const roleColorMap: Record<UserRole, { color: string; bg: string }> = {
  super_admin: { color: "text-purple-700", bg: "bg-purple-100 dark:bg-purple-900/30" },
  tenant_admin: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30" },
  employee: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30" },
  shopkeeper: { color: "text-orange-700", bg: "bg-orange-100 dark:bg-orange-900/30" },
};

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  tenant_admin: "Tenant Admin",
  employee: "Employee",
  shopkeeper: "Shopkeeper",
};

type UserRow = User & Record<string, unknown>;

const columns: ColumnDef<UserRow>[] = [
  {
    key: "firstName",
    header: "Name",
    sortable: true,
    cell: (row) => (
      <div>
        <p className="font-medium">{`${row.firstName} ${row.lastName}`}</p>
        <p className="text-xs text-muted-foreground">{row.email}</p>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
    sortable: true,
    cell: (row) => {
      const roleConfig = roleColorMap[row.role as UserRole];
      return (
        <Badge className={`${roleConfig.bg} ${roleConfig.color} border-0`}>
          {roleLabels[row.role as UserRole]}
        </Badge>
      );
    },
  },
  {
    key: "tenantId",
    header: "Tenant",
    sortable: false,
    cell: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.tenantId ? row.tenantSlug || row.tenantId : "-"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    cell: (row) => (
      <StatusBadge status={row.status} colorMap={userStatusColorMap} />
    ),
  },
  {
    key: "lastLoginAt",
    header: "Last Login",
    sortable: true,
    cell: (row) => {
      if (!row.lastLoginAt) return <span className="text-muted-foreground text-sm">Never</span>;
      return (
        <span className="text-muted-foreground text-sm">
          {new Date(row.lastLoginAt).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      );
    },
  },
  {
    key: "createdAt",
    header: "Created",
    sortable: true,
    cell: (row) => (
      <span className="text-muted-foreground text-sm">
        {new Date(row.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </span>
    ),
  },
];

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

export default function UsersPage() {
  const tPage = useTranslations("pages.adminUsers");
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>("tenant_admin");
  const [tenantFilter, setTenantFilter] = useState<string | undefined>(undefined);
  const [showDemo, setShowDemo] = useState(false);

  // Tenants for the filter dropdown (cross-tenant super-admin view).
  const { data: tenantsData } = useTenants({ page: 1, pageSize: 100 });
  const tenants = tenantsData?.data || [];

  // Fetch users with default filter for tenant admins. Demo tenant users are
  // hidden by default; the toggle reveals them.
  const { data, isLoading, error } = useUsers({
    page,
    limit,
    search,
    role: roleFilter,
    tenantId: tenantFilter,
    includeDemo: showDemo,
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  // Calculate stats — activeUsers/inactiveUsers are page-level counts
  const totalUsers = pagination?.total || 0;
  const activeUsersOnPage = users.filter((u) => u.status === "active").length;
  const inactiveUsersOnPage = users.filter((u) => u.status !== "active").length;

  const handleRowClick = (user: User) => {
    router.push(`/admin/users/${user.id}`);
  };

  const handleShowAllUsers = () => {
    setRoleFilter(undefined);
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="User Management"
        description="Manage users across all tenants"
        action={
          <Button onClick={() => router.push("/admin/users/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />

      <motion.div
        className="grid gap-4 md:grid-cols-3"
        variants={itemVariants}
      >
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          description={roleFilter ? `filtered by ${roleFilter.replace('_', ' ')}` : "all roles"}
        />
        <StatCard
          title="Active (this page)"
          value={activeUsersOnPage}
          icon={UserCheck}
          description={`of ${users.length} shown`}
        />
        <StatCard
          title="Inactive (this page)"
          value={inactiveUsersOnPage}
          icon={UserX}
          description={`of ${users.length} shown`}
        />
      </motion.div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load users"}
          </AlertDescription>
        </Alert>
      )}

      <motion.div className="space-y-4" variants={itemVariants}>
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          <div className="flex items-center gap-4">
            {/* Filter users by tenant (All tenants by default) */}
            <Select
              value={tenantFilter ?? "all"}
              onValueChange={(value) => {
                setTenantFilter(value === "all" ? undefined : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tenants</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.companyName || tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch id="show-demo-users" checked={showDemo} onCheckedChange={setShowDemo} />
              <Label htmlFor="show-demo-users" className="text-sm text-muted-foreground cursor-pointer">
                Show demo users
              </Label>
            </div>
            {roleFilter && (
              <Button variant="outline" onClick={handleShowAllUsers}>
                Show All Users
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            data={users as UserRow[]}
            columns={columns}
            onRowClick={handleRowClick}
            pagination={
              pagination
                ? {
                    page: pagination.page,
                    pageSize: pagination.limit,
                    total: pagination.total,
                    onPageChange: setPage,
                    onPageSizeChange: (size) => {
                      setLimit(size);
                      setPage(1);
                    },
                  }
                : undefined
            }
          />
        )}
      </motion.div>
    </motion.div>
  );
}
