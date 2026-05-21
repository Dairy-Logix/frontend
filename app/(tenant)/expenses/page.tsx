"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Plus,
  Loader2,
  AlertCircle,
  Receipt,
  IndianRupee,
  Calendar,
  Pencil,
  Trash2,
  Filter,
  TrendingDown,
  Wallet,
  Truck,
  Wrench,
  Users,
  PackageX,
  Building2,
  Zap,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { SearchInput } from "@/components/shared/search-input";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAgencies } from "@/lib/hooks/use-agencies";
import {
  useExpenses,
  useExpenseSummary,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/lib/hooks/use-expenses";
import type {
  Expense,
  ExpenseCategory,
  ExpensePaymentMode,
  CreateExpenseInput,
} from "@/lib/types";
import { useTranslations } from "@/components/providers/intl-provider";

const CATEGORY_OPTIONS: {
  value: ExpenseCategory;
  label: string;
  icon: LucideIcon;
}[] = [
    { value: "vehicle_fuel", label: "Vehicle Fuel", icon: Truck },
    { value: "vehicle_maintenance", label: "Vehicle Maintenance", icon: Wrench },
    { value: "employee_salary", label: "Employee Salary", icon: Users },
    { value: "product_loss", label: "Product Loss / Expiry", icon: PackageX },
    { value: "rent", label: "Rent", icon: Building2 },
    { value: "utilities", label: "Utilities", icon: Zap },
    { value: "office", label: "Office", icon: Briefcase },
    { value: "other", label: "Other", icon: HelpCircle },
  ];

const PAYMENT_MODE_OPTIONS: { value: ExpensePaymentMode; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
];

function formatINR(n: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(d: string | Date): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function categoryMeta(cat: ExpenseCategory) {
  return (
    CATEGORY_OPTIONS.find((c) => c.value === cat) ?? {
      value: cat,
      label: cat,
      icon: Receipt,
    }
  );
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FormState {
  category: ExpenseCategory | "";
  subcategory: string;
  amount: string;
  date: string;
  paymentMode: ExpensePaymentMode;
  description: string;
  vendorName: string;
  agencyId: string;
}

const emptyForm: FormState = {
  category: "",
  subcategory: "",
  amount: "",
  date: isoToday(),
  paymentMode: "cash",
  description: "",
  vendorName: "",
  agencyId: "",
};

export default function ExpensesPage() {
  const tPage = useTranslations("pages.expenses");
  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Data
  const {
    data: expensesPage,
    isLoading,
    error,
  } = useExpenses({
    page,
    pageSize,
    search: search || undefined,
    category:
      categoryFilter !== "all" ? (categoryFilter as ExpenseCategory) : undefined,
    agencyId: agencyFilter !== "all" ? agencyFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: summary } = useExpenseSummary({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: agenciesPage } = useAgencies({ pageSize: 100 });
  const agencies = useMemo(
    () => (agenciesPage?.data || []).filter((a) => a.isActive),
    [agenciesPage],
  );

  const createMut = useCreateExpense();
  const updateMut = useUpdateExpense();
  const deleteMut = useDeleteExpense();

  const expenses = expensesPage?.data || [];
  const pagination = expensesPage?.pagination;
  const filteredTotal = expensesPage?.filteredTotal || 0;

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, date: isoToday() });
    setFormOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setForm({
      category: e.category,
      subcategory: e.subcategory || "",
      amount: String(e.amount),
      date: e.date.slice(0, 10),
      paymentMode: e.paymentMode || "cash",
      description: e.description || "",
      vendorName: e.vendorName || "",
      agencyId: e.agencyId || "",
    });
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (!form.category) {
      toast.error("Pick a category");
      return;
    }
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter an amount greater than 0");
      return;
    }
    if (!form.date) {
      toast.error("Pick a date");
      return;
    }

    const agency = agencies.find((a) => a.id === form.agencyId);
    const payload: CreateExpenseInput = {
      category: form.category,
      subcategory: form.subcategory.trim() || undefined,
      amount,
      date: new Date(form.date).toISOString(),
      paymentMode: form.paymentMode,
      description: form.description.trim() || undefined,
      vendorName: form.vendorName.trim() || undefined,
      agencyId: form.agencyId || undefined,
      agencyName: agency?.name,
    };

    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, input: payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      setFormOpen(false);
    } catch {
      // hook already toasts
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteMut.mutateAsync(deletingId);
      setDeletingId(null);
    } catch {
      // hook already toasts
    }
  }

  // Top stats cards
  const stats = useMemo(() => {
    const total = summary?.totalAmount || 0;
    const count = summary?.totalCount || 0;
    const top =
      (summary?.byCategory || []).slice().sort(
        (a, b) => b.totalAmount - a.totalAmount,
      )[0] || null;
    return { total, count, top };
  }, [summary]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading expenses…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Expenses" description="Track daily business expenses" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(error as Error).message || "Failed to load expenses"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and manage all business expenses — fuel, salaries, maintenance, losses and more"
        action={
          <Button
            onClick={openCreate}
            size="lg"
            className="gap-2 bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Spent"
          value={formatINR(stats.total)}
          icon={IndianRupee}
          tone="primary"
          description={`${stats.count} expense${stats.count === 1 ? "" : "s"}`}
        />
        <StatCard
          title="Filtered Total"
          value={formatINR(filteredTotal)}
          icon={TrendingDown}
          tone="amber"
          description={`${pagination?.total ?? 0} matching`}
        />
        <StatCard
          title="Top Category"
          value={
            stats.top ? categoryMeta(stats.top._id).label : "—"
          }
          icon={Wallet}
          tone="cyan"
          description={
            stats.top ? formatINR(stats.top.totalAmount) : "No expenses yet"
          }
        />
        <StatCard
          title="This Month"
          value={formatINR(
            (summary?.byMonth || []).slice(-1)[0]?.totalAmount || 0,
          )}
          icon={Calendar}
          tone="emerald"
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Filters
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search description, vendor…"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={agencyFilter} onValueChange={setAgencyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All agencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agencies</SelectItem>
              {agencies.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="From"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="To"
          />
        </div>
      </motion.div>

      {/* List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass rounded-2xl overflow-hidden"
      >
        {expenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-lg font-medium">No expenses yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Hit “Add Expense” to record your first one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-border/40">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">#</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">Agency</th>
                  <th className="text-left py-3 px-4 font-semibold">Mode</th>
                  <th className="text-right py-3 px-4 font-semibold">Amount</th>
                  <th className="text-right py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, idx) => {
                  const meta = categoryMeta(e.category);
                  const Icon = meta.icon;
                  return (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.02 }}
                      className="border-b border-border/30 last:border-0 hover:bg-primary/[0.03]"
                    >
                      <td className="py-2 px-4 font-mono text-xs text-muted-foreground">
                        {e.expenseNumber}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        {formatDate(e.date)}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium">{meta.label}</div>
                            {e.subcategory && (
                              <div className="text-xs text-muted-foreground truncate">
                                {e.subcategory}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 max-w-[280px]">
                        <div className="truncate">
                          {e.description || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                        {e.vendorName && (
                          <div className="text-xs text-muted-foreground truncate">
                            {e.vendorName}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-4 text-muted-foreground">
                        {e.agencyName || "—"}
                      </td>
                      <td className="py-2 px-4 capitalize text-muted-foreground">
                        {e.paymentMode}
                      </td>
                      <td className="py-2 px-4 text-right font-semibold tabular-nums">
                        {formatINR(e.amount)}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(e)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingId(e.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-sm text-muted-foreground">
            Showing {expenses.length} of {pagination.total} expenses
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      <FormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Edit Expense" : "Add Expense"}
        description={
          editing
            ? "Update the expense details below"
            : "Record a new business expense"
        }
        className="sm:max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, category: v as ExpenseCategory }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subcategory</Label>
              <Input
                value={form.subcategory}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subcategory: e.target.value }))
                }
                placeholder="e.g. Diesel, Tyre change"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Mode</Label>
              <Select
                value={form.paymentMode}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    paymentMode: v as ExpensePaymentMode,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODE_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Agency (optional)</Label>
              <Select
                value={form.agencyId || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, agencyId: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Vendor / Paid To</Label>
              <Input
                value={form.vendorName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vendorName: e.target.value }))
                }
                placeholder="e.g. Indian Oil Petrol Pump"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Description / Notes</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Add any notes about this expense"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              {(createMut.isPending || updateMut.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editing ? "Save changes" : "Record expense"}
            </Button>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete this expense?"
        description="This expense will be removed from reports. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMut.isPending}
      />
    </div>
  );
}
