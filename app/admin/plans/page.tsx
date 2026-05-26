"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Pencil, Package, IndianRupee } from "lucide-react";
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
import { useAdminPlans, useUpdatePlan } from "@/lib/hooks/use-plans";
import type { AdminPlan } from "@/lib/api/services/plans.service";

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

interface EditState {
  label: string;
  description: string;
  priceRupees: string;
  trialDays: string;
  razorpayPlanId: string;
  sortOrder: string;
  isActive: boolean;
  isPublic: boolean;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

function planToEditState(plan: AdminPlan): EditState {
  return {
    label: plan.label ?? "",
    description: plan.description ?? "",
    priceRupees: String((plan.priceInPaise ?? 0) / 100),
    trialDays: String(plan.trialDays ?? 0),
    razorpayPlanId: plan.razorpayPlanId ?? "",
    sortOrder: String(plan.sortOrder ?? 0),
    isActive: plan.isActive ?? true,
    isPublic: plan.isPublic ?? true,
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function PlansPage() {
  const { data: plans, isLoading, error, refetch } = useAdminPlans();
  const updatePlan = useUpdatePlan();

  const [editing, setEditing] = useState<AdminPlan | null>(null);
  const [form, setForm] = useState<EditState | null>(null);

  useEffect(() => {
    setForm(editing ? planToEditState(editing) : null);
  }, [editing]);

  const handleSave = async () => {
    if (!editing || !form) return;
    const priceInPaise = Math.round((parseFloat(form.priceRupees) || 0) * 100);
    await updatePlan.mutateAsync({
      slug: editing.slug,
      input: {
        label: form.label,
        description: form.description,
        priceInPaise,
        trialDays: parseInt(form.trialDays) || 0,
        razorpayPlanId: form.razorpayPlanId || undefined,
        sortOrder: parseInt(form.sortOrder) || 0,
        isActive: form.isActive,
        isPublic: form.isPublic,
        features: form.features,
        limits: form.limits,
      },
    });
    setEditing(null);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description="Pricing, trial length, features, and limits for every subscription tier. Changes apply to new subscriptions and plan switches; existing tenants keep their cached matrix until their next plan change or webhook."
      />

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {sorted.map((plan) => {
          const enabledFeatures = FEATURE_KEYS.filter((k) => plan.features?.[k]);
          return (
            <motion.div key={plan._id} variants={itemVariants}>
              <Card className="glass h-full flex flex-col">
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
                      {!plan.isActive && <Badge variant="outline">Inactive</Badge>}
                      {!plan.isPublic && <Badge variant="secondary">Hidden</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <div className="flex items-baseline gap-1">
                    <IndianRupee className="h-5 w-5 text-muted-foreground" />
                    <span className="text-2xl font-bold">{formatRupees(plan.priceInPaise)}</span>
                    <span className="text-sm text-muted-foreground">/ {plan.billingPeriod}</span>
                  </div>

                  {plan.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{plan.trialDays}-day trial</Badge>
                    <Badge variant="secondary">{enabledFeatures.length}/{FEATURE_KEYS.length} features</Badge>
                    <Badge variant={plan.razorpayPlanId ? "secondary" : "outline"}>
                      {plan.razorpayPlanId ? "Razorpay linked" : "No Razorpay ID"}
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

                  <Button variant="outline" className="w-full mt-2" onClick={() => setEditing(plan)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit plan
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editing && form && (
            <>
              <DialogHeader>
                <DialogTitle>Edit {editing.label} plan</DialogTitle>
                <DialogDescription>
                  Slug <code className="text-xs">{editing.slug}</code> cannot be changed. Razorpay
                  pricing must be updated in the Razorpay dashboard too — this only links the plan ID.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Basics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-label">Label</Label>
                    <Input
                      id="plan-label"
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-price">Price (₹ / {editing.billingPeriod})</Label>
                    <Input
                      id="plan-price"
                      type="number"
                      min={0}
                      value={form.priceRupees}
                      onChange={(e) => setForm({ ...form, priceRupees: e.target.value })}
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
                    <Label htmlFor="plan-rzp">Razorpay Plan ID</Label>
                    <Input
                      id="plan-rzp"
                      placeholder="plan_XXXXXXXX"
                      value={form.razorpayPlanId}
                      onChange={(e) => setForm({ ...form, razorpayPlanId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-8">
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
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)} disabled={updatePlan.isPending}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updatePlan.isPending}>
                  {updatePlan.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
