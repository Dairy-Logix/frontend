"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { invoiceService } from "@/lib/api/services/invoice.service";
import {
  generateInvoicePdf,
  openBlobInNewTab,
} from "@/components/invoices/invoice-pdf";
import { lineUnitPrice } from "@/components/invoices/invoice-item-pricing";
import { getLogoUrl } from "@/lib/utils";
import type { Tenant } from "@/lib/types";

/**
 * Public invoice share page (/i/<token>) — what a shopkeeper opens from the
 * WhatsApp link. No login: the unguessable token is the credential. Shows the
 * invoice and offers the branded PDF download.
 */

const STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  partially_paid: "Partially Paid",
};

function inr(amount: number | undefined): string {
  return `₹${(amount ?? 0).toLocaleString("en-IN")}`;
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SharedInvoicePage() {
  const params = useParams();
  const token = params.token as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["shared-invoice", token],
    queryFn: async () => {
      const response = await invoiceService.getSharedInvoice(token);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Invoice not found");
      }
      return response.data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  async function handleDownload() {
    if (!data) return;
    const { blob } = await generateInvoicePdf(
      data.invoice,
      { name: data.tenant.name, logo: data.tenant.logo ?? undefined } as Tenant
    );
    openBlobInNewTab(blob);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-2">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="text-lg font-medium">Invoice not found</p>
          <p className="text-sm text-muted-foreground">
            This link may be invalid or no longer available.
          </p>
        </div>
      </div>
    );
  }

  const { invoice, tenant } = data;
  const logo = getLogoUrl(tenant.logo);

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt=""
                  className="h-12 w-12 rounded-lg object-contain"
                />
              )}
              <div>
                <h1 className="text-xl font-bold">{tenant.name}</h1>
                <p className="text-sm text-muted-foreground font-mono">
                  {invoice.invoiceNumber}
                </p>
              </div>
            </div>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Invoice Date</div>
              <div className="font-medium">{fmtDate(invoice.issuedAt)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Due Date</div>
              <div className="font-medium">{fmtDate(invoice.dueDate)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="font-medium">
                {STATUS_LABELS[invoice.status] ?? invoice.status}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Bill To</div>
              <div className="font-medium truncate">
                {invoice.shopkeeperName || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        {invoice.items.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-3">Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 pr-2 font-medium">Product</th>
                    <th className="text-right py-2 px-2 font-medium">Qty</th>
                    <th className="text-right py-2 px-2 font-medium">
                      Unit Price
                    </th>
                    <th className="text-right py-2 pl-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, i) => {
                    const linePrice = lineUnitPrice(item);
                    return (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 pr-2 font-medium">
                          {item.productName || "Unknown Product"}
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">
                          {inr(linePrice)}
                        </td>
                        <td className="py-2 pl-2 text-right tabular-nums">
                          {inr(item.totalPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-1.5 text-sm max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{inr(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{inr(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span className="tabular-nums">{inr(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-border pt-1.5">
              <span>Amount Due</span>
              <span className="tabular-nums">{inr(invoice.dueAmount)}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {tenant.name} · Generated with BeatMitra
        </p>
      </div>
    </div>
  );
}
