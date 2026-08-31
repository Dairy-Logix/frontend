import type { Invoice } from "@/lib/types";

/**
 * WhatsApp-formatted invoice text — the full invoice as a chat message
 * (*bold* is WhatsApp markup). Internal notes are intentionally excluded.
 */

const STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  partially_paid: "Partially Paid",
};

function inr(amount: number | undefined): string {
  return `₹${(amount ?? 0).toLocaleString("en-IN")}`;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function buildInvoiceWhatsAppMessage(
  invoice: Invoice,
  tenantName?: string
): string {
  const lines: string[] = [];

  if (tenantName) lines.push(`*${tenantName}*`);
  lines.push(`*Invoice ${invoice.invoiceNumber}*`);
  lines.push(`Date: ${fmtDate(invoice.issuedAt)}`);
  if (invoice.dueDate) lines.push(`Due Date: ${fmtDate(invoice.dueDate)}`);
  lines.push(`Status: ${STATUS_LABELS[invoice.status] ?? invoice.status}`);
  lines.push("");
  lines.push(`*Bill To:* ${invoice.shopkeeperName || "—"}`);

  if (invoice.items.length > 0) {
    lines.push("");
    lines.push("*Items:*");
    invoice.items.forEach((item, i) => {
      const qtyPerUnit = item.quantityPerUnit ?? 1;
      const piecePrice = item.unitPrice ?? 0;
      const linePrice = item.pricePerUnit ?? piecePrice * qtyPerUnit;
      lines.push(`${i + 1}. ${item.productName || "Unknown Product"}`);
      lines.push(
        `    ${item.quantity} × ${inr(linePrice)} = ${inr(item.totalPrice)}`
      );
    });
  }

  const adjustments = invoice.adjustments ?? [];
  if (adjustments.length > 0) {
    lines.push("");
    lines.push("*Adjustments:*");
    for (const adj of adjustments) {
      lines.push(
        `${adj.type === "transfer_in" ? "Transfer In" : "Transfer Out"} (${adj.transferNumber}, ${adj.counterpartyShopkeeperName}): ${inr(adj.amount)}`
      );
    }
  }

  lines.push("");
  lines.push(`Subtotal: ${inr(invoice.subtotal)}`);
  lines.push(`*Total: ${inr(invoice.totalAmount)}*`);
  lines.push(`Paid: ${inr(invoice.paidAmount)}`);
  lines.push(`*Amount Due: ${inr(invoice.dueAmount)}*`);

  return lines.join("\n");
}
