"use client";

import { useState, useMemo } from "react";
import { todayIST } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee,
  Plus,
  Calendar,
  Factory,
  FileText,
  Wallet,
  TrendingUp,
  CreditCard,
  Loader2 as LoaderIcon,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { FormModal } from "@/components/shared/form-modal";
import { SearchInput } from "@/components/shared/search-input";
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

import type { FactoryPayment } from "@/lib/types";
import { useFactoryPayments, useCreateFactoryPayment, useFactoryOrders } from "@/lib/hooks/use-factory";

// --- Factory Names ---

const FACTORY_NAMES = ["Gujarat Dairy Co-op", "Amul Processing Unit"];

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

function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

// --- Main Page ---

export default function FactoryPaymentsPage() {
  // Filter state
  const [search, setSearch] = useState("");
  const [factoryFilter, setFactoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch factory orders for lookups
  const { data: factoryOrdersData } = useFactoryOrders({ pageSize: 200 });
  const factoryOrders = useMemo(() => factoryOrdersData?.data ?? [], [factoryOrdersData]);

  // PO number lookup
  function getPONumber(factoryOrderId?: string): string {
    if (!factoryOrderId) return "-";
    return factoryOrders.find((o: any) => o.id === factoryOrderId)?.poNumber ?? "-";
  }

  // Data fetching with real API
  const {
    data: paymentsData,
    isLoading,
    error,
    refetch,
  } = useFactoryPayments({
    page,
    pageSize,
    factoryName: factoryFilter !== "all" ? factoryFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // Mutations
  const createFactoryPayment = useCreateFactoryPayment();

  const payments = paymentsData?.data || [];

  // Record Payment modal
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formFactoryName, setFormFactoryName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formReferenceNumber, setFormReferenceNumber] = useState("");
  const [formLinkedPO, setFormLinkedPO] = useState("none");
  const [formNotes, setFormNotes] = useState("");

  // Note: Server-side filtering is already handled via API params
  const filteredPayments = payments;

  // --- Stats ---

  const stats = useMemo(() => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // Outstanding = total of fulfilled/confirmed factory orders minus total payments
    const totalOrderValue = factoryOrders
      .filter((o: any) => o.status === "fulfilled" || o.status === "confirmed")
      .reduce((sum: number, o: any) => sum + (o.totalAmount ?? 0), 0);
    const outstanding = Math.max(0, totalOrderValue - totalPaid);

    const thisMonthPayments = payments
      .filter((p) => isThisMonth(p.paymentDate))
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalPaid, outstanding, thisMonthPayments };
  }, [payments, factoryOrders]);

  // --- Form handlers ---

  function openCreateModal() {
    setFormFactoryName(FACTORY_NAMES[0]);
    setFormAmount("");
    setFormDate(todayIST());
    setFormReferenceNumber("");
    setFormLinkedPO("none");
    setFormNotes("");
    setFormOpen(true);
  }

  function handleFormSubmit() {
    if (!formFactoryName) {
      toast.error("Please select a factory");
      return;
    }
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!formDate) {
      toast.error("Please select a payment date");
      return;
    }

    setIsSubmitting(true);

    const input = {
      factoryOrderId: formLinkedPO !== "none" ? formLinkedPO : undefined,
      factoryName: formFactoryName,
      amount: Number(formAmount),
      paymentDate: new Date(formDate).toISOString(),
      referenceNumber: formReferenceNumber || undefined,
      notes: formNotes || undefined,
    };

    createFactoryPayment.mutate(input, {
      onSuccess: () => {
        setFormOpen(false);
        setIsSubmitting(false);
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });
  }

  // Available POs for selected factory
  const availablePOs = useMemo(() => {
    if (!formFactoryName) return [];
    return factoryOrders.filter(
      (o: any) =>
        o.factoryName === formFactoryName &&
        (o.status === "confirmed" || o.status === "fulfilled")
    );
  }, [formFactoryName, factoryOrders]);

  // --- Loading State ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading factory payments...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Factory Payments"
          description="Track payments to factories"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load factory payments. {error.message}</span>
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
        title="Factory Payments"
        description="Track payments to factories"
        action={
          <Button
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            onClick={openCreateModal}
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Paid"
          value={formatINR(stats.totalPaid)}
          description="All time factory payments"
          icon={Wallet}
        />
        <StatCard
          title="Outstanding"
          value={formatINR(stats.outstanding)}
          description="Confirmed & fulfilled POs"
          icon={IndianRupee}
        />
        <StatCard
          title="This Month's Payments"
          value={formatINR(stats.thisMonthPayments)}
          description="Payments in current month"
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Filter Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-subtle rounded-xl p-4"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by factory, reference, PO..."
              className="flex-1"
            />
            <Select value={factoryFilter} onValueChange={setFactoryFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="All Factories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Factories</SelectItem>
                {FACTORY_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From date"
                className="flex-1"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To date"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Payment List Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Factory
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  PO Reference
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Reference Number
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredPayments.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={6} className="py-12 text-center">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground text-lg font-medium">
                        No payments found
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Try adjusting your filters or record a new payment.
                      </p>
                    </td>
                  </motion.tr>
                ) : (
                  filteredPayments.map((payment, index) => (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="border-b border-border/30 last:border-0 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatDate(payment.paymentDate)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Factory className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{payment.factoryName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs">
                            {getPONumber(payment.factoryOrderId)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 font-semibold">
                          <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                          {payment.amount.toLocaleString("en-IN")}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-muted-foreground">
                          {payment.referenceNumber ?? "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
                          {payment.notes ?? "-"}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {paymentsData?.pagination && (
        <div className="flex items-center justify-between glass-subtle rounded-xl px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {filteredPayments.length} of {paymentsData.pagination.total ?? payments.length} payments
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {paymentsData.pagination.totalPages || 1}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= (paymentsData.pagination.totalPages || 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <FormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Record Payment"
        description="Record a payment made to a factory"
        className="sm:max-w-lg"
      >
        <div className="space-y-4 py-2">
          {/* Factory */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-factory">Factory</Label>
            <Select
              value={formFactoryName}
              onValueChange={(val) => {
                setFormFactoryName(val);
                setFormLinkedPO("none");
              }}
            >
              <SelectTrigger id="pay-factory" className="w-full">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {FACTORY_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Amount (INR)</Label>
            <Input
              id="pay-amount"
              type="number"
              placeholder="0"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-date">Payment Date</Label>
            <Input
              id="pay-date"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </div>

          {/* Reference Number */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-ref">Reference Number</Label>
            <Input
              id="pay-ref"
              placeholder="e.g. NEFT-GDC-20260210-001"
              value={formReferenceNumber}
              onChange={(e) => setFormReferenceNumber(e.target.value)}
            />
          </div>

          {/* Linked PO */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-po">Linked PO (optional)</Label>
            <Select value={formLinkedPO} onValueChange={setFormLinkedPO}>
              <SelectTrigger id="pay-po" className="w-full">
                <SelectValue placeholder="No linked PO" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linked PO</SelectItem>
                {availablePOs.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.poNumber} - {formatINR(po.totalAmount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-notes">Notes (optional)</Label>
            <Textarea
              id="pay-notes"
              placeholder="Add any notes..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
            />
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
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
