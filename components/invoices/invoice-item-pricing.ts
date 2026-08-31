import type { Invoice } from "@/lib/types";

type Item = Invoice["items"][number];

/**
 * Per-line unit price for customer-facing artifacts (PDF, WhatsApp text,
 * share page). Prefers the explicit per-unit price; when legacy items carry
 * price fields of 0, falls back to amount / quantity so the artifact never
 * shows a 0 unit price next to a non-zero amount.
 */
export function lineUnitPrice(item: Item): number {
  const qtyPerUnit = item.quantityPerUnit ?? 1;
  const explicit = item.pricePerUnit || (item.unitPrice || 0) * qtyPerUnit;
  if (explicit > 0) return explicit;
  return item.quantity > 0 ? (item.totalPrice || 0) / item.quantity : 0;
}
