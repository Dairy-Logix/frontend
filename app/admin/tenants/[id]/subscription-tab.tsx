"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Plus, XCircle } from "lucide-react";
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
  useAdminTenantSubscription,
  useAdminTenantPayments,
  useExtendTrial,
  useAdminForceCancel,
  useAdminSyncBilling,
} from "@/lib/hooks/use-admin-billing";
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

export function AdminSubscriptionTab({ tenantId }: { tenantId: string }) {
  const { data: sub, isLoading } = useAdminTenantSubscription(tenantId);
  const { data: payments } = useAdminTenantPayments(tenantId);
  const extend = useExtendTrial(tenantId);
  const sync = useAdminSyncBilling(tenantId);
  const cancel = useAdminForceCancel(tenantId);

  const [confirmCancel, setConfirmCancel] = useState(false);

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
    </div>
  );
}
