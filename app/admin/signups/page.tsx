"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Clock, Rocket, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSignupLeads, useSignupStats } from "@/lib/hooks/use-admin-signups";
import type { SignupIntent, SignupIntentStatus } from "@/lib/api/services/admin-signups.service";

const statusColorMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  pending_verification: { label: "Pending", variant: "warning" },
  trialing: { label: "Trialing", variant: "info" },
  activated: { label: "Activated", variant: "success" },
  abandoned: { label: "Abandoned", variant: "default" },
  enterprise_lead: { label: "Enterprise", variant: "info" },
};

const planLabels: Record<string, string> = {
  free: "Free", basic: "Basic", standard: "Standard", premium: "Premium", enterprise: "Enterprise",
};

type LeadRow = SignupIntent & Record<string, unknown>;

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

const columns: ColumnDef<LeadRow>[] = [
  {
    key: "companyName",
    header: "Company",
    sortable: true,
    cell: (row) => (
      <div>
        <p className="font-medium">{row.companyName}</p>
        <p className="text-xs text-muted-foreground">
          {[row.city, row.state].filter(Boolean).join(", ") || "—"}
        </p>
      </div>
    ),
  },
  {
    key: "ownerName",
    header: "Contact",
    sortable: true,
    cell: (row) => (
      <div>
        <p className="text-sm">{row.ownerName}</p>
        <p className="text-xs text-muted-foreground">{row.ownerEmail}</p>
        <p className="text-xs text-muted-foreground">{row.ownerPhone}</p>
      </div>
    ),
  },
  {
    key: "planSlug",
    header: "Plan",
    sortable: true,
    cell: (row) => <Badge variant="secondary">{planLabels[row.planSlug] || row.planSlug}</Badge>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    cell: (row) => <StatusBadge status={row.status} colorMap={statusColorMap} />,
  },
  {
    key: "createdAt",
    header: "Started",
    sortable: true,
    cell: (row) => <span className="text-sm text-muted-foreground">{fmtDate(row.createdAt)}</span>,
  },
  {
    key: "emailVerifiedAt",
    header: "Verified",
    sortable: true,
    cell: (row) => <span className="text-sm text-muted-foreground">{fmtDate(row.emailVerifiedAt)}</span>,
  },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function SignupLeadsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SignupIntentStatus | "all">("all");

  const { data, isLoading } = useSignupLeads({
    page,
    limit: 20,
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const { data: stats } = useSignupStats();

  const leads = (data?.signups ?? []) as LeadRow[];
  const by = stats?.byStatus ?? {};
  const total = stats?.total ?? 0;
  const activated = by.activated ?? 0;
  const conversion = total > 0 ? Math.round((activated / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Signup Leads"
        description="Trial signups and where they are in the funnel. Activated leads have become tenants."
      />

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={itemVariants}>
          <StatCard title="Total Leads" value={total} icon={Users} description={`${conversion}% converted`} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Pending" value={by.pending_verification ?? 0} icon={Clock} description="awaiting verification" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Trialing" value={by.trialing ?? 0} icon={Rocket} description="verified, in trial" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Activated" value={activated} icon={CheckCircle2} description="became tenants" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Abandoned" value={by.abandoned ?? 0} icon={XCircle} description="dropped off" />
        </motion.div>
      </motion.div>

      <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search company, owner, email, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-sm"
          />
          <Select value={status} onValueChange={(v) => { setStatus(v as SignupIntentStatus | "all"); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending_verification">Pending</SelectItem>
              <SelectItem value="trialing">Trialing</SelectItem>
              <SelectItem value="activated">Activated</SelectItem>
              <SelectItem value="abandoned">Abandoned</SelectItem>
              <SelectItem value="enterprise_lead">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={leads}
            pagination={
              data
                ? {
                    page: data.pagination.page,
                    pageSize: data.pagination.limit,
                    total: data.pagination.total,
                    onPageChange: setPage,
                    onPageSizeChange: () => {},
                  }
                : undefined
            }
            onRowClick={(row) =>
              row.activatedTenantId && router.push(`/admin/tenants/${row.activatedTenantId}`)
            }
          />
        )}
      </motion.div>
    </div>
  );
}
