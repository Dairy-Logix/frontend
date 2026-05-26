"use client";

import { useMemo, useState } from "react";
import { Loader2, RefreshCw, Plus, XCircle, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminTenantSubscription,
  useAdminTenantPayments,
  useExtendTrial,
  useAdminForceCancel,
  useAdminSyncBilling,
} from "@/lib/hooks/use-admin-billing";
import { useChangeTenantPlan, useTenant, useTenantStats } from "@/lib/hooks/use-tenants";
import { usePublicPlans } from "@/lib/hooks/use-plans";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

const statusBadge: Record<string, { label: string; variant: any }> = {
  trialing: { label: "Trialing", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  past_due: { label: "Past Due", variant: "destructive" },
  locked: { label: "Locked", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
const formatDate = (d?: string | Date) =>
  d ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—";

const FEATURE_LABELS: Record<string, string> = {
  employees: "Employees",
  deliveries: "Deliveries",
  gpsTracking: "GPS tracking",
  photoProofDelivery: "Photo proof of delivery",
  bulkImport: "Bulk import",
  advancedAnalytics: "Advanced analytics",
  pushNotifications: "Push notifications",
  appNotifications: "In-app notifications",
  storeMobileApp: "Store mobile app",
  printTemplates: "Print templates",
};

const LIMIT_LABELS: Record<string, string> = {
  maxAgencies: "Agencies",
  maxShopkeepers: "Shopkeepers",
  maxProducts: "Products",
  maxUsers: "Users",
  maxOrdersPerMonth: "Orders / month",
};

const LIMIT_USAGE_KEY: Record<string, string> = {
  maxAgencies: "totalAgencies",
  maxShopkeepers: "totalShopkeepers",
  maxProducts: "totalProducts",
  maxUsers: "totalUsers",
  maxOrdersPerMonth: "totalOrders",
};

interface PlanDiff {
  featuresGained: string[];
  featuresLost: string[];
  limitWarnings: { key: string; label: string; current: number; newLimit: number }[];
}

function computeDiff(
  currentPlan: { features?: Record<string, boolean>; limits?: Record<string, number> } | undefined,
  targetPlan: { features?: Record<string, boolean>; limits?: Record<string, number> } | undefined,
  stats: Record<string, number> | undefined,
): PlanDiff | null {
  if (!targetPlan) return null;
  const currentFeatures = currentPlan?.features ?? {};
  const newFeatures = targetPlan.features ?? {};

  const featuresGained: string[] = [];
  const featuresLost: string[] = [];
  for (const key of Object.keys({ ...currentFeatures, ...newFeatures })) {
    if (!currentFeatures[key] && newFeatures[key]) featuresGained.push(key);
    if (currentFeatures[key] && !newFeatures[key]) featuresLost.push(key);
  }

  const limitWarnings: PlanDiff["limitWarnings"] = [];
  for (const key of Object.keys(targetPlan.limits ?? {})) {
    const newLimit = targetPlan.limits?.[key] ?? 0;
    if (newLimit < 0) continue;
    const usageKey = LIMIT_USAGE_KEY[key];
    const current = (stats && usageKey && stats[usageKey]) || 0;
    if (current > newLimit) {
      limitWarnings.push({
        key,
        label: LIMIT_LABELS[key] ?? key,
        current,
        newLimit,
      });
    }
  }

  return { featuresGained, featuresLost, limitWarnings };
}

export function AdminSubscriptionTab({ tenantId }: { tenantId: string }) {
  const { data: sub, isLoading } = useAdminTenantSubscription(tenantId);
  const { data: payments } = useAdminTenantPayments(tenantId);
  const { data: tenant } = useTenant(tenantId);
  const { data: stats } = useTenantStats(tenantId);
  const { data: plans } = usePublicPlans();
  const extend = useExtendTrial(tenantId);
  const sync = useAdminSyncBilling(tenantId);
  const cancel = useAdminForceCancel(tenantId);
  const changePlan = useChangeTenantPlan();

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [confirmChange, setConfirmChange] = useState(false);

  const currentPlan = useMemo(
    () => plans?.find((p) => p.slug === sub?.planSlug),
    [plans, sub?.planSlug],
  );
  const targetPlan = useMemo(
    () => plans?.find((p) => p.slug === selectedPlan),
    [plans, selectedPlan],
  );
  const diff = useMemo(
    () => computeDiff(currentPlan, targetPlan, stats),
    [currentPlan, targetPlan, stats],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sub) {
    return (
      <Card className="glass">
        <CardContent className="py-12 text-center text-muted-foreground">
          No active subscription for this tenant.
        </CardContent>
      </Card>
    );
  }

  const status = statusBadge[sub.status] || { label: sub.status, variant: "secondary" };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Read-only — actions below modify the subscription.
              </CardDescription>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Plan</p>
              <p className="font-medium capitalize">{sub.planSlug}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Period Ends</p>
              <p className="font-medium">{formatDate(sub.currentPeriodEnd)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Trial Ends</p>
              <p className="font-medium">{formatDate(sub.trialEnd)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Razorpay Sub</p>
              <p className="font-mono text-xs truncate">
                {sub.razorpaySubscriptionId || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Change plan</CardTitle>
              <CardDescription>
                Override the tenant's plan immediately. Does not touch Razorpay
                — use for comp accounts, forced re-syncs, or trial promotions.
              </CardDescription>
            </div>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Select
              value={selectedPlan}
              onValueChange={setSelectedPlan}
              disabled={!plans || changePlan.isPending}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Pick a plan…" />
              </SelectTrigger>
              <SelectContent>
                {(plans ?? []).map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.label} — {formatPrice(p.priceInPaise)}
                    {p.slug === sub.planSlug ? " (current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setConfirmChange(true)}
              disabled={
                !selectedPlan ||
                selectedPlan === sub.planSlug ||
                changePlan.isPending
              }
            >
              {changePlan.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpDown className="h-4 w-4" />
              )}
              Apply plan
            </Button>
          </div>

          {diff && targetPlan && (
            <div className="rounded-lg border border-border/50 p-3 space-y-2 text-sm">
              <p className="text-xs text-muted-foreground">
                Switching from <span className="font-medium capitalize">{sub.planSlug}</span>{" "}
                to <span className="font-medium capitalize">{targetPlan.slug}</span>:
              </p>
              {diff.featuresGained.length === 0 &&
                diff.featuresLost.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No feature changes.
                  </p>
                )}
              {diff.featuresGained.map((k) => (
                <div key={`+${k}`} className="flex items-center gap-2">
                  <ArrowUp className="h-3 w-3 text-[var(--success)]" />
                  <span className="text-[var(--success)]">
                    Unlocks: {FEATURE_LABELS[k] ?? k}
                  </span>
                </div>
              ))}
              {diff.featuresLost.map((k) => (
                <div key={`-${k}`} className="flex items-center gap-2">
                  <ArrowDown className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">
                    Removes: {FEATURE_LABELS[k] ?? k}
                  </span>
                </div>
              ))}
              {diff.limitWarnings.length > 0 && (
                <div className="pt-2 border-t border-border/50 space-y-1">
                  <p className="text-xs font-medium text-destructive">
                    Tenant exceeds the new plan's limits — existing records stay,
                    but new creates of these resources will be blocked:
                  </p>
                  {diff.limitWarnings.map((w) => (
                    <p key={w.key} className="text-xs text-destructive">
                      • {w.label}: {w.current} currently, new cap {w.newLimit}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>
            Reserved for special cases — most lifecycle changes happen automatically via webhooks.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => extend.mutate(7)}
            disabled={extend.isPending}
          >
            {extend.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Extend trial +7 days
          </Button>
          <Button
            variant="outline"
            onClick={() => sync.mutate()}
            disabled={sync.isPending || !sub.razorpaySubscriptionId}
          >
            {sync.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Force sync from Razorpay
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmCancel(true)}
            disabled={cancel.isPending || sub.status === "cancelled"}
          >
            <XCircle className="h-4 w-4" />
            Cancel immediately
          </Button>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Razorpay payment history for this tenant.</CardDescription>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No payments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>{formatDate(p.capturedAt || p.createdAt)}</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(p.amountInPaise)}
                    </TableCell>
                    <TableCell className="capitalize">{p.method}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "captured" ? "default" : "destructive"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.razorpayPaymentId}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel subscription immediately?"
        description="This terminates the subscription right now (not at period end). The tenant will lose access to write actions immediately."
        confirmLabel="Yes, cancel now"
        variant="destructive"
        onConfirm={() =>
          cancel.mutate("Cancelled by admin", {
            onSuccess: () => setConfirmCancel(false),
          })
        }
      />

      <ConfirmDialog
        open={confirmChange}
        onOpenChange={setConfirmChange}
        title={`Switch plan to ${targetPlan?.label ?? selectedPlan}?`}
        description={
          diff?.limitWarnings.length
            ? "The new plan has lower limits than the tenant's current usage on some resources. Existing records keep working, but new creates will be blocked until they're under cap. Proceed?"
            : "The tenant's cached features and limits will switch immediately. Razorpay is not contacted — bill manually if this is a comp account."
        }
        confirmLabel="Apply plan change"
        onConfirm={() =>
          changePlan.mutate(
            { id: tenantId, planSlug: selectedPlan },
            { onSuccess: () => setConfirmChange(false) },
          )
        }
      />
    </div>
  );
}
