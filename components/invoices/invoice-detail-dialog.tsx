"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Store,
  IndianRupee,
  CreditCard,
  Download,
  MessageCircle,
  Calendar,
  Package,
  PlusCircle,
  MinusCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormModal } from "@/components/shared/form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useInvoice, useRecordPayment } from "@/lib/hooks/use-invoices";
import { useShopkeeper } from "@/lib/hooks/use-shopkeepers";
import {
  generateInvoicePdf,
  downloadBlob,
  shareInvoicePdfViaWhatsApp,
} from "@/components/invoices/invoice-pdf";
import { useTenantStore } from "@/lib/stores/tenant-store";
import type { InvoiceAdjustment, InvoiceAdjustmentItem } from "@/lib/types";

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

function formatINR(amount: number | undefined): string {
  return `INR ${(amount ?? 0).toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface InvoiceDetailDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailDialog({
  invoiceId,
  open,
  onOpenChange,
}: InvoiceDetailDialogProps) {
  const { data: invoice, isLoading, error } = useInvoice(invoiceId ?? "");

  // Store record for the WhatsApp number (invoice payload has no phone)
  const { data: shop } = useShopkeeper(invoice?.shopId ?? "");
  const tenant = useTenantStore((s) => s.tenant);

  const recordPaymentMutation = useRecordPayment();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  // --- Handlers ---

  function handleRecordPayment() {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    if (invoice && amount > invoice.dueAmount) {
      toast.error("Payment amount cannot exceed due amount");
      return;
    }
    if (!invoiceId) return;
    recordPaymentMutation.mutate(
      { id: invoiceId, amountPaid: amount },
      {
        onSuccess: () => {
          setPaymentOpen(false);
          setPaymentAmount("");
        },
      }
    );
  }

  async function handleDownloadPDF() {
    if (!invoice) return;
    const { blob, filename } = await generateInvoicePdf(invoice, tenant);
    downloadBlob(blob, filename);
  }

  async function handleShareWhatsApp() {
    if (!invoice) return;
    const message = `Invoice ${invoice.invoiceNumber}\nStore: ${invoice.shopkeeperName}\nTotal: ${formatINR(invoice.totalAmount)}\nDue: ${formatINR(invoice.dueAmount)}`;
    const result = await shareInvoicePdfViaWhatsApp(
      invoice,
      tenant,
      shop?.phone,
      message
    );
    if (result === "fallback") {
      toast.info(
        shop?.phone
          ? "PDF downloaded — attach it in the WhatsApp chat that just opened."
          : "PDF downloaded — no phone on file for this store, pick a contact in WhatsApp and attach it."
      );
    }
  }

  const canRecordPayment =
    invoice &&
    (invoice.status === "unpaid" || invoice.status === "partially_paid");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="font-mono">
                {invoice?.invoiceNumber ?? "Invoice"}
              </span>
              {invoice && (
                <StatusBadge
                  status={invoice.status}
                  colorMap={invoiceStatusColorMap}
                />
              )}
              {invoiceId && (
                <Button asChild variant="ghost" size="sm" className="ml-auto mr-4 text-xs text-muted-foreground">
                  <Link href={`/invoices/${invoiceId}`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Full page
                  </Link>
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load invoice. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Not Found */}
          {!isLoading && !error && !invoice && (
            <div className="glass rounded-xl p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-lg font-medium">
                Invoice not found
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                The invoice you are looking for does not exist.
              </p>
            </div>
          )}

          {invoice && (
            <div className="space-y-4">
              {/* Dates + Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Issued: {formatDate(invoice.issuedAt)}
                  </span>
                  {invoice.dueDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Due: {formatDate(invoice.dueDate)}
                    </span>
                  )}
                  {invoice.paidAt && (
                    <span className="inline-flex items-center gap-1.5 text-[var(--success)]">
                      <Calendar className="h-3.5 w-3.5" />
                      Paid: {formatDate(invoice.paidAt)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canRecordPayment && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                      onClick={() => {
                        setPaymentAmount("");
                        setPaymentOpen(true);
                      }}
                    >
                      <CreditCard className="h-4 w-4" />
                      Record Payment
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
                    <MessageCircle className="h-4 w-4" />
                    Share via WhatsApp
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Store Info + Items + Adjustments */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Store Info Card */}
                  {invoice.shopkeeperName && (
                    <div className="glass rounded-xl p-4">
                      <h2 className="text-sm font-medium text-muted-foreground mb-3">
                        Store Information
                      </h2>
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                          <Store className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold">{invoice.shopkeeperName}</h3>
                          {invoice.orderId && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <span className="font-mono text-xs">
                                Order ref: {invoice.order?.orderNumber || invoice.orderId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items Table — hide entirely when invoice was created from a transfer (no original items) */}
                  {invoice.items.length > 0 && (
                    <div className="glass rounded-xl overflow-hidden">
                      <div className="p-4 pb-0">
                        <h2 className="text-sm font-medium text-muted-foreground mb-3">
                          Invoice Items
                        </h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/50">
                              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">
                                Product
                              </th>
                              <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">
                                Code
                              </th>
                              <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">
                                Qty
                              </th>
                              <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                                Unit Price
                              </th>
                              <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.items.map((item, index) => {
                              const qtyPerUnit = item.quantityPerUnit ?? 1;
                              const isPiece = qtyPerUnit <= 1;
                              const piecePrice = item.unitPrice ?? 0;
                              const linePrice = item.pricePerUnit ?? piecePrice * qtyPerUnit;
                              return (
                                <tr
                                  key={item.id || index}
                                  className="border-b border-border/30 last:border-0"
                                >
                                  <td className="py-2.5 px-4">
                                    <div className="flex items-center gap-2">
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {item.productName || item.product?.name || "Unknown Product"}
                                      </span>
                                    </div>
                                    {!isPiece && (
                                      <p className="text-[11px] text-muted-foreground mt-0.5 ml-6">
                                        {qtyPerUnit} pcs × ₹{piecePrice.toLocaleString("en-IN")} = ₹{linePrice.toLocaleString("en-IN")}/crate
                                      </p>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs">
                                    {item.productCode || item.product?.productCode || "—"}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                                  <td className="py-2.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <IndianRupee className="h-3 w-3 text-muted-foreground" />
                                      {(isPiece ? piecePrice : linePrice).toLocaleString("en-IN")}
                                    </div>
                                    {!isPiece && (
                                      <span className="block text-[11px] text-muted-foreground">/crate</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-semibold">
                                    <div className="flex items-center justify-end gap-1">
                                      <IndianRupee className="h-3 w-3 text-muted-foreground" />
                                      {(item.totalPrice ?? 0).toLocaleString("en-IN")}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Adjustments (transfers in / out) */}
                  {invoice.adjustments && invoice.adjustments.length > 0 && (
                    <div className="glass rounded-xl overflow-hidden">
                      <div className="p-4 pb-3">
                        <h2 className="text-sm font-medium text-muted-foreground">
                          Adjustments
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                          Items added to or returned from this invoice after it was issued.
                          Counterparty information is for internal admin reference only —
                          it is not shown on the customer-facing invoice or PDF.
                        </p>
                      </div>
                      <div className="px-4 pb-4 space-y-4">
                        {invoice.adjustments.map((adj: InvoiceAdjustment, idx: number) => {
                          const isIn = adj.type === "transfer_in";
                          return (
                            <div
                              key={idx}
                              className="rounded-lg border border-border/50 overflow-hidden"
                            >
                              <div
                                className={`px-4 py-2.5 flex items-center justify-between text-sm ${
                                  isIn
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isIn ? (
                                    <PlusCircle className="h-4 w-4" />
                                  ) : (
                                    <MinusCircle className="h-4 w-4" />
                                  )}
                                  <div>
                                    <div className="font-medium">
                                      {isIn ? "Additional items added" : "Items removed"}
                                    </div>
                                    <div className="text-[11px] opacity-80 mt-0.5">
                                      {isIn ? "From" : "To"}:{" "}
                                      <span className="font-medium">
                                        {adj.counterpartyShopkeeperName || "—"}
                                      </span>
                                      {adj.transferNumber && (
                                        <span className="ml-2 font-mono">
                                          ({adj.transferNumber})
                                        </span>
                                      )}
                                      <span className="ml-2">· {formatDate(adj.date)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 font-semibold">
                                  <IndianRupee className="h-3 w-3" />
                                  {Math.abs(adj.amount ?? 0).toLocaleString("en-IN")}
                                </div>
                              </div>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border/30 text-xs text-muted-foreground">
                                    <th className="text-left py-2 px-4 font-medium">Product</th>
                                    <th className="text-center py-2 px-3 font-medium">Qty</th>
                                    <th className="text-right py-2 px-3 font-medium">Unit Price</th>
                                    <th className="text-right py-2 px-4 font-medium">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(adj.items || []).map((item: InvoiceAdjustmentItem, i: number) => (
                                    <tr
                                      key={i}
                                      className="border-b border-border/20 last:border-0"
                                    >
                                      <td className="py-2 px-4">
                                        <div className="flex items-center gap-2">
                                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span>{item.productName}</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 ml-5 font-mono">
                                          {item.productCode}
                                        </p>
                                      </td>
                                      <td className="py-2 px-3 text-center">{item.quantity}</td>
                                      <td className="py-2 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <IndianRupee className="h-3 w-3 text-muted-foreground" />
                                          {(item.price ?? 0).toLocaleString("en-IN")}
                                        </div>
                                      </td>
                                      <td className="py-2 px-4 text-right font-medium">
                                        <div className="flex items-center justify-end gap-1">
                                          <IndianRupee className="h-3 w-3 text-muted-foreground" />
                                          {(item.subtotal ?? 0).toLocaleString("en-IN")}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Summary + Notes + Timeline */}
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="glass rounded-xl p-4">
                    <h2 className="text-sm font-medium text-muted-foreground mb-3">
                      Invoice Summary
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatINR(invoice.subtotal)}</span>
                      </div>
                      <div className="border-t border-border/50 pt-3 flex items-center justify-between text-base font-semibold">
                        <span>Total</span>
                        <span>{formatINR(invoice.totalAmount)}</span>
                      </div>
                      <div className="border-t border-border/50 pt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[var(--success)]">Paid Amount</span>
                          <span className="text-[var(--success)] font-semibold">
                            {formatINR(invoice.paidAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span
                            className={
                              invoice.dueAmount > 0
                                ? "text-[var(--destructive)]"
                                : "text-muted-foreground"
                            }
                          >
                            Due Amount
                          </span>
                          <span
                            className={
                              invoice.dueAmount > 0
                                ? "text-[var(--destructive)] font-semibold"
                                : "text-muted-foreground font-semibold"
                            }
                          >
                            {formatINR(invoice.dueAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Card */}
                  {invoice.notes && (
                    <div className="glass rounded-xl p-4">
                      <h2 className="text-sm font-medium text-muted-foreground mb-2">
                        Notes
                      </h2>
                      <p className="text-sm leading-relaxed">{invoice.notes}</p>
                    </div>
                  )}

                  {/* Timeline Card */}
                  <div className="glass rounded-xl p-4">
                    <h2 className="text-sm font-medium text-muted-foreground mb-3">
                      Timeline
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-muted-foreground">Created</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatDateTime(invoice.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                        <span className="text-muted-foreground">Issued</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatDateTime(invoice.issuedAt)}
                        </span>
                      </div>
                      {invoice.status === "partially_paid" && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-muted-foreground">Partial Payment</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formatDateTime(invoice.updatedAt)}
                          </span>
                        </div>
                      )}
                      {invoice.paidAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="h-2 w-2 rounded-full bg-[var(--success)] shrink-0" />
                          <span className="text-muted-foreground">Paid</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formatDateTime(invoice.paidAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      {invoice && (
        <FormModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          title="Record Payment"
          description={`Record a payment for invoice ${invoice.invoiceNumber}`}
          className="sm:max-w-md"
        >
          <div className="space-y-4 py-2">
            {/* Due amount info */}
            <div className="glass-subtle rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Outstanding Due</span>
                <span className="font-semibold text-[var(--destructive)]">
                  {formatINR(invoice.dueAmount)}
                </span>
              </div>
            </div>

            {/* Payment amount */}
            <div className="space-y-1.5">
              <Label htmlFor="dialog-payment-amount">Payment Amount (INR)</Label>
              <Input
                id="dialog-payment-amount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min={1}
                max={invoice.dueAmount}
              />
            </div>

            {/* Quick fill */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaymentAmount(invoice.dueAmount.toString())}
                className="text-xs"
              >
                Full Amount
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPaymentAmount(Math.round(invoice.dueAmount / 2).toString())
                }
                className="text-xs"
              >
                Half Amount
              </Button>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setPaymentOpen(false)}
                disabled={recordPaymentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                onClick={handleRecordPayment}
                disabled={recordPaymentMutation.isPending}
              >
                {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </div>
        </FormModal>
      )}
    </>
  );
}
