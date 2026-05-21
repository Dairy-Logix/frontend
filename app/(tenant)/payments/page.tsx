"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee,
  CreditCard,
  Clock,
  Store,
  Calendar,
  ChevronDown,
  ChevronUp,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2 as LoaderIcon,
  AlertCircle,
  FileText,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormModal } from "@/components/shared/form-modal";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

import type { Payment, GroupedCollection } from "@/lib/types";
import { useGroupedCollections, useDayStats } from "@/lib/hooks";
import { usePendingByStore, invoiceKeys } from "@/lib/hooks/use-invoices";
import { useAgencies } from "@/lib/hooks/use-agencies";
import { useEmployees } from "@/lib/hooks/use-employees";
import { useAuthStore } from "@/lib/stores/auth-store";
import { paymentService } from "@/lib/api/services/payment.service";
import { todayIST } from "@/lib/utils";
import type { PendingStoreBalance } from "@/lib/api/services/invoice.service";
import { useTranslations } from "@/components/providers/intl-provider";

// --- Color maps ---
const paymentTypeColorMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  online: { label: "Online", variant: "info" },
  offline: { label: "Cash", variant: "default" },
  cash: { label: "Cash", variant: "default" },
  cheque: { label: "Cheque", variant: "warning" },
  upi: { label: "UPI", variant: "info" },
  card: { label: "Card", variant: "info" },
  wallet: { label: "Wallet", variant: "success" },
};

// --- Helpers ---
function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isThisMonth(dateStr?: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function isOverdueDate(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// --- Main Page ---
export default function PaymentsPage() {
  const tPage = useTranslations("pages.payments");
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const queryClient = useQueryClient();

  // Pending filters
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingAgencyId, setPendingAgencyId] = useState("");
  const [groupByAgency, setGroupByAgency] = useState(false);

  // History filters
  const [paySearch, setPaySearch] = useState("");
  const [payTypeFilter, setPayTypeFilter] = useState("all");
  const [payCollectorId, setPayCollectorId] = useState("all");
  const [payDate, setPayDate] = useState("");
  const [payPage, setPayPage] = useState(1);
  const [expandedPayId, setExpandedPayId] = useState<string | null>(null);

  // Shared lookups
  const { data: agenciesData } = useAgencies({ pageSize: 100 });
  const { data: employeesData } = useEmployees({ pageSize: 200 });
  const agencies = agenciesData?.data || [];
  const employees = employeesData?.data || [];
  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = currentUser?.id || (currentUser as any)?._id?.toString();

  function getCollectedBy(payment: Payment): string {
    if (!payment.collectedById) return "—";
    if (currentUserId && payment.collectedById === currentUserId) return "You";
    return employees.find((e) => e.id === payment.collectedById)?.name ?? "—";
  }

  function getCollectorName(collectedById?: string, collectedByName?: string): string {
    if (!collectedById) return "—";
    if (currentUserId && collectedById === currentUserId) return "You";
    return employees.find((e) => e.id === collectedById)?.name ?? collectedByName ?? "—";
  }

  // Pending payments (by store)
  const {
    data: pendingStores,
    isLoading: pendingLoading,
    error: pendingError,
    refetch: refetchPending,
  } = usePendingByStore({
    agencyId: pendingAgencyId || undefined,
    search: pendingSearch || undefined,
    groupByAgency: !groupByAgency, // default=separate rows per store+agency; toggle=merge into one row per store
  });

  // Payment history — grouped by collection event
  const {
    data: collectionsData,
    isLoading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = useGroupedCollections({
    page: payPage,
    pageSize: 20,
    dateFrom: payDate || undefined,
    dateTo: payDate || undefined,
  });

  // Today's aggregated stats
  const todayStr = useMemo(() => todayIST(), []);
  const { data: dayStats } = useDayStats(todayStr);

  const stores = pendingStores || [];
  const collections = collectionsData?.data || [];

  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const matchesSearch =
        paySearch === "" ||
        (c.shopkeeperName ?? "").toLowerCase().includes(paySearch.toLowerCase());
      const matchesType = payTypeFilter === "all" || c.paymentType === payTypeFilter;
      const matchesCollector = payCollectorId === "all" || c.collectedById === payCollectorId;
      return matchesSearch && matchesType && matchesCollector;
    });
  }, [collections, paySearch, payTypeFilter, payCollectorId]);

  // Stats
  const stats = useMemo(() => {
    const outstanding = stores.reduce((sum, s) => sum + s.totalDue, 0);
    const overdueAmount = stores.reduce((sum, s) => sum + s.overdueAmount, 0);
    const dueAmount = stores.reduce((sum, s) => sum + s.dueAmount, 0);
    return {
      outstanding, overdueAmount, dueAmount, pendingCount: stores.length,
      clearedToday: dayStats?.clearedToday ?? 0,
      cashAmount: dayStats?.cashAmount ?? 0,
      onlineAmount: dayStats?.onlineAmount ?? 0,
      chequeAmount: dayStats?.chequeAmount ?? 0,
      walletWithdraw: dayStats?.walletWithdraw ?? 0,
      walletDeposit: dayStats?.walletDeposit ?? 0,
    };
  }, [stores, dayStats]);

  // --- Collect Modal ---
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStore, setFormStore] = useState<PendingStoreBalance | null>(null);
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<string>("offline");
  const [formNotes, setFormNotes] = useState("");
  const [useWallet, setUseWallet] = useState(false);

  const walletAvailable = formStore?.walletBalance ?? 0;
  const cashAmount = Number(formAmount) || 0;
  const walletApplied = useWallet ? Math.min(walletAvailable, formStore?.totalDue ?? 0) : 0;
  const totalPayment = cashAmount + walletApplied;

  function openCollectModal(store: PendingStoreBalance) {
    setFormStore(store);
    setUseWallet(false);
    setFormAmount(String(store.totalDue));
    setFormType("offline");
    setFormNotes("");
    setFormOpen(true);
  }

  function handleWalletToggle(checked: boolean) {
    setUseWallet(checked);
    if (checked && formStore) {
      const applied = Math.min(formStore.walletBalance, formStore.totalDue);
      setFormAmount(String(Math.max(0, formStore.totalDue - applied)));
    } else if (formStore) {
      setFormAmount(String(formStore.totalDue));
    }
  }


  async function handleFormSubmit() {
    if (!formStore) return;
    if (cashAmount < 0) {
      toast.error("Amount cannot be negative");
      return;
    }
    if (cashAmount === 0 && walletApplied === 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await paymentService.collectForStore({
        shopkeeperId: formStore.shopkeeperId,
        amount: cashAmount,
        paymentType: formType,
        notes: formNotes || undefined,
        agencyId: !groupByAgency ? formStore.agencyId : undefined,
        walletAmount: walletApplied > 0 ? walletApplied : undefined,
      });

      if (result.success && result.data) {
        const walletUsed = result.data.walletUsed ?? 0;
        const walletCredited = result.data.walletCredited ?? 0;
        const cleared = result.data.invoicesCleared;
        const parts: string[] = [`${cleared} invoice${cleared !== 1 ? "s" : ""} cleared`];
        if (walletUsed > 0) parts.push(`₹${walletUsed.toLocaleString("en-IN")} wallet applied`);
        if (walletCredited > 0) parts.push(`₹${walletCredited.toLocaleString("en-IN")} added to wallet`);
        toast.success(`₹${result.data.totalApplied.toLocaleString("en-IN")} collected — ${parts.join(" · ")}`);
        setFormOpen(false);
        queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
        refetchPending();
        refetchPayments();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to collect payment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tPage("title")}
        description={tPage("description")}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Outstanding"
          value={formatINR(stats.outstanding)}
          description="Due + Overdue combined"
          icon={IndianRupee}
          className="xl:col-span-1"
        />
        <StatCard
          title="Due"
          value={formatINR(stats.dueAmount)}
          description="Within grace period"
          icon={Clock}
          className="xl:col-span-1"
        />
        <StatCard
          title="Overdue"
          value={formatINR(stats.overdueAmount)}
          description="Past grace period"
          icon={AlertTriangle}
          className="xl:col-span-1"
        />
        <StatCard
          title="Cleared Today"
          value={formatINR(stats.clearedToday)}
          description="Total invoices cleared today"
          icon={CheckCircle2}
          className="xl:col-span-1"
        />

        {/* Total Payment Received */}
        <motion.div
          whileHover={{ y: -2, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass rounded-xl p-5 flex flex-col gap-3 xl:col-span-1"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Payment <br /> Received</p>
            <div className="bg-gradient-primary rounded-lg p-2 text-white">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {formatINR(stats.cashAmount + stats.onlineAmount + stats.chequeAmount)}
          </p>
          <div className="space-y-1.5 border-t border-border/40 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Cash</span>
              <span className="font-medium">{formatINR(stats.cashAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Online</span>
              <span className="font-medium">{formatINR(stats.onlineAmount)}</span>
            </div>
            {stats.chequeAmount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cheque</span>
                <span className="font-medium">{formatINR(stats.chequeAmount)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Wallet Amount */}
        {(() => {
          const net = stats.walletDeposit - stats.walletWithdraw;
          const isPositive = net >= 0;
          return (
            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="glass rounded-xl p-5 flex flex-col gap-3 xl:col-span-1"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Wallet Movement</p>
                <div className="bg-gradient-primary rounded-lg p-2 text-white">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className={`text-2xl font-bold tracking-tight ${isPositive ? "text-[var(--success,#22c55e)]" : "text-destructive"}`}>
                  {isPositive ? "+" : "-"}{formatINR(Math.abs(net))}
                </p>
                <p className={`text-xs mt-0.5 ${isPositive ? "text-[var(--success,#22c55e)]" : "text-destructive"}`}>
                  {isPositive ? "Net deposited today" : "Net withdrawn today"}
                </p>
              </div>
              <div className="space-y-1.5 border-t border-border/40 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Today Withdrawn</span>
                  <span className="font-medium text-destructive">{formatINR(stats.walletWithdraw)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Today Deposited</span>
                  <span className="font-medium text-[var(--success,#22c55e)]">{formatINR(stats.walletDeposit)}</span>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {(["pending", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "pending" ? "Pending Payments" : "Payment History"}
            {tab === "pending" && stats.pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-destructive/15 text-destructive text-xs px-1.5 py-0.5 font-semibold">
                {stats.pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── PENDING PAYMENTS TAB ── */}
      {activeTab === "pending" && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-subtle rounded-xl p-4"
          >
            <div className="flex flex-wrap gap-3">
              <SearchInput
                value={pendingSearch}
                onChange={(v) => setPendingSearch(v)}
                placeholder="Search by store or agency..."
                className="flex-1 min-w-[180px]"
              />
              <Button
                variant={groupByAgency ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupByAgency((v) => !v)}
                className="gap-1.5 h-9"
              >
                <Layers className="h-3.5 w-3.5" />
                Group by Store
              </Button>
              <Select
                value={pendingAgencyId || "all"}
                onValueChange={(v) => setPendingAgencyId(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[175px]">
                  <SelectValue placeholder="All Agencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agencies</SelectItem>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(pendingSearch || pendingAgencyId) && (
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { setPendingSearch(""); setPendingAgencyId(""); }}
                  className="text-xs text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>
          </motion.div>

          {pendingLoading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <div className="text-center space-y-3">
                <LoaderIcon className="h-10 w-10 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground text-sm">Loading pending payments...</p>
              </div>
            </div>
          ) : pendingError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Failed to load pending payments.</span>
                <Button variant="outline" size="sm" onClick={() => refetchPending()}>Retry</Button>
              </AlertDescription>
            </Alert>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={String(groupByAgency)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="glass rounded-xl overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Store</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Agency</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Invoices</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Due</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Overdue</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Outstanding</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-14 text-center">
                            <CheckCircle2 className="h-12 w-12 mx-auto text-[var(--success)]/50 mb-3" />
                            <p className="text-muted-foreground text-lg font-medium">All caught up!</p>
                            <p className="text-muted-foreground text-sm mt-1">No stores with outstanding balance.</p>
                          </td>
                        </tr>
                      ) : (
                        stores.map((store) => {
                          const hasOverdue = store.overdueAmount > 0;
                          return (
                            <tr
                              key={store.id || store.shopkeeperId}
                              className={`border-b border-border/30 last:border-0 hover:bg-white/5 transition-colors ${hasOverdue ? "bg-destructive/5" : ""}`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Store className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <div>
                                    <span className="font-medium">{store.shopkeeperName}</span>
                                    {store.overdueCount > 0 && (
                                      <p className="text-xs text-destructive">{store.overdueCount} overdue</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-xs">
                                {store.agencyName || "—"}
                              </td>
                              <td className="py-3 px-4 text-center hidden sm:table-cell">
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                  <FileText className="h-3 w-3" />
                                  {store.invoiceCount}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right hidden lg:table-cell text-sm text-muted-foreground">
                                {store.dueAmount > 0 ? formatINR(store.dueAmount) : <span className="text-muted-foreground/40">—</span>}
                              </td>
                              <td className="py-3 px-4 text-right hidden lg:table-cell text-sm">
                                {store.overdueAmount > 0 ? (
                                  <span className="text-destructive font-medium">{formatINR(store.overdueAmount)}</span>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-destructive">
                                {formatINR(store.totalDue)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 h-7 text-xs px-3"
                                  onClick={() => openCollectModal(store)}
                                >
                                  Collect
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}

      {/* ── PAYMENT HISTORY TAB ── */}
      {activeTab === "history" && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-subtle rounded-xl p-4"
          >
            <div className="flex flex-wrap gap-3">
              <SearchInput
                value={paySearch}
                onChange={setPaySearch}
                placeholder="Search by store name..."
                className="flex-1 min-w-[180px]"
              />
              <Select value={payTypeFilter} onValueChange={setPayTypeFilter}>
                <SelectTrigger className="w-[155px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="online">Online / UPI</SelectItem>
                  <SelectItem value="offline">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
              <Select value={payCollectorId} onValueChange={setPayCollectorId}>
                <SelectTrigger className="w-[175px]">
                  <SelectValue placeholder="All Collectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collectors</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => { setPayDate(e.target.value); setPayPage(1); }}
                  className="w-[150px] h-9 text-sm"
                />
                {payDate && (
                  <Button variant="ghost" size="icon-sm" onClick={() => { setPayDate(""); setPayPage(1); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {paymentsLoading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <LoaderIcon className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : paymentsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Failed to load payments.</span>
                <Button variant="outline" size="sm" onClick={() => refetchPayments()}>Retry</Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Store</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Collected By</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Method</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                      {filteredCollections.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-14 text-center">
                            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground text-lg font-medium">No payments found</p>
                            <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredCollections.flatMap((col) => {
                          const rowKey = col._id;
                          const collectorName = getCollectorName(col.collectedById, col.collectedByName);
                          const rows = [
                            <tr
                              key={rowKey}
                              className="border-b border-border/30 last:border-0 cursor-pointer hover:bg-white/5 transition-colors"
                              onClick={() => setExpandedPayId((prev) => prev === rowKey ? null : rowKey)}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <div>
                                    <span className="text-muted-foreground text-xs">{formatDate(col.collectedAt)}</span>
                                    <p className="text-xs text-muted-foreground/60">{formatTime(col.collectedAt)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">{col.shopkeeperName || "—"}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell text-xs">
                                <span className={collectorName === "You" ? "font-semibold text-foreground" : "text-muted-foreground"}>
                                  {collectorName}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-semibold">
                                {formatINR(col.totalAmount)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                  {(col.walletUsed ?? 0) > 0 && (
                                    <StatusBadge status="wallet" colorMap={paymentTypeColorMap} />
                                  )}
                                  {(col.invoiceTotal - (col.walletUsed ?? 0)) > 0 && (
                                    <StatusBadge status={col.paymentType} colorMap={paymentTypeColorMap} />
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Button variant="ghost" size="icon-sm">
                                  {expandedPayId === rowKey ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </td>
                            </tr>,
                          ];

                          if (expandedPayId === rowKey) {
                            rows.push(
                              <tr key={`detail-${rowKey}`} className="border-b border-border/30">
                                <td colSpan={6} className="p-0">
                                  <div className="glass-subtle p-4 mx-4 mb-4 rounded-lg space-y-4">
                                    {/* Payment Sources */}
                                    {(() => {
                                      const walletUsed = col.walletUsed ?? 0;
                                      const walletCredited = col.walletCredited ?? 0;
                                      const cashPaid = col.invoiceTotal - walletUsed;
                                      const showSources = walletUsed > 0 || walletCredited > 0;
                                      return showSources ? (
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                            <Wallet className="h-3.5 w-3.5" /> Payment Sources
                                          </p>
                                          <div className="rounded-lg overflow-hidden border border-border/30">
                                            <table className="w-full text-xs">
                                              <tbody>
                                                {walletUsed > 0 && (
                                                  <tr className="border-b border-border/20">
                                                    <td className="py-2 px-3 flex items-center gap-1.5 text-muted-foreground">
                                                      <Wallet className="h-3 w-3" /> Wallet
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-medium text-blue-500">{formatINR(walletUsed)}</td>
                                                  </tr>
                                                )}
                                                {cashPaid > 0 && (
                                                  <tr className={walletCredited > 0 ? "border-b border-border/20" : ""}>
                                                    <td className="py-2 px-3 text-muted-foreground capitalize">
                                                      {paymentTypeColorMap[col.paymentType]?.label ?? col.paymentType}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-medium">{formatINR(cashPaid)}</td>
                                                  </tr>
                                                )}
                                                {walletCredited > 0 && (
                                                  <tr className="bg-muted/20">
                                                    <td className="py-2 px-3 flex items-center gap-1.5 text-muted-foreground">
                                                      <Wallet className="h-3 w-3" /> Wallet Credit
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-medium text-[var(--success,#22c55e)]">+{formatINR(walletCredited)}</td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      ) : null;
                                    })()}

                                    {/* Invoice breakdown */}
                                    {col.allocations.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                          <FileText className="h-3.5 w-3.5" /> Invoice Breakdown
                                        </p>
                                        <div className="rounded-lg overflow-hidden border border-border/30">
                                          <table className="w-full text-xs">
                                            <thead>
                                              <tr className="border-b border-border/30 bg-muted/30">
                                                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Invoice</th>
                                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Applied</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {col.allocations.map((alloc, i) => (
                                                <tr key={alloc.paymentId} className={`${i < col.allocations.length - 1 ? "border-b border-border/20" : ""}`}>
                                                  <td className="py-2 px-3 text-muted-foreground">{alloc.invoiceNumber || "—"}</td>
                                                  <td className="py-2 px-3 text-right font-medium">{formatINR(alloc.amount)}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}

                                    {col.notes && (
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                        <p className="text-sm">{col.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return rows;
                        })
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {collectionsData?.pagination && collectionsData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between glass-subtle rounded-xl px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {filteredCollections.length} of {collectionsData.pagination.total} collections
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPayPage((p) => Math.max(1, p - 1))} disabled={payPage <= 1}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {payPage} of {collectionsData.pagination.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPayPage((p) => p + 1)} disabled={payPage >= collectionsData.pagination.totalPages}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Collect Modal */}
      <FormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Collect Payment"
        description="Payment will be applied to oldest invoices first"
        className="sm:max-w-md"
      >
        <div className="space-y-4 py-2">
          {formStore && (
            <div className="glass-subtle rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Store</span>
                <span className="text-sm font-medium">{formStore.shopkeeperName}</span>
              </div>
              {formStore.agencyName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Agency</span>
                  <span className="text-sm">{formStore.agencyName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pending Invoices</span>
                <span className="text-sm">{formStore.invoiceCount}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/30 pt-1.5">
                <span className="text-xs font-semibold">Total Outstanding</span>
                <span className="font-bold text-destructive">{formatINR(formStore.totalDue)}</span>
              </div>
              {formStore.walletBalance > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Wallet Balance</span>
                  <span className="text-sm font-medium text-[var(--success,#22c55e)]">{formatINR(formStore.walletBalance)}</span>
                </div>
              )}
            </div>
          )}

          {/* Use Wallet Balance */}
          {walletAvailable > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
              <Checkbox
                id="use-wallet"
                checked={useWallet}
                onCheckedChange={(v) => handleWalletToggle(!!v)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <label htmlFor="use-wallet" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                  Use Wallet Balance
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Apply {formatINR(Math.min(walletAvailable, formStore?.totalDue ?? 0))} from wallet towards this payment
                </p>
              </div>
            </div>
          )}

          {/* Payment breakdown when wallet is used alongside cash */}
          {useWallet && walletApplied > 0 && (
            <div className="rounded-lg border border-border/40 overflow-hidden text-sm">
              <div className="flex items-center justify-between px-3 py-2 bg-muted/20">
                <span className="text-muted-foreground text-xs">Cash to collect</span>
                <span className="font-medium">{formatINR(cashAmount)}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-t border-border/30">
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <Wallet className="h-3 w-3" /> Wallet applied
                </span>
                <span className="font-medium text-[var(--success,#22c55e)]">+ {formatINR(walletApplied)}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-muted/40">
                <span className="text-xs font-semibold">Total payment</span>
                <span className="font-bold">{formatINR(totalPayment)}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">
              {useWallet && walletApplied > 0 ? "Cash Amount (INR)" : "Amount (INR)"}
            </Label>
            <Input
              id="pay-amount"
              type="number"
              placeholder="Enter amount"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              min={0}
            />
            {useWallet && walletApplied > 0 && cashAmount === 0 && (
              <p className="text-xs text-muted-foreground">
                Entire outstanding covered by wallet — no cash needed
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-type">Payment Method</Label>
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger id="pay-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offline">Cash (Offline)</SelectItem>
                <SelectItem value="online">Online (UPI / Bank Transfer)</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-notes">Notes (optional)</Label>
            <Textarea
              id="pay-notes"
              placeholder="Any additional notes..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
              onClick={handleFormSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Collect Payment"}
            </Button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
