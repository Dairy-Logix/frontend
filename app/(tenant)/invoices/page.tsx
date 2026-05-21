"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  IndianRupee,
  Plus,
  Store,
  Calendar,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Check,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormModal } from "@/components/shared/form-modal";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Invoice } from "@/lib/types";
import {
  useInvoices,
  useGenerateInvoiceFromOrder,
} from "@/lib/hooks";
import { useAgencies } from "@/lib/hooks/use-agencies";
import { useOrders } from "@/lib/hooks/use-orders";
import { todayIST } from "@/lib/utils";
import { useTranslations } from "@/components/providers/intl-provider";

// --- Invoice Status Color Map ---

const invoiceStatusColorMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  unpaid: { label: "Unpaid", variant: "default" },
  paid: { label: "Paid", variant: "success" },
  partially_paid: { label: "Partially Paid", variant: "warning" },
};

// --- Helpers ---

function formatINR(amount: number): string {
  return `INR ${amount.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// --- Main Page ---

export default function InvoicesPage() {
  const tPage = useTranslations("pages.invoices");
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = todayIST();

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [selectedAgencyId, setSelectedAgencyId] = useState(() => searchParams.get("agency") ?? "");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch lookup data from API
  const { data: agenciesData } = useAgencies({ pageSize: 100 });
  const agencies = agenciesData?.data || [];

  // Set initial agency once loaded (if not already set from URL)
  useMemo(() => {
    if (agencies.length > 0 && !selectedAgencyId) {
      setSelectedAgencyId(agencies[0].id);
    }
  }, [agencies, selectedAgencyId]);

  function handleAgencyChange(agencyId: string) {
    setSelectedAgencyId(agencyId);
    setPage(1);
    router.replace(`/invoices?agency=${agencyId}`, { scroll: false });
  }

  function getShopName(invoice: Invoice): string {
    return invoice.shopkeeperName || "Unknown Store";
  }

  // Data fetching with real API
  const {
    data: invoicesData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useInvoices({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    agencyId: selectedAgencyId || undefined,
    startDate: dateFrom || undefined,
    endDate: dateTo || undefined,
  });

  // Mutations
  const generateFromOrder = useGenerateInvoiceFromOrder();

  const invoices = invoicesData?.data || [];

  // Generate invoice modal
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formAgencyId, setFormAgencyId] = useState("");
  const [formSelectedOrderIds, setFormSelectedOrderIds] = useState<string[]>([]);

  // Fetch confirmed orders that need invoicing: no invoice yet, or order updated after invoice was generated
  const { data: ordersData } = useOrders({
    page: 1,
    pageSize: 200,
    agencyId: formAgencyId || undefined,
    status: "confirmed",
    needsInvoice: true,
  });
  const availableOrders = ordersData?.data || [];

  // Note: Filtering is now handled server-side via the API
  const filteredInvoices = invoices;

  // --- Stats (from backend aggregation across full filtered set, not just current page) ---

  const stats = useMemo(() => {
    const totals = invoicesData?.totals;
    return {
      total: invoicesData?.pagination?.total ?? invoices.length,
      paidAmount: totals?.paidAmount ?? 0,
      outstanding: totals?.outstanding ?? 0,
      overdueCount: totals?.overdueCount ?? 0,
    };
  }, [invoicesData, invoices.length]);

  // --- Form handlers ---

  function openCreateModal() {
    setFormAgencyId(agencies[0]?.id ?? "");
    setFormSelectedOrderIds([]);
    setFormOpen(true);
  }

  function handleFormSubmit() {
    if (!formAgencyId) {
      toast.error("Please select an agency");
      return;
    }
    if (formSelectedOrderIds.length === 0) {
      toast.error("Please select at least one order");
      return;
    }

    setIsSubmitting(true);

    Promise.all(formSelectedOrderIds.map((orderId) => generateFromOrder.mutateAsync(orderId)))
      .then(() => {
        const count = formSelectedOrderIds.length;
        toast.success(`Successfully generated ${count} invoice${count > 1 ? "s" : ""}`);
        setFormOpen(false);
        setFormSelectedOrderIds([]);
      })
      .catch(() => {})
      .finally(() => setIsSubmitting(false));
  }

  function toggleOrderSelection(orderId: string) {
    setFormSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  }

  function selectAllOrders() {
    setFormSelectedOrderIds(availableOrders.map((o) => o.id));
  }

  function clearAllOrders() {
    setFormSelectedOrderIds([]);
  }

  // --- Error State ---

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={tPage("title")}
          description={tPage("description")}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load invoices. {error.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Invoices"
        description="Manage and track invoices"
        action={
          <Button
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            onClick={openCreateModal}
          >
            <Plus className="h-4 w-4" />
            Generate Invoice
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Invoices"
          value={stats.total}
          description="All invoices"
          icon={FileText}
        />
        <StatCard
          title="Paid Amount"
          value={formatINR(stats.paidAmount)}
          description="Total amount collected"
          icon={CheckCircle2}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Outstanding Amount"
          value={formatINR(stats.outstanding)}
          description="Pending collection"
          icon={IndianRupee}
        />
        <StatCard
          title="Overdue Count"
          value={stats.overdueCount}
          description="Requires follow-up"
          icon={AlertTriangle}
        />
      </div>

      {/* Agency Tabs */}
      {agencies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass rounded-xl p-1"
        >
          <Tabs
            value={selectedAgencyId}
            onValueChange={handleAgencyChange}
          >
            <TabsList className="w-full bg-muted/30 justify-start p-1">
              {agencies.map((agency) => (
                <TabsTrigger
                  key={agency.id}
                  value={agency.id}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  {agency.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>
      )}

      {/* Filter Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-subtle rounded-xl p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search invoice or store..."
            className="flex-1 min-w-[180px]"
          />
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[155px] shrink-0">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-[136px] h-9 text-sm"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-[136px] h-9 text-sm"
            />
          </div>
          {(search || statusFilter !== "all" || dateFrom !== today || dateTo !== today) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setStatusFilter("all"); setDateFrom(today); setDateTo(today); setPage(1); }}
              className="text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* Invoices Table */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedAgencyId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="glass rounded-xl overflow-hidden"
        >
          {isFetching && !isLoading && (
            <div className="h-0.5 w-full bg-gradient-to-r from-red-500 to-orange-500 animate-pulse" />
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Invoice Number</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Store Name</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Paid</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Due</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                      <p className="text-muted-foreground text-sm">Loading invoices...</p>
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground text-lg font-medium">No invoices found</p>
                      <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or generate a new invoice.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice, index) => (
                    <tr
                      key={invoice.id ?? `invoice-${index}`}
                      className="border-b border-border/30 last:border-0 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => router.push(`/invoices/${invoice.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold font-mono text-xs sm:text-sm">{invoice.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground hidden sm:block" />
                          <span className="font-medium truncate max-w-[150px]">{getShopName(invoice)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 font-semibold">
                          <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                          {(invoice.totalAmount ?? 0).toLocaleString("en-IN")}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        <span className="text-[var(--success)]">{(invoice.paidAmount ?? 0).toLocaleString("en-IN")}</span>
                      </td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        <span className={(invoice.dueAmount ?? 0) > 0 ? "text-[var(--destructive)]" : "text-muted-foreground"}>
                          {(invoice.dueAmount ?? 0).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={invoice.status} colorMap={invoiceStatusColorMap} />
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">{formatDate(invoice.issuedAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => { e.stopPropagation(); router.push(`/invoices/${invoice.id}`); }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {invoicesData?.pagination && (
        <div className="flex items-center justify-between glass-subtle rounded-xl px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {invoices.length} of {invoicesData.pagination.total} invoices
          </p>
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
              Page {page} of {invoicesData.pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (invoicesData.pagination.totalPages || 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      <FormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Generate Invoice"
        description="Select orders to generate invoices from"
        className="sm:max-w-lg"
      >
        <div className="space-y-4 py-2">
          {/* Agency */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-agency">Agency</Label>
            <Select
              value={formAgencyId}
              onValueChange={(val) => {
                setFormAgencyId(val);
                setFormSelectedOrderIds([]);
              }}
            >
              <SelectTrigger id="inv-agency" className="w-full">
                <SelectValue placeholder="Select agency" />
              </SelectTrigger>
              <SelectContent>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Orders - Multi-select */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Orders</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllOrders}
                  disabled={availableOrders.length === 0}
                  className="h-7 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllOrders}
                  disabled={formSelectedOrderIds.length === 0}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
            <div className="glass-subtle rounded-lg p-3 max-h-[260px] overflow-y-auto space-y-2">
              {availableOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {formAgencyId
                    ? "All orders are up-to-date — no new invoices needed"
                    : "Select an agency first"}
                </p>
              ) : (
                availableOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start gap-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleOrderSelection(order.id)}
                  >
                    <Checkbox
                      checked={formSelectedOrderIds.includes(order.id)}
                      onCheckedChange={() => {}}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm font-mono">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          ₹{(order.total ?? 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {order.shopkeeperName} • {order.items?.length ?? 0} items •{" "}
                        {new Date(order.placedAt).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {formSelectedOrderIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {formSelectedOrderIds.length} order{formSelectedOrderIds.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
              onClick={handleFormSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Generating..." : "Generate Invoice"}
            </Button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
