"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Pencil,
  Package,
  IndianRupee,
  Plus,
  Archive,
  Tag,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAdminPlans,
  useUpdatePlan,
  useCreatePlan,
  useArchivePlan,
} from "@/lib/hooks/use-plans";
import type {
  AdminPlan,
  CreatePlanInput,
  UpdatePlanInput,
} from "@/lib/api/services/plans.service";

// Human labels for the boolean feature matrix (keys mirror TenantFeatures).
const FEATURE_LABELS: Record<string, string> = {
  employees: "Employees",
  deliveries: "Deliveries",
  gpsTracking: "GPS Tracking",
  photoProofDelivery: "Photo Proof of Delivery",
  bulkImport: "Bulk Import",
  advancedAnalytics: "Advanced Analytics",
  pushNotifications: "Push Notifications",
  appNotifications: "In-App Notifications",
  storeMobileApp: "Store Mobile App",
  printTemplates: "Print Templates",
};

// Human labels for the numeric limits (keys mirror TenantLimits).
const LIMIT_LABELS: Record<string, string> = {
  maxAgencies: "Max Agencies",
  maxShopkeepers: "Max Stores",
  maxProducts: "Max Products",
  maxUsers: "Max Users",
  maxOrdersPerMonth: "Max Orders / Month",
};

const FEATURE_KEYS = Object.keys(FEATURE_LABELS);
const LIMIT_KEYS = Object.keys(LIMIT_LABELS);

function formatRupees(paise: number): string {
  return (paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** ISO → value for <input type="datetime-local"> in the browser's zone. */
function isoToLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localInputToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isSaleLive(plan: AdminPlan, now = new Date()): boolean {
  if (!plan.saleDiscountPercent) return false;
  if (plan.saleStartsAt && new Date(plan.saleStartsAt) > now) return false;
  if (plan.saleEndsAt && new Date(plan.saleEndsAt) < now) return false;
  return true;
}

interface FormState {
  slug: string;
  label: string;
  description: string;
  priceRupees: string;
  yearlyPriceRupees: string;
  trialDays: string;
  sortOrder: string;
  badge: string;
  highlight: boolean;
  isActive: boolean;
  isPublic: boolean;
  salePercent: string;
  saleLabel: string;
  saleStartsAt: string;
  saleEndsAt: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

const EMPTY_FORM: FormState = {
  slug: "",
  label: "",
  description: "",
  priceRupees: "",
  yearlyPriceRupees: "",
  trialDays: "10",
  sortOrder: "0",
  badge: "",
  highlight: false,
  isActive: true,
  isPublic: true,
  salePercent: "",
  saleLabel: "",
  saleStartsAt: "",
  saleEndsAt: "",
  features: FEATURE_KEYS.reduce((a, k) => ({ ...a, [k]: false }), {}),
  limits: LIMIT_KEYS.reduce((a, k) => ({ ...a, [k]: 0 }), {}),
};

function planToForm(plan: AdminPlan): FormState {
  return {
    slug: plan.slug,
    label: plan.label ?? "",
    description: plan.description ?? "",
    priceRupees: String((plan.priceInPaise ?? 0) / 100),
    yearlyPriceRupees:
      plan.yearlyPriceInPaise != null ? String(plan.yearlyPriceInPaise / 100) : "",
    trialDays: String(plan.trialDays ?? 0),
    sortOrder: String(plan.sortOrder ?? 0),
    badge: plan.badge ?? "",
    highlight: !!plan.highlight,
    isActive: plan.isActive ?? true,
    isPublic: plan.isPublic ?? true,
    salePercent: plan.saleDiscountPercent ? String(plan.saleDiscountPercent) : "",
    saleLabel: plan.saleLabel ?? "",
    saleStartsAt: isoToLocalInput(plan.saleStartsAt),
    saleEndsAt: isoToLocalInput(plan.saleEndsAt),
    // Normalise so every known key is present even if the doc omits it.
    features: FEATURE_KEYS.reduce(
      (acc, k) => ({ ...acc, [k]: Boolean(plan.features?.[k]) }),
      {} as Record<string, boolean>,
    ),
    limits: LIMIT_KEYS.reduce(
      (acc, k) => ({ ...acc, [k]: Number(plan.limits?.[k] ?? 0) }),
      {} as Record<string, number>,
    ),
  };
}

/** Shared payload for create + update. Empty optionals become null (= clear). */
function formToInput(form: FormState): UpdatePlanInput {
  const rupees = (v: string) => Math.round((parseFloat(v) || 0) * 100);
  const salePct = parseInt(form.salePercent);
  return {
    label: form.label.trim(),
    description: form.description.trim(),
    priceInPaise: rupees(form.priceRupees),
    yearlyPriceInPaise: form.yearlyPriceRupees.trim() ? rupees(form.yearlyPriceRupees) : null,
    trialDays: parseInt(form.trialDays) || 0,
    sortOrder: parseInt(form.sortOrder) || 0,
    badge: form.badge.trim() || null,
    highlight: form.highlight,
    isActive: form.isActive,
    isPublic: form.isPublic,
    saleDiscountPercent: salePct > 0 ? salePct : null,
    saleLabel: salePct > 0 && form.saleLabel.trim() ? form.saleLabel.trim() : null,
    saleStartsAt: salePct > 0 ? localInputToIso(form.saleStartsAt) : null,
    saleEndsAt: salePct > 0 ? localInputToIso(form.saleEndsAt) : null,
    features: form.features,
    limits: form.limits,
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type DialogMode = { kind: "create" } | { kind: "edit"; plan: AdminPlan } | null;

export default function PlansPage() {
  const { data: plans, isLoading, error, refetch } = useAdminPlans();
  const updatePlan = useUpdatePlan();
  const createPlan = useCreatePlan();
  const archivePlan = useArchivePlan();

  const [mode, setMode] = useState<DialogMode>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [archiving, setArchiving] = useState<AdminPlan | null>(null);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, sortOrder: String((plans?.length ?? 0) + 1) });
    setMode({ kind: "create" });
  };
  const openEdit = (plan: AdminPlan) => {
    setForm(planToForm(plan));
    setMode({ kind: "edit", plan });
  };

  const saving = updatePlan.isPending || createPlan.isPending;

  const handleSave = async () => {
    if (!mode) return;
    const input = formToInput(form);
    if (mode.kind === "create") {
      const payload: CreatePlanInput = {
        ...input,
        slug: form.slug.trim().toLowerCase(),
        label: input.label!,
        priceInPaise: input.priceInPaise!,
      };
      await createPlan.mutateAsync(payload);
    } else {
      await updatePlan.mutateAsync({ slug: mode.plan.slug, input });
    }
    setMode(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Plans" description="Manage the subscription plan catalog" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load plans. {(error as Error).message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const sorted = [...(plans ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const salePct = parseInt(form.salePercent) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description="Pricing, trial length, features, limits and sales for every subscription tier. Prices here are what Razorpay charges: a Razorpay plan is provisioned automatically the first time an amount is used. Changes apply to new subscriptions and plan switches; existing subscribers keep their locked amount."
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New plan
          </Button>
        }
      />

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {sorted.map((plan) => {
          const enabledFeatures = FEATURE_KEYS.filter((k) => plan.features?.[k]);
          const saleLive = isSaleLive(plan);
          const salePrice = saleLive
            ? Math.max(100, plan.priceInPaise - Math.round((plan.priceInPaise * (plan.saleDiscountPercent ?? 0)) / 100))
            : null;
          const provisioned = Object.keys(plan.razorpayPlanIds ?? {}).length + (plan.razorpayPlanId && !plan.razorpayPlanIds?.[`monthly:${plan.priceInPaise}`] ? 1 : 0);
          return (
            <motion.div key={plan._id} variants={itemVariants}>
              <Card className={`glass h-full flex flex-col ${!plan.isActive ? "opacity-60" : ""}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg leading-tight">{plan.label}</p>
                        <p className="text-xs text-muted-foreground">{plan.slug}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {!plan.isActive && <Badge variant="outline">Archived</Badge>}
                      {plan.isActive && !plan.isPublic && <Badge variant="secondary">Hidden</Badge>}
                      {plan.badge && (
                        <Badge className="gap-1"><Tag className="h-3 w-3" />{plan.badge}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <IndianRupee className="h-5 w-5 text-muted-foreground" />
                      {salePrice != null ? (
                        <>
                          <span className="text-2xl font-bold">{formatRupees(salePrice)}</span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatRupees(plan.priceInPaise)}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold">{formatRupees(plan.priceInPaise)}</span>
                      )}
                      <span className="text-sm text-muted-foreground">/ month</span>
                    </div>
                    {plan.yearlyPriceInPaise != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ₹{formatRupees(plan.yearlyPriceInPaise)} / year
                      </p>
                    )}
                  </div>

                  {saleLive && (
                    <Alert className="py-2">
                      <Sparkles className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <b>{plan.saleDiscountPercent}% sale</b>
                        {plan.saleLabel ? ` · ${plan.saleLabel}` : ""}
                        {plan.saleEndsAt
                          ? ` · until ${new Date(plan.saleEndsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                          : " · no end date"}
                      </AlertDescription>
                    </Alert>
                  )}
                  {!saleLive && plan.saleDiscountPercent && plan.saleStartsAt && new Date(plan.saleStartsAt) > new Date() ? (
                    <p className="text-xs text-muted-foreground">
                      {plan.saleDiscountPercent}% sale scheduled from{" "}
                      {new Date(plan.saleStartsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  ) : null}

                  {plan.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{plan.trialDays}-day trial</Badge>
                    <Badge variant="secondary">{enabledFeatures.length}/{FEATURE_KEYS.length} features</Badge>
                    <Badge variant={provisioned > 0 ? "secondary" : "outline"}>
                      {provisioned > 0 ? `${provisioned} Razorpay plan${provisioned === 1 ? "" : "s"}` : "Razorpay: on first use"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-auto">
                    {LIMIT_KEYS.map((k) => (
                      <div key={k} className="flex justify-between">
                        <span>{LIMIT_LABELS[k]}</span>
                        <span className="font-medium text-foreground">{plan.limits?.[k] ?? 0}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" className="flex-1" onClick={() => openEdit(plan)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    {plan.isActive && (
                      <Button
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => setArchiving(plan)}
                        title="Archive plan"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Create / edit dialog */}
      <Dialog open={!!mode} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {mode && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {mode.kind === "create" ? "New plan" : `Edit ${mode.plan.label} plan`}
                </DialogTitle>
                <DialogDescription>
                  {mode.kind === "create"
                    ? "The slug is permanent and becomes part of the signup URL (/signup?plan=slug)."
                    : <>Slug <code className="text-xs">{mode.plan.slug}</code> cannot be changed. Price edits take effect for new subscriptions and plan switches only.</>}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Basics */}
                <div className="grid grid-cols-2 gap-4">
                  {mode.kind === "create" && (
                    <div className="space-y-2">
                      <Label htmlFor="plan-slug">Slug</Label>
                      <Input
                        id="plan-slug"
                        placeholder="e.g. enterprise"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="plan-label">Label</Label>
                    <Input
                      id="plan-label"
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-price">Monthly price (₹, GST incl.)</Label>
                    <Input
                      id="plan-price"
                      type="number"
                      min={1}
                      value={form.priceRupees}
                      onChange={(e) => setForm({ ...form, priceRupees: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-yprice">Yearly price (₹, blank = monthly only)</Label>
                    <Input
                      id="plan-yprice"
                      type="number"
                      min={1}
                      placeholder="e.g. 10 × monthly"
                      value={form.yearlyPriceRupees}
                      onChange={(e) => setForm({ ...form, yearlyPriceRupees: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-desc">Description</Label>
                  <Textarea
                    id="plan-desc"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-trial">Trial days</Label>
                    <Input
                      id="plan-trial"
                      type="number"
                      min={0}
                      max={365}
                      value={form.trialDays}
                      onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-sort">Sort order</Label>
                    <Input
                      id="plan-sort"
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-badge">Badge (optional)</Label>
                    <Input
                      id="plan-badge"
                      placeholder="Most popular"
                      maxLength={30}
                      value={form.badge}
                      onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="plan-active"
                      checked={form.isActive}
                      onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                    />
                    <Label htmlFor="plan-active" className="cursor-pointer">Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="plan-public"
                      checked={form.isPublic}
                      onCheckedChange={(v) => setForm({ ...form, isPublic: v })}
                    />
                    <Label htmlFor="plan-public" className="cursor-pointer">Public (shown on pricing page)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="plan-highlight"
                      checked={form.highlight}
                      onCheckedChange={(v) => setForm({ ...form, highlight: v })}
                    />
                    <Label htmlFor="plan-highlight" className="cursor-pointer">Highlight card</Label>
                  </div>
                </div>

                <Separator />

                {/* Sale */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold">Sale</Label>
                    <p className="text-xs text-muted-foreground">
                      Percentage off the list price for anyone subscribing while the sale is live.
                      Existing subscribers are not affected. Leave percent blank for no sale.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="sale-pct" className="text-xs text-muted-foreground">Discount %</Label>
                      <Input
                        id="sale-pct"
                        type="number"
                        min={0}
                        max={90}
                        placeholder="0"
                        value={form.salePercent}
                        onChange={(e) => setForm({ ...form, salePercent: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sale-label" className="text-xs text-muted-foreground">Label shown to customers</Label>
                      <Input
                        id="sale-label"
                        placeholder="Diwali offer"
                        maxLength={40}
                        disabled={salePct <= 0}
                        value={form.saleLabel}
                        onChange={(e) => setForm({ ...form, saleLabel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sale-start" className="text-xs text-muted-foreground">Starts (blank = now)</Label>
                      <Input
                        id="sale-start"
                        type="datetime-local"
                        disabled={salePct <= 0}
                        value={form.saleStartsAt}
                        onChange={(e) => setForm({ ...form, saleStartsAt: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sale-end" className="text-xs text-muted-foreground">Ends (blank = until turned off)</Label>
                      <Input
                        id="sale-end"
                        type="datetime-local"
                        disabled={salePct <= 0}
                        value={form.saleEndsAt}
                        onChange={(e) => setForm({ ...form, saleEndsAt: e.target.value })}
                      />
                    </div>
                  </div>
                  {salePct > 0 && form.priceRupees && (
                    <p className="text-xs text-muted-foreground">
                      Customers will pay{" "}
                      <b>₹{formatRupees(Math.max(100, Math.round((parseFloat(form.priceRupees) || 0) * 100 * (1 - salePct / 100))))}</b>
                      /month instead of ₹{formatRupees(Math.round((parseFloat(form.priceRupees) || 0) * 100))}.
                    </p>
                  )}
                </div>

                <Separator />

                {/* Features */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Features</Label>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {FEATURE_KEYS.map((k) => (
                      <div key={k} className="flex items-center justify-between">
                        <Label htmlFor={`feat-${k}`} className="text-sm font-normal cursor-pointer">
                          {FEATURE_LABELS[k]}
                        </Label>
                        <Switch
                          id={`feat-${k}`}
                          checked={form.features[k]}
                          onCheckedChange={(v) =>
                            setForm({ ...form, features: { ...form.features, [k]: v } })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Limits */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Limits</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {LIMIT_KEYS.map((k) => (
                      <div key={k} className="space-y-1">
                        <Label htmlFor={`limit-${k}`} className="text-xs text-muted-foreground">
                          {LIMIT_LABELS[k]}
                        </Label>
                        <Input
                          id={`limit-${k}`}
                          type="number"
                          min={0}
                          value={form.limits[k]}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              limits: { ...form.limits, [k]: parseInt(e.target.value) || 0 },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {mode.kind === "edit" && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Razorpay plans (read-only)</Label>
                      <p className="text-xs text-muted-foreground">
                        One Razorpay plan exists per distinct charge amount. They are created automatically when a tenant subscribes.
                      </p>
                      {Object.keys(mode.plan.razorpayPlanIds ?? {}).length === 0 && !mode.plan.razorpayPlanId ? (
                        <p className="text-xs text-muted-foreground italic">None provisioned yet.</p>
                      ) : (
                        <ul className="text-xs font-mono space-y-1">
                          {mode.plan.razorpayPlanId && !mode.plan.razorpayPlanIds?.[`monthly:${mode.plan.priceInPaise}`] && (
                            <li>monthly · ₹{formatRupees(mode.plan.priceInPaise)} → {mode.plan.razorpayPlanId} <span className="text-muted-foreground">(legacy)</span></li>
                          )}
                          {Object.entries(mode.plan.razorpayPlanIds ?? {}).map(([key, id]) => {
                            const [period, amt] = key.split(":");
                            return (
                              <li key={key}>{period} · ₹{formatRupees(Number(amt))} → {id}</li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setMode(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !form.label.trim() || !form.priceRupees || (mode.kind === "create" && !form.slug)}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : mode.kind === "create" ? (
                    "Create plan"
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Archive confirm */}
      <AlertDialog open={!!archiving} onOpenChange={(open) => !open && setArchiving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archiving?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              The plan is removed from the pricing page and can no longer be chosen. This is refused
              while any tenant still has a live subscription on it. You can reactivate it later from Edit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archivePlan.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={archivePlan.isPending}
              onClick={async (e) => {
                e.preventDefault();
                if (!archiving) return;
                try {
                  await archivePlan.mutateAsync(archiving.slug);
                  setArchiving(null);
                } catch {
                  /* toast shown by hook */
                }
              }}
            >
              {archivePlan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
