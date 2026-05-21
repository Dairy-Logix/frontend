"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Users, ShieldAlert, Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTenants, useSuperAdminDashboard } from "@/lib/hooks";
import type { Tenant } from "@/lib/types";
import { useTranslations } from "@/components/providers/intl-provider";

const tenantStatusColorMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "default" },
  suspended: { label: "Suspended", variant: "error" },
};

const planLabels: Record<string, string> = {
  free: "Free",
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
  enterprise: "Enterprise",
};

type TenantRow = Tenant & Record<string, unknown>;

const columns: ColumnDef<TenantRow>[] = [
  {
    key: "companyName",
    header: "Name",
    sortable: true,
    cell: (row) => (
      <div>
        <p className="font-medium">{row.companyName || row.name}</p>
        <p className="text-xs text-muted-foreground">{row.slug}</p>
      </div>
    ),
  },
  {
    key: "ownerName",
    header: "Contact Person",
    sortable: true,
    cell: (row) => row.ownerName || row.contactPerson || "-",
  },
  {
    key: "subscriptionPlan",
    header: "Plan",
    sortable: true,
    cell: (row) => (
      <Badge variant="secondary">
        {planLabels[row.subscriptionPlan || row.plan] || row.subscriptionPlan || row.plan || "Free"}
      </Badge>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    cell: (row) => (
      <StatusBadge status={row.status} colorMap={tenantStatusColorMap} />
    ),
  },
  {
    key: "ownerEmail",
    header: "Email",
    sortable: true,
    cell: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.ownerEmail || row.email || "-"}
      </span>
    ),
  },
  {
    key: "createdAt",
    header: "Created",
    sortable: true,
    cell: (row) => (
      <span className="text-muted-foreground">
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

export default function TenantsPage() {
  const tPage = useTranslations("pages.adminTenants");
  const router = useRouter();

  // Fetch real data from backend
  const { data: dashboardData, isLoading: isDashboardLoading } = useSuperAdminDashboard();
  const { data: tenantsData, isLoading: isTenantsLoading, error, refetch } = useTenants({
    page: 1,
    pageSize: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const totalTenants = dashboardData?.totalTenants || 0;
  const activeTenants = dashboardData?.activeTenants || 0;
  const inactiveOrSuspended = totalTenants - activeTenants;

  // Loading state
  if (isTenantsLoading || isDashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading tenants...</p>
        </div>
      </div>
    );
  }

  // Error state
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
            <span>Failed to load tenants. {(error as Error).message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const tenants = tenantsData?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Management"
        description="View, manage, and configure all tenant organizations on the platform."
        action={
          <Button asChild>
            <Link href="/admin/tenants/create">
              <Plus className="h-4 w-4" />
              Add Tenant
            </Link>
          </Button>
        }
      />

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            title="Total Tenants"
            value={totalTenants}
            icon={Building2}
            description="Registered organizations"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Active Tenants"
            value={activeTenants}
            icon={Users}
            description="Currently active"
            trend={
              dashboardData?.stats?.tenants?.growth
                ? { value: dashboardData.stats.tenants.growth, isPositive: dashboardData.stats.tenants.growth > 0 }
                : undefined
            }
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Inactive / Suspended"
            value={inactiveOrSuspended}
            icon={ShieldAlert}
            description="Require attention"
          />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {tenants.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tenants yet</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first tenant organization.
            </p>
            <Button asChild>
              <Link href="/admin/tenants/create">
                <Plus className="h-4 w-4" />
                Create First Tenant
              </Link>
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={tenants as TenantRow[]}
            searchKey="companyName"
            searchPlaceholder="Search tenants by name..."
            onRowClick={(row) => router.push(`/admin/tenants/${row._id || row.id}`)}
          />
        )}
      </motion.div>
    </div>
  );
}
