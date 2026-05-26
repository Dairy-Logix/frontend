"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuditLog, useAuditActions } from "@/lib/hooks/use-audit";
import type { AuditEntry } from "@/lib/api/services/audit.service";

// Human labels for the stable action keys recorded by the backend.
const ACTION_LABELS: Record<string, string> = {
  "tenant.plan_changed": "Plan changed",
  "tenant.status_changed": "Status changed",
  "plan.updated": "Plan edited",
  "platform.settings_updated": "Platform settings",
  "billing.trial_extended": "Trial extended",
  "billing.subscription_cancelled": "Subscription cancelled",
};

const actionLabel = (a: string) => ACTION_LABELS[a] ?? a;

type EntryRow = AuditEntry & Record<string, unknown>;

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const columns: ColumnDef<EntryRow>[] = [
  {
    key: "createdAt",
    header: "When",
    sortable: true,
    cell: (row) => <span className="text-sm text-muted-foreground whitespace-nowrap">{fmtDateTime(row.createdAt)}</span>,
  },
  {
    key: "actorEmail",
    header: "Actor",
    sortable: true,
    cell: (row) => (
      <div>
        <p className="text-sm">{row.actorEmail || "—"}</p>
        <p className="text-xs text-muted-foreground capitalize">{(row.actorRole || "").replace("_", " ")}</p>
      </div>
    ),
  },
  {
    key: "action",
    header: "Action",
    sortable: true,
    cell: (row) => <Badge variant="secondary">{actionLabel(row.action)}</Badge>,
  },
  {
    key: "summary",
    header: "Details",
    sortable: false,
    cell: (row) => <span className="text-sm">{row.summary}</span>,
  },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string>("all");

  const { data, isLoading } = useAuditLog({
    page,
    limit: 25,
    search: search || undefined,
    action: action === "all" ? undefined : action,
  });
  const { data: actions } = useAuditActions();

  const entries = (data?.entries ?? []) as EntryRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="A record of important admin actions — who did what, to whom, and when."
      />

      <motion.div className="space-y-4" initial="hidden" animate="visible" variants={{ hidden: {}, visible: {} }}>
        <motion.div className="flex items-center gap-4" variants={itemVariants}>
          <Input
            placeholder="Search details, tenant, or actor..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-sm"
          />
          <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {(actions ?? []).map((a) => (
                <SelectItem key={a} value={a}>{actionLabel(a)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No audit entries yet</h3>
            <p className="text-muted-foreground">
              Admin actions like plan changes, trial extensions, and settings edits will appear here.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={entries}
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
          />
        )}
      </motion.div>
    </div>
  );
}
