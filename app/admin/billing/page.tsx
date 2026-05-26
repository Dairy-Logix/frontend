"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IndianRupee, CheckCircle2, Clock, AlertTriangle, XCircle, Loader2, TrendingUp, TrendingDown, Coins, Percent } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { useTenants } from "@/lib/hooks";
import { useAdminPlans } from "@/lib/hooks/use-plans";
import { useSignupStats } from "@/lib/hooks/use-admin-signups";
import type { Tenant } from "@/lib/types";

const subscriptionStatusColorMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  trialing: { label: "Trialing", variant: "info" },
  active: { label: "Active", variant: "success" },
  past_due: { label: "Past Due", variant: "warning" },
  locked: { label: "Locked", variant: "error" },
  cancelled: { label: "Cancelled", variant: "default" },
};

const planLabels: Record<string, string> = {
  free: "Free", basic: "Basic", standard: "Standard", premium: "Premium", enterprise: "Enterprise",
};

function formatINR(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 1_00_000) return `₹${(rupees / 1_00_000).toFixed(1)}L`;
  if (rupees >= 1_000) return `₹${(rupees / 1_000).toFixed(1)}K`;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

type TenantRow = Tenant & Record<string, unknown>;

export default function BillingPage() {
  const router = useRouter();
  const { data: tenantsData, isLoading } = useTenants({
    page: 1,
    pageSize: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const { data: plans } = useAdminPlans();
  const { data: signupStats } = useSignupStats();

  const tenants = useMemo(() => (tenantsData?.data ?? []) as TenantRow[], [tenantsData]);

  // Price lookup (paise) by plan slug, from the live plan catalog.
  const priceBySlug = useMemo(() => {
    const map: Record<string, number> = {};
    (plans ?? []).forEach((p) => { map[p.slug] = p.priceInPaise; });
    return map;
  }, [plans]);

  const metrics = useMemo(() => {
    const counts = { trialing: 0, active: 0, past_due: 0, locked: 0, cancelled: 0 };
    let mrrPaise = 0;
    for (const t of tenants) {
      const status = (t.subscriptionStatus as string) ?? "active";
      if (status in counts) counts[status as keyof typeof counts] += 1;
      // MRR = recurring revenue from paying (active) subscriptions only.
      if (status === "active") {
        mrrPaise += priceBySlug[(t.subscriptionPlan as string) ?? ""] ?? 0;
      }
    }
    return { counts, mrrPaise };
  }, [tenants, priceBySlug]);

  // Derived SaaS metrics (point-in-time — no historical trend yet).
  const arrPaise = metrics.mrrPaise * 12;
  const arpuPaise =
    metrics.counts.active > 0 ? Math.round(metrics.mrrPaise / metrics.counts.active) : 0;
  const churnRate =
    metrics.counts.active + metrics.counts.cancelled > 0
      ? Math.round((metrics.counts.cancelled / (metrics.counts.active + metrics.counts.cancelled)) * 100)
      : 0;
  const totalLeads = signupStats?.total ?? 0;
  const conversionRate =
    totalLeads > 0 ? Math.round(((signupStats?.byStatus?.activated ?? 0) / totalLeads) * 100) : 0;

  const columns: ColumnDef<TenantRow>[] = [
    {
      key: "companyName",
      header: "Tenant",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.companyName || row.name}</p>
          <p className="text-xs text-muted-foreground">{row.slug}</p>
        </div>
      ),
    },
    {
      key: "subscriptionPlan",
      header: "Plan",
      sortable: true,
      cell: (row) => (
        <Badge variant="secondary">
          {planLabels[(row.subscriptionPlan as string) ?? ""] || row.subscriptionPlan || "—"}
        </Badge>
      ),
    },
    {
      key: "subscriptionStatus",
      header: "Subscription",
      sortable: true,
      cell: (row) => (
        <StatusBadge status={(row.subscriptionStatus as string) ?? "active"} colorMap={subscriptionStatusColorMap} />
      ),
    },
    {
      key: "mrr",
      header: "Monthly value",
      sortable: false,
      cell: (row) => {
        const status = (row.subscriptionStatus as string) ?? "active";
        const paise = priceBySlug[(row.subscriptionPlan as string) ?? ""] ?? 0;
        return status === "active" ? (
          <span className="font-medium">{formatINR(paise)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "subscriptionEndDate",
      header: "Renews / Ends",
      sortable: true,
      cell: (row) =>
        row.subscriptionEndDate ? (
          <span className="text-muted-foreground text-sm">
            {new Date(row.subscriptionEndDate as string).toLocaleDateString("en-IN", {
              year: "numeric", month: "short", day: "numeric",
            })}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Subscription health across all tenants. Open a tenant to extend a trial, cancel, or resync with Razorpay."
      />

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="MRR" value={formatINR(metrics.mrrPaise)} icon={IndianRupee} description="from active subscriptions" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Active" value={metrics.counts.active} icon={CheckCircle2} description="paying" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Trialing" value={metrics.counts.trialing} icon={Clock} description="in trial" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Past Due / Locked" value={metrics.counts.past_due + metrics.counts.locked} icon={AlertTriangle} description="need attention" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Cancelled" value={metrics.counts.cancelled} icon={XCircle} description="churned" />
        </motion.div>
      </motion.div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="ARR" value={formatINR(arrPaise)} icon={TrendingUp} description="annual run-rate (MRR×12)" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="ARPU" value={formatINR(arpuPaise)} icon={Coins} description="avg revenue / active tenant" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Churn Rate" value={`${churnRate}%`} icon={TrendingDown} description="cancelled of active+cancelled" />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <StatCard title="Trial → Paid" value={`${conversionRate}%`} icon={Percent} description="signups that activated" />
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <DataTable
          columns={columns}
          data={tenants}
          searchKey="companyName"
          searchPlaceholder="Search tenants..."
          onRowClick={(row) => router.push(`/admin/tenants/${row._id || row.id}`)}
        />
      </motion.div>
    </div>
  );
}
