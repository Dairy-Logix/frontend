"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Loader2,
  XCircle,
  ArrowUpRight,
  Check,
  Minus,
  CalendarClock,
  PartyPopper,
} from "lucide-react";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import {
  useBillingSubscription,
  useBillingPayments,
  useSubscribe,
  useCancelSubscription,
  billingKeys,
} from "@/lib/hooks/use-billing";
import { usePublicPlans } from "@/lib/hooks/use-signup";

const statusBadge: Record<string, { label: string; variant: any }> = {
  trialing: { label: "Trialing", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  past_due: { label: "Past Due", variant: "destructive" },
  locked: { label: "Locked", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—";

const daysUntil = (d?: string) => {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
};

const daysBetween = (start?: string, end?: string) => {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
};

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

const PENDING_KEY = "beatmitra-pending-subscribe";
const PENDING_TTL_MS = 30 * 60 * 1000; // 30 minutes

type PendingSubscribe = { ts: number; planSlug: string };

export default function BillingPage() {
  const { data: sub, isLoading: loadingSub } = useBillingSubscription();
  const { data: payments } = useBillingPayments();
  const { data: plans } = usePublicPlans();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [celebrationPlanLabel, setCelebrationPlanLabel] = useState<string | null>(
    null,
  );

  const subscribe = useSubscribe();
  const cancel = useCancelSubscription();

  // If Razorpay dashboard is configured to redirect back with ?razorpay=success
  // after the hosted checkout, show a toast and force-refetch.
  useEffect(() => {
    if (searchParams.get("razorpay") === "success") {
      toast.success(
        "Payment completed. We're activating your subscription — give it a moment.",
      );
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription() });
      queryClient.invalidateQueries({ queryKey: billingKeys.payments() });
      router.replace("/billing");
    }
  }, [searchParams, queryClient, router]);

  // Detect "subscription just went active" — fires when the user returns from
  // the Razorpay tab and the webhook has flipped status. sessionStorage flag
  // is set when they clicked Subscribe earlier in this session, so the banner
  // only shows for the user who actually started the flow.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sub?.status !== "active") return;
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as PendingSubscribe;
      if (Date.now() - pending.ts > PENDING_TTL_MS) {
        sessionStorage.removeItem(PENDING_KEY);
        return;
      }
      const planLabel =
        plans?.find((p) => p.slug === pending.planSlug)?.label ?? pending.planSlug;
      setCelebrationPlanLabel(planLabel);
      sessionStorage.removeItem(PENDING_KEY);
    } catch {
      sessionStorage.removeItem(PENDING_KEY);
    }
  }, [sub?.status, plans]);

  const currentPlan = plans?.find((p) => p.slug === sub?.planSlug);
  const targetPlan = plans?.find(
    (p) => p.slug === (selectedPlan || sub?.planSlug),
  );

  const handleSubscribe = () => {
    const planForFlow = selectedPlan || sub?.planSlug;
    subscribe.mutate(planForFlow, {
      onSuccess: (data) => {
        // Mark that we kicked off a subscribe in this session, so when the
        // user lands back on /billing post-payment the celebration banner
        // shows for the right tenant.
        if (typeof window !== "undefined" && planForFlow) {
          sessionStorage.setItem(
            PENDING_KEY,
            JSON.stringify({ ts: Date.now(), planSlug: planForFlow }),
          );
        }
        // Same-tab redirect to Razorpay hosted checkout. After payment,
        // Razorpay redirects back to the URL configured in
        //   Dashboard → Settings → Subscriptions → Customer Settings → Redirect URL
        // — set it to `{FRONTEND_URL}/billing?razorpay=success` so the page
        // catches the return, shows a toast, and force-refetches.
        window.location.href = data.shortUrl;
      },
    });
  };

  if (loadingSub) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="space-y-6">
        <PageHeader title="Billing" description="Subscription and payment information" />
        <Card className="glass">
          <CardContent className="py-12 text-center text-muted-foreground">
            No subscription found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const trialDaysLeft = sub.status === "trialing" ? daysUntil(sub.trialEnd) : null;
  const periodDaysLeft = sub.status === "active" ? daysUntil(sub.currentPeriodEnd) : null;
  const totalTrialDays = daysBetween(sub.trialStart, sub.trialEnd);
  const status = statusBadge[sub.status] || { label: sub.status, variant: "secondary" };

  const cancellationPending =
    !!sub.cancelledAt &&
    !!sub.currentPeriodEnd &&
    new Date(sub.currentPeriodEnd).getTime() > Date.now() &&
    sub.status !== "locked";
  const accessDaysLeft = cancellationPending ? daysUntil(sub.currentPeriodEnd) : null;

  const enabledFeatures = Object.entries(sub.features || {}).filter(
    ([key, value]) => value === true && FEATURE_LABELS[key],
  );
  const allFeatures = Object.keys(FEATURE_LABELS);
  const visibleLimits = Object.entries(sub.limits || {}).filter(
    ([key]) => LIMIT_LABELS[key],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Manage your subscription, payments, and plan." />

      {celebrationPlanLabel && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardContent className="py-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
                <PartyPopper className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  Welcome to BeatMitra {celebrationPlanLabel} — your subscription is
                  active!
                </p>
                <p className="text-sm text-muted-foreground">
                  Payment received and your plan features are unlocked. Thanks for
                  subscribing.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCelebrationPlanLabel(null)}
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {sub.status === "trialing" && (
          <Card className="glass border-amber-500/30 mb-6">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium">
                  Your trial ends in {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {totalTrialDays
                    ? `${totalTrialDays}-day trial started on ${formatDate(sub.trialStart)}. `
                    : ""}
                  Subscribe before {formatDate(sub.trialEnd)} to keep using the app without
                  interruption.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {cancellationPending && (
          <Card className="glass border-amber-500/30 mb-6">
            <CardContent className="py-4 flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium">Cancellation scheduled</p>
                <p className="text-sm text-muted-foreground">
                  You cancelled on {formatDate(sub.cancelledAt)}. Access continues until{" "}
                  {formatDate(sub.currentPeriodEnd)}
                  {accessDaysLeft !== null
                    ? ` (${accessDaysLeft} day${accessDaysLeft === 1 ? "" : "s"} left)`
                    : ""}
                  . Re-subscribe below to keep your account active.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {sub.status === "past_due" && (
          <Card className="glass border-destructive/30 mb-6">
            <CardContent className="py-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium">Your subscription is past due</p>
                <p className="text-sm text-muted-foreground">
                  Your last payment didn't go through. The app stays read-only for a short
                  grace period — re-authorise payment below to restore full access.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {sub.status === "locked" && (
          <Card className="glass border-destructive/30 mb-6">
            <CardContent className="py-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium">Your account is locked</p>
                <p className="text-sm text-muted-foreground">
                  Payment hasn't been received past the grace period. Your data is safe but
                  inaccessible until you re-subscribe below.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {sub.status === "cancelled" && !cancellationPending && (
          <Card className="glass border-destructive/30 mb-6">
            <CardContent className="py-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium">Your subscription has ended</p>
                <p className="text-sm text-muted-foreground">
                  Cancelled on {formatDate(sub.cancelledAt)}
                  {sub.endedAt ? ` and ended on ${formatDate(sub.endedAt)}` : ""}.
                  Re-subscribe below to restore access — your data has been preserved.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your active subscription details.</CardDescription>
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Plan</p>
                <p className="font-medium capitalize">{sub.planSlug}</p>
                {currentPlan && (
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(currentPlan.priceInPaise)}/mo
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {sub.status === "trialing" ? "Trial Ends" : "Renews On"}
                </p>
                <p className="font-medium">{formatDate(sub.currentPeriodEnd)}</p>
                {(trialDaysLeft !== null || periodDaysLeft !== null) && (
                  <p className="text-xs text-muted-foreground">
                    {trialDaysLeft ?? periodDaysLeft} days left
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Period Started</p>
                <p className="font-medium">{formatDate(sub.currentPeriodStart || sub.trialStart)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Razorpay Subscription</p>
                <p className="font-mono text-xs truncate">
                  {sub.razorpaySubscriptionId || "—"}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-medium mb-3">What's included on your plan</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleLimits.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      Limits
                    </p>
                    <ul className="space-y-1.5">
                      {visibleLimits.map(([key, value]) => (
                        <li
                          key={key}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {LIMIT_LABELS[key]}
                          </span>
                          <span className="font-medium">
                            {Number(value).toLocaleString("en-IN")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Features
                  </p>
                  <ul className="space-y-1.5">
                    {allFeatures.map((key) => {
                      const enabled = sub.features?.[key] === true;
                      return (
                        <li
                          key={key}
                          className={`flex items-center gap-2 text-sm ${enabled ? "" : "text-muted-foreground/60"}`}
                        >
                          {enabled ? (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Minus className="h-3.5 w-3.5" />
                          )}
                          <span>{FEATURE_LABELS[key]}</span>
                        </li>
                      );
                    })}
                  </ul>
                  {enabledFeatures.length === 0 && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      No optional features enabled on this plan.
                    </p>
                  )}
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {(sub.status === "trialing" ||
          sub.status === "past_due" ||
          sub.status === "locked" ||
          sub.status === "cancelled" ||
          cancellationPending) && (
          <Card className="glass mt-6">
            <CardHeader>
              <CardTitle>
                {sub.status === "cancelled" || cancellationPending
                  ? "Re-subscribe"
                  : "Subscribe to a Paid Plan"}
              </CardTitle>
              <CardDescription>
                {cancellationPending
                  ? "Pick a plan to undo your cancellation and continue without interruption."
                  : "Choose a plan and pay via UPI Autopay, card, or netbanking."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {plans?.map((p) => {
                  const selected = (selectedPlan || sub.planSlug) === p.slug;
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => setSelectedPlan(p.slug)}
                      className={`text-left rounded-lg border p-3 transition-colors ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{p.label}</span>
                        {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-lg font-bold mt-1">
                        {formatPrice(p.priceInPaise)}
                        <span className="text-xs font-normal text-muted-foreground">
                          /mo
                        </span>
                      </p>
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={handleSubscribe}
                disabled={subscribe.isPending || !targetPlan}
                className="w-full sm:w-auto"
              >
                {subscribe.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {targetPlan
                  ? `${cancellationPending || sub.status === "cancelled" ? "Re-subscribe" : "Subscribe"} — ${targetPlan.label} ${formatPrice(targetPlan.priceInPaise)}/mo`
                  : `Subscribe to ${sub.planSlug}`}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                You'll be redirected to Razorpay to complete payment and authorise auto-debit.
                Prices include GST.
              </p>
            </CardContent>
          </Card>
        )}

        {sub.status === "active" && !sub.cancelledAt && (
          <Card className="glass mt-6">
            <CardHeader>
              <CardTitle>Cancel Subscription</CardTitle>
              <CardDescription>
                Cancel auto-renewal. You'll keep access until {formatDate(sub.currentPeriodEnd)}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setConfirmCancel(true)}
                disabled={cancel.isPending}
              >
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="glass mt-6">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Recent charges on this account.</CardDescription>
          </CardHeader>
          <CardContent>
            {!payments || payments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No payments yet.
              </p>
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
                  {payments.map((p) => {
                    const isFailed = p.status === "failed";
                    const isRefunded = p.status === "refunded";
                    const statusVariant: "default" | "destructive" | "secondary" =
                      p.status === "captured"
                        ? "default"
                        : isRefunded
                          ? "secondary"
                          : "destructive";
                    return (
                      <TableRow
                        key={p._id}
                        className={isFailed ? "bg-destructive/5" : undefined}
                      >
                        <TableCell>
                          {formatDate(p.capturedAt || p.createdAt)}
                        </TableCell>
                        <TableCell
                          className={`font-medium ${isFailed ? "text-muted-foreground line-through" : ""}`}
                        >
                          {formatPrice(p.amountInPaise)}
                        </TableCell>
                        <TableCell className="capitalize">{p.method}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={statusVariant} className="w-fit capitalize">
                              {p.status}
                            </Badge>
                            {isFailed && p.failureReason && (
                              <span className="text-xs text-destructive/80">
                                {p.failureReason}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.razorpayPaymentId}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel Subscription?"
        description={`Auto-renewal will be turned off. You'll keep access until ${formatDate(sub.currentPeriodEnd)}.`}
        confirmLabel="Yes, cancel"
        variant="destructive"
        onConfirm={() => {
          cancel.mutate(undefined, { onSuccess: () => setConfirmCancel(false) });
        }}
      />
    </div>
  );
}
