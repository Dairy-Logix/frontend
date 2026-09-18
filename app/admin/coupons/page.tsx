"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Copy,
  TicketPercent,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useRemoveCoupon,
  useCouponRedemptions,
} from "@/lib/hooks/use-coupons";
import { useAdminPlans } from "@/lib/hooks/use-plans";
import type {
  Coupon,
  CouponType,
  CreateCouponInput,
  UpdateCouponInput,
} from "@/lib/api/services/coupons.service";

const TYPE_LABELS: Record<CouponType, string> = {
  percent: "Percentage off",
  flat: "Flat amount off",
  free_months: "Free months",
};

const fmtRupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function describe(c: Pick<Coupon, "type" | "value">): string {
  if (c.type === "percent") return `${c.value}% off`;
  if (c.type === "flat") return `${fmtRupees(c.value)} off`;
  return `${c.value} free month${c.value === 1 ? "" : "s"}`;
}

type Status = "live" | "scheduled" | "expired" | "exhausted" | "inactive";
function statusOf(c: Coupon, now = new Date()): Status {
  if (!c.isActive) return "inactive";
  if (c.maxRedemptions != null && c.redemptionCount >= c.maxRedemptions) return "exhausted";
  if (c.endsAt && new Date(c.endsAt) < now) return "expired";
  if (c.startsAt && new Date(c.startsAt) > now) return "scheduled";
  return "live";
}
const STATUS_STYLE: Record<Status, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  live: { label: "Live", variant: "default" },
  scheduled: { label: "Scheduled", variant: "secondary" },
  expired: { label: "Expired", variant: "outline" },
  exhausted: { label: "Exhausted", variant: "outline" },
  inactive: { label: "Inactive", variant: "destructive" },
};

function isoToLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const localInputToIso = (v: string): string | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

interface FormState {
  code: string;
  description: string;
  type: CouponType;
  value: string;
  plans: string[];
  periods: string[];
  startsAt: string;
  endsAt: string;
  maxRedemptions: string;
  newTenantsOnly: boolean;
  isActive: boolean;
}
const EMPTY: FormState = {
  code: "",
  description: "",
  type: "percent",
  value: "",
  plans: [],
  periods: [],
  startsAt: "",
  endsAt: "",
  maxRedemptions: "",
  newTenantsOnly: false,
  isActive: true,
};
function toForm(c: Coupon): FormState {
  return {
    code: c.code,
    description: c.description ?? "",
    type: c.type,
    value: c.type === "flat" ? String(c.value / 100) : String(c.value),
    plans: c.appliesToPlanSlugs ?? [],
    periods: c.appliesToPeriods ?? [],
    startsAt: isoToLocalInput(c.startsAt),
    endsAt: isoToLocalInput(c.endsAt),
    maxRedemptions: c.maxRedemptions != null ? String(c.maxRedemptions) : "",
    newTenantsOnly: c.newTenantsOnly,
    isActive: c.isActive,
  };
}
function toInput(f: FormState): UpdateCouponInput {
  const raw = parseFloat(f.value) || 0;
  return {
    description: f.description.trim() || undefined,
    type: f.type,
    value: f.type === "flat" ? Math.round(raw * 100) : Math.round(raw),
    appliesToPlanSlugs: f.plans,
    appliesToPeriods: f.periods,
    startsAt: localInputToIso(f.startsAt),
    endsAt: localInputToIso(f.endsAt),
    maxRedemptions: f.maxRedemptions.trim() ? parseInt(f.maxRedemptions) : null,
    newTenantsOnly: f.newTenantsOnly,
    isActive: f.isActive,
  };
}

type Row = Coupon & Record<string, unknown>;
type Mode = { kind: "create" } | { kind: "edit"; coupon: Coupon } | null;

export default function CouponsPage() {
  const { data: coupons, isLoading, error, refetch } = useCoupons();
  const { data: plans } = useAdminPlans();
  const create = useCreateCoupon();
  const update = useUpdateCoupon();
  const remove = useRemoveCoupon();

  const [mode, setMode] = useState<Mode>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [removing, setRemoving] = useState<Coupon | null>(null);
  const [viewing, setViewing] = useState<Coupon | null>(null);
  const redemptions = useCouponRedemptions(viewing?.code ?? null);

  const planOptions = useMemo(
    () => (plans ?? []).filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [plans],
  );

  const saving = create.isPending || update.isPending;
  const handleSave = async () => {
    if (!mode) return;
    const input = toInput(form);
    if (mode.kind === "create") {
      const payload: CreateCouponInput = {
        ...input,
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: input.value!,
      };
      await create.mutateAsync(payload);
    } else {
      await update.mutateAsync({ code: mode.coupon.code, input });
    }
    setMode(null);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`${code} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  const columns: ColumnDef<Row>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold">{row.code}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(row.code)} title="Copy code">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: "type",
      header: "Discount",
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{describe(row)}</p>
          {row.description && <p className="text-xs text-muted-foreground line-clamp-1">{row.description}</p>}
        </div>
      ),
    },
    {
      key: "scope",
      header: "Applies to",
      cell: (row) => (
        <div className="text-xs text-muted-foreground">
          <p>{row.appliesToPlanSlugs.length ? row.appliesToPlanSlugs.join(", ") : "All plans"}</p>
          <p>
            {row.appliesToPeriods.length ? row.appliesToPeriods.join(" + ") : "monthly + yearly"}
            {row.newTenantsOnly ? " · new customers" : ""}
          </p>
        </div>
      ),
    },
    {
      key: "window",
      header: "Valid",
      cell: (row) => {
        const s = fmtDate(row.startsAt);
        const e = fmtDate(row.endsAt);
        if (!s && !e) return <span className="text-xs text-muted-foreground">Always</span>;
        return <span className="text-xs text-muted-foreground">{s ?? "now"} → {e ?? "no end"}</span>;
      },
    },
    {
      key: "redemptionCount",
      header: "Used",
      sortable: true,
      cell: (row) => (
        <button
          type="button"
          className="text-sm underline-offset-2 hover:underline"
          onClick={() => setViewing(row)}
        >
          {row.redemptionCount}
          {row.maxRedemptions != null ? ` / ${row.maxRedemptions}` : ""}
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const st = STATUS_STYLE[statusOf(row)];
        return <Badge variant={st.variant}>{st.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setForm(toForm(row)); setMode({ kind: "edit", coupon: row }); }} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setRemoving(row)} title="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Coupons" description="Promotional codes for signup and billing" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load coupons. {(error as Error).message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rows = (coupons ?? []) as Row[];
  const liveCount = rows.filter((c) => statusOf(c) === "live").length;
  const totalRedemptions = rows.reduce((n, c) => n + c.redemptionCount, 0);
  const valueHint =
    form.type === "percent" ? "1–100" : form.type === "flat" ? "₹ amount" : "1–12 months";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        description="Codes tenants can enter at signup or on their billing page. Percentage and flat coupons reduce the charge for the whole subscription; free-month coupons delay the first charge. A code counts as used only once the subscription activates, so abandoned checkouts never burn it."
        action={
          <Button onClick={() => { setForm(EMPTY); setMode({ kind: "create" }); }}>
            <Plus className="mr-2 h-4 w-4" />
            New coupon
          </Button>
        }
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <TicketPercent className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{liveCount}</p>
            <p className="text-xs text-muted-foreground">Live coupons</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{totalRedemptions}</p>
            <p className="text-xs text-muted-foreground">Total redemptions</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3 col-span-2 md:col-span-1">
          <div>
            <p className="text-2xl font-bold">{rows.length}</p>
            <p className="text-xs text-muted-foreground">All coupons</p>
          </div>
        </div>
      </motion.div>

      <DataTable columns={columns} data={rows} />

      {/* Create / edit */}
      <Dialog open={!!mode} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {mode && (
            <>
              <DialogHeader>
                <DialogTitle>{mode.kind === "create" ? "New coupon" : `Edit ${mode.coupon.code}`}</DialogTitle>
                <DialogDescription>
                  {mode.kind === "create"
                    ? "Codes are case-insensitive and cannot be renamed once issued."
                    : "Changes apply to future redemptions only."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-code">Code</Label>
                    <Input
                      id="c-code"
                      placeholder="WELCOME20"
                      className="font-mono uppercase"
                      disabled={mode.kind === "edit"}
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CouponType, value: "" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TYPE_LABELS) as CouponType[]).map((t) => (
                          <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-value">Value <span className="text-muted-foreground text-xs">({valueHint})</span></Label>
                    <Input
                      id="c-value"
                      type="number"
                      min={form.type === "flat" ? 1 : 1}
                      max={form.type === "percent" ? 100 : form.type === "free_months" ? 12 : undefined}
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-max">Max redemptions <span className="text-muted-foreground text-xs">(blank = unlimited)</span></Label>
                    <Input
                      id="c-max"
                      type="number"
                      min={1}
                      value={form.maxRedemptions}
                      onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="c-desc">Description <span className="text-muted-foreground text-xs">(shown to the customer)</span></Label>
                  <Textarea id="c-desc" rows={2} maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-start">Starts <span className="text-muted-foreground text-xs">(blank = now)</span></Label>
                    <Input id="c-start" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-end">Ends <span className="text-muted-foreground text-xs">(blank = never)</span></Label>
                    <Input id="c-end" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Plans <span className="text-muted-foreground text-xs font-normal">(none ticked = every plan)</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    {planOptions.map((p) => {
                      const checked = form.plans.includes(p.slug);
                      return (
                        <label key={p.slug} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              setForm({
                                ...form,
                                plans: v ? [...form.plans, p.slug] : form.plans.filter((s) => s !== p.slug),
                              })
                            }
                          />
                          {p.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Billing period <span className="text-muted-foreground text-xs font-normal">(none ticked = both)</span></Label>
                  <div className="flex gap-6">
                    {(["monthly", "yearly"] as const).map((per) => (
                      <label key={per} className="flex items-center gap-2 text-sm cursor-pointer capitalize">
                        <Checkbox
                          checked={form.periods.includes(per)}
                          onCheckedChange={(v) =>
                            setForm({
                              ...form,
                              periods: v ? [...form.periods, per] : form.periods.filter((s) => s !== per),
                            })
                          }
                        />
                        {per}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                  <div className="flex items-center gap-2">
                    <Switch id="c-new" checked={form.newTenantsOnly} onCheckedChange={(v) => setForm({ ...form, newTenantsOnly: v })} />
                    <Label htmlFor="c-new" className="cursor-pointer">New customers only</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="c-active" checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                    <Label htmlFor="c-active" className="cursor-pointer">Active</Label>
                  </div>
                </div>

                {form.type !== "free_months" && (
                  <p className="text-xs text-muted-foreground">
                    Discounts never stack. If a plan sale or a manual discount is bigger than this coupon, the customer gets that instead and the code is not consumed.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setMode(null)} disabled={saving}>Cancel</Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !form.value || (mode.kind === "create" && form.code.length < 3)}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : mode.kind === "create" ? "Create coupon" : "Save changes"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing && removing.redemptionCount > 0
                ? `This code has ${removing.redemptionCount} redemption(s), so it will be deactivated rather than deleted to keep the history.`
                : "This code has never been used and will be deleted permanently."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={async (e) => {
                e.preventDefault();
                if (!removing) return;
                try {
                  await remove.mutateAsync(removing.code);
                  setRemoving(null);
                } catch {
                  /* toast from hook */
                }
              }}
            >
              {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Redemptions drawer */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-mono">{viewing?.code}</SheetTitle>
            <SheetDescription>
              {viewing ? `${describe(viewing)} · ${viewing.redemptionCount} redemption${viewing.redemptionCount === 1 ? "" : "s"}` : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {redemptions.isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
            ) : (redemptions.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody has redeemed this code yet.</p>
            ) : (
              (redemptions.data ?? []).map((r) => {
                const t = typeof r.tenantId === "object" && r.tenantId ? r.tenantId : null;
                return (
                  <div key={r._id} className="rounded-lg border p-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{t?.companyName ?? "Tenant"}</span>
                      <span className="text-xs text-muted-foreground">{fmtDate(r.redeemedAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.planSlug} · {r.billingPeriod ?? "monthly"}
                      {r.chargeInPaise != null && r.listInPaise != null
                        ? ` · ${fmtRupees(r.chargeInPaise)} instead of ${fmtRupees(r.listInPaise)}`
                        : ""}
                      {r.freeMonths ? ` · ${r.freeMonths} free month${r.freeMonths === 1 ? "" : "s"}` : ""}
                    </p>
                    {t?.ownerEmail && <p className="text-xs text-muted-foreground">{t.ownerEmail}</p>}
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
