import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice, Tenant } from "@/lib/types";
import { getLogoUrl } from "@/lib/utils";
import { lineUnitPrice } from "./invoice-item-pricing";

/**
 * Client-side generator for the branded invoice PDF — the downloadable /
 * WhatsApp-shareable artifact. Mirrors the shared PrintSheet format: tenant
 * logo + company header, meta block, Bill To, item tables, payment summary,
 * branded footer. Amounts use "INR" (jsPDF's built-in fonts have no ₹ glyph).
 */

const STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  partially_paid: "Partially Paid",
};

const MARGIN = 14;
const PAGE_W = 210;

function inr(amount: number | undefined): string {
  return `INR ${(amount ?? 0).toLocaleString("en-IN")}`;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Resolve the tenant logo to a data URI jsPDF can embed; null on failure. */
async function logoDataUri(tenant?: Tenant | null): Promise<string | null> {
  const url = getLogoUrl(tenant?.logo);
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateInvoicePdf(
  invoice: Invoice,
  tenant?: Tenant | null
): Promise<{ blob: Blob; filename: string }> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const title = `Invoice ${invoice.invoiceNumber}`;
  const tenantName = tenant?.name ?? "";

  // --- Header: logo + company + title, right-aligned meta ---
  const logo = await logoDataUri(tenant);
  if (logo) {
    try {
      doc.addImage(logo, logo.includes("image/png") ? "PNG" : "JPEG", 14, 12, 14, 14);
    } catch {
      // unsupported image format — header still works without the logo
    }
  }
  const textX = logo ? 32 : MARGIN;
  doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(0);
  doc.text(tenantName, textX, 18);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(90);
  doc.text(title, textX, 24);

  const meta: [string, string][] = [
    ["Invoice No", invoice.invoiceNumber],
    ["Invoice Date", fmtDate(invoice.issuedAt)],
    ...(invoice.dueDate
      ? ([["Due Date", fmtDate(invoice.dueDate)]] as [string, string][])
      : []),
    ["Status", STATUS_LABELS[invoice.status] ?? invoice.status],
  ];
  doc.setFontSize(8);
  meta.forEach(([label, value], i) => {
    const y = 14 + i * 4.2;
    doc.setFont("helvetica", "bold").setTextColor(0);
    const valueW = doc.getTextWidth(value);
    doc.setFont("helvetica", "normal").setTextColor(40);
    doc.text(value, PAGE_W - MARGIN - valueW, y);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, PAGE_W - MARGIN - valueW - doc.getTextWidth(`${label}: `), y);
  });

  doc.setDrawColor(0).setLineWidth(0.5);
  doc.line(MARGIN, 30, PAGE_W - MARGIN, 30);

  // --- Bill To ---
  let y = 38;
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(0);
  doc.text("Bill To", MARGIN, y);
  y += 5;
  doc.setFontSize(10);
  doc.text(invoice.shopkeeperName || "—", MARGIN, y);
  const orderRef =
    (invoice as Invoice & { orderNumber?: string }).orderNumber ||
    invoice.orderId;
  if (orderRef) {
    y += 4.5;
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(70);
    doc.text(`Order ref: ${orderRef}`, MARGIN, y);
  }
  y += 6;

  const tableTheme = {
    theme: "grid" as const,
    styles: { fontSize: 8, textColor: 0, lineColor: 200, cellPadding: 1.6 },
    headStyles: {
      fillColor: [241, 241, 241] as [number, number, number],
      textColor: 0,
      fontStyle: "bold" as const,
    },
    margin: { left: MARGIN, right: MARGIN },
  };
  const right = { halign: "right" as const };

  // --- Items ---
  if (invoice.items.length > 0) {
    autoTable(doc, {
      ...tableTheme,
      startY: y,
      head: [["#", "Product", "Qty", "Unit Price", "Amount"]],
      body: invoice.items.map((item, i) => [
        String(i + 1),
        item.productName || "Unknown Product",
        String(item.quantity),
        inr(lineUnitPrice(item)),
        inr(item.totalPrice),
      ]),
      columnStyles: { 2: right, 3: right, 4: right },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 8;
  }

  // --- Transfer adjustments ---
  const adjustments = invoice.adjustments ?? [];
  if (adjustments.length > 0) {
    autoTable(doc, {
      ...tableTheme,
      startY: y,
      head: [["Transfer", "Type", "Counterparty", "Amount"]],
      body: adjustments.map((adj) => [
        adj.transferNumber,
        adj.type === "transfer_in" ? "Transfer In" : "Transfer Out",
        adj.counterpartyShopkeeperName,
        inr(adj.amount),
      ]),
      columnStyles: { 3: right },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 8;
  }

  // --- Payment summary ---
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    tableWidth: 80,
    margin: { left: PAGE_W - MARGIN - 80 },
    body: [
      ["Subtotal", inr(invoice.subtotal)],
      ["Total Amount", inr(invoice.totalAmount)],
      ["Paid", inr(invoice.paidAmount)],
      ["Amount Due", inr(invoice.dueAmount)],
    ],
    columnStyles: { 0: { fontStyle: "bold" }, 1: right },
  });

  // --- Footer on every page ---
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200).setLineWidth(0.2);
    doc.line(MARGIN, h - 12, PAGE_W - MARGIN, h - 12);
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(120);
    doc.text(
      `${tenantName} · ${title} · Generated with BeatMitra`,
      PAGE_W / 2,
      h - 8,
      { align: "center" }
    );
  }

  return {
    blob: doc.output("blob"),
    filename: `${invoice.invoiceNumber}.pdf`,
  };
}

/**
 * Open the PDF in a new browser tab (Chrome's viewer) instead of forcing a
 * download — the viewer's own controls handle saving and printing.
 */
export function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  // Revoke later: revoking immediately would break the freshly opened tab.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
