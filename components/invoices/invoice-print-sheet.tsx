"use client";

import {
  PrintSheet,
  PrintSection,
  PrintTable,
} from "@/components/shared/print-sheet";
import type { Invoice } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  partially_paid: "Partially Paid",
};

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

/**
 * The customer-facing printable invoice, shared by the invoice detail page
 * and the invoice preview dialog. Renders the branded PrintSheet (tenant
 * logo/name header + footer); call printDocument() to print/save as PDF.
 * Internal notes are intentionally excluded.
 */
export function InvoicePrintSheet({ invoice }: { invoice: Invoice }) {
  const orderRef =
    (invoice as Invoice & { orderNumber?: string }).orderNumber ||
    invoice.orderId;

  return (
    <PrintSheet
      title={`Invoice ${invoice.invoiceNumber}`}
      meta={[
        { label: "Invoice No", value: invoice.invoiceNumber },
        { label: "Invoice Date", value: formatDate(invoice.issuedAt) },
        ...(invoice.dueDate
          ? [{ label: "Due Date", value: formatDate(invoice.dueDate) }]
          : []),
        {
          label: "Status",
          value: STATUS_LABELS[invoice.status] ?? invoice.status,
        },
      ]}
    >
      <PrintSection title="Bill To">
        <div>
          <b>{invoice.shopkeeperName || "—"}</b>
          {orderRef ? <div>Order ref: {orderRef}</div> : null}
        </div>
      </PrintSection>
      {invoice.items.length > 0 && (
        <PrintTable
          title="Invoice Items"
          headers={["#", "Product", "Qty", "Unit Price", "Amount"]}
          align={["l", "l", "r", "r", "r"]}
          rows={invoice.items.map((item, i) => {
            const qtyPerUnit = item.quantityPerUnit ?? 1;
            const piecePrice = item.unitPrice ?? 0;
            const linePrice = item.pricePerUnit ?? piecePrice * qtyPerUnit;
            return [
              i + 1,
              item.productName || "Unknown Product",
              item.quantity,
              formatINR(linePrice),
              formatINR(item.totalPrice),
            ];
          })}
        />
      )}
      {(invoice.adjustments ?? []).length > 0 && (
        <PrintTable
          title="Transfer Adjustments"
          headers={["Transfer", "Type", "Counterparty", "Amount"]}
          align={["l", "l", "l", "r"]}
          rows={(invoice.adjustments ?? []).map((adj) => [
            adj.transferNumber,
            adj.type === "transfer_in" ? "Transfer In" : "Transfer Out",
            adj.counterpartyShopkeeperName,
            formatINR(adj.amount),
          ])}
        />
      )}
      <PrintTable
        title="Payment Summary"
        headers={["", "Amount"]}
        align={["l", "r"]}
        rows={[
          ["Subtotal", formatINR(invoice.subtotal)],
          ["Total Amount", formatINR(invoice.totalAmount)],
          ["Paid", formatINR(invoice.paidAmount)],
          ["Amount Due", formatINR(invoice.dueAmount)],
        ]}
      />
    </PrintSheet>
  );
}
