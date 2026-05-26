"use client";

import { Badge } from "@/components/ui/badge";

export interface PlanUsageCounts {
  agencies: number;
  stores: number;
  products: number;
  users: number;
}

interface PlanLimitShape {
  maxAgencies?: number;
  maxShopkeepers?: number;
  maxProducts?: number;
  maxUsers?: number;
  maxOrdersPerMonth?: number;
}

interface PlanUsageProps {
  limits?: PlanLimitShape | null;
  usage: PlanUsageCounts;
}

interface Row {
  label: string;
  used: number;
  max: number;
}

// Bar + badge colour by how close usage is to the plan cap. This is the signal
// a super admin acts on: amber = approaching cap (upsell), red = over cap.
function severity(used: number, max: number): "ok" | "near" | "over" {
  if (max <= 0) return "ok";
  if (used > max) return "over";
  if (used / max >= 0.75) return "near";
  return "ok";
}

const BAR: Record<string, string> = {
  ok: "bg-green-500",
  near: "bg-amber-500",
  over: "bg-red-500",
};

export function PlanUsage({ limits, usage }: PlanUsageProps) {
  const l: PlanLimitShape = limits || {};
  const rows: Row[] = [
    { label: "Agencies", used: usage.agencies, max: l.maxAgencies ?? 0 },
    { label: "Stores", used: usage.stores, max: l.maxShopkeepers ?? 0 },
    { label: "Products", used: usage.products, max: l.maxProducts ?? 0 },
    { label: "Users", used: usage.users, max: l.maxUsers ?? 0 },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {rows.map((r) => {
        const sev = severity(r.used, r.max);
        const pct = r.max > 0 ? Math.min(100, (r.used / r.max) * 100) : 0;
        return (
          <div key={r.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{r.label}</span>
              {sev === "over" && (
                <Badge className="border-red-500/20 bg-red-500/15 text-red-600 dark:text-red-400">
                  Over cap
                </Badge>
              )}
              {sev === "near" && (
                <Badge className="border-amber-500/20 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Near cap
                </Badge>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{r.used}</span>
              <span className="text-sm text-muted-foreground">/ {r.max || "∞"}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${BAR[sev]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
