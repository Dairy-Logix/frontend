"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { OpeningWheel, type StockInput } from "./opening-wheel";
import type { MyStoreItem } from "@/lib/api/services/my-store.service";

/**
 * Day tools for My Store: sales history, opening cash / stock, and the
 * close-day -> start-day flow. Everything here is device-local and temporary
 * (kept until the day is reset); nothing is sent to the server.
 */

type Unit = "piece" | "crate";

export interface SaleLine {
  productId: string;
  name: string;
  unit: Unit;
  qty: number;
  price: number;
  total: number;
}

/** One completed sale. `n` is the day's running customer number (#1, #2, ...). */
export interface Sale {
  n: number;
  at: string; // ISO time
  lines: SaleLine[];
  total: number;
  /** Amount the customer handed over; null when the payment step was skipped. */
  received: number | null;
}

export interface Stock {
  crates: number;
  pieces: number;
}

/** Optional start-of-day figures. Absent / null fields mean "not tracked". */
export interface DayInfo {
  openedAt: string;
  openingCash: number | null;
  openingStock: Record<string, Stock>;
}

export interface Opening {
  cash: number | null;
  stock: Record<string, Stock>;
}

export const inr = (v: number) =>
  `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

// ---------- local storage (history lives under its own key) ----------

export const historyKey = (tenantId: string) => `my-store-history:${tenantId}`;

export function loadHistory(key: string): Sale[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Returns false when the browser refused the write (private mode, full, blocked). */
export function saveHistory(key: string, sales: Sale[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(sales));
    return true;
  } catch {
    return false;
  }
}

export function storageAvailable(): boolean {
  try {
    const probe = "my-store-probe";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

// ---------- stock maths (everything converts to pieces) ----------

const perCrate = (item: MyStoreItem) => Math.max(1, item.piecesPerCrate || 1);
const crateCapable = (item: MyStoreItem) => item.category === "Crate" && !!item.cratePrice;
const toBase = (item: MyStoreItem, s: Stock) => s.crates * perCrate(item) + s.pieces;

/** "3 C + 2 P", "5 P", "0"; a leading "−" when negative (sold more than the stock). */
function fmtBase(base: number, item: MyStoreItem): string {
  const rounded = Math.round(base * 100) / 100;
  if (rounded === 0) return "0";
  const sign = rounded < 0 ? "−" : "";
  const abs = Math.abs(rounded);
  if (!crateCapable(item)) return `${sign}${abs} P`;
  const crates = Math.floor(abs / perCrate(item));
  const pieces = Math.round((abs - crates * perCrate(item)) * 100) / 100;
  const parts = [crates ? `${crates} C` : "", pieces ? `${pieces} P` : ""].filter(Boolean);
  return `${sign}${parts.join(" + ")}`;
}

const fmtStock = (s: Stock) =>
  [s.crates ? `${s.crates} C` : "", s.pieces ? `${s.pieces} P` : ""].filter(Boolean).join(" + ") || "0";

/** Cash actually kept from a sale: what was handed over, never more than the bill. */
const cashIn = (s: Sale) => (s.received === null ? s.total : Math.min(s.received, s.total));

interface ProductRow {
  item: MyStoreItem;
  opening: Stock | null;
  soldCrates: number;
  soldPieces: number;
  remainingBase: number | null;
}

function computeDay(items: MyStoreItem[], day: DayInfo | null, sales: Sale[]) {
  const sold = new Map<string, { crates: number; pieces: number }>();
  for (const sale of sales) {
    for (const l of sale.lines) {
      const cur = sold.get(l.productId) ?? { crates: 0, pieces: 0 };
      if (l.unit === "crate") cur.crates += l.qty;
      else cur.pieces += l.qty;
      sold.set(l.productId, cur);
    }
  }
  const rows: ProductRow[] = [];
  for (const item of items) {
    const s = sold.get(item.productId) ?? { crates: 0, pieces: 0 };
    const opening = day?.openingStock?.[item.productId] ?? null;
    if (!opening && !s.crates && !s.pieces) continue;
    rows.push({
      item,
      opening,
      soldCrates: s.crates,
      soldPieces: s.pieces,
      remainingBase: opening
        ? toBase(item, opening) - (s.crates * perCrate(item) + s.pieces)
        : null,
    });
  }
  const salesTotal = sales.reduce((sum, s) => sum + s.total, 0);
  const collected = sales.reduce((sum, s) => sum + cashIn(s), 0);
  return { rows, salesTotal, collected, anyTracked: rows.some((r) => r.opening) };
}

/** Whether there is anything worth showing in a close-day summary. */
export function dayHasData(day: DayInfo | null, sales: Sale[]): boolean {
  return (
    sales.length > 0 ||
    (day?.openingCash ?? null) !== null ||
    Object.keys(day?.openingStock ?? {}).length > 0
  );
}

// ---------- shared pieces ----------

function SalesList({ sales }: { sales: Sale[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (sales.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No sales yet.</p>;
  }
  return (
    <div className="divide-y rounded-xl border">
      {[...sales].reverse().map((s) => {
        const isOpen = open === s.n;
        const diff = s.received === null ? null : Math.round((s.received - s.total) * 100) / 100;
        return (
          <div key={s.n}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : s.n)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
            >
              {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  Customer #{s.n} <span className="font-normal text-muted-foreground">· {timeLabel(s.at)}</span>
                </p>
                {s.received !== null && (
                  <p className="text-xs text-muted-foreground">
                    Received {inr(s.received)}
                    {diff !== null && diff > 0 && ` · change ${inr(diff)}`}
                    {diff !== null && diff < 0 && ` · short ${inr(-diff)}`}
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold">{inr(s.total)}</p>
            </button>
            {isOpen && (
              <div className="space-y-1 bg-muted/40 px-9 py-2 text-sm">
                {s.lines.map((l) => (
                  <div key={`${l.productId}:${l.unit}`} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {l.name} · {l.qty} {l.unit === "crate" ? "C" : "P"} × {inr(l.price)}
                    </span>
                    <span>{inr(l.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-base", strong && "text-xl font-extrabold")}>{value}</span>
    </div>
  );
}

function DaySummary({
  items,
  day,
  sales,
}: {
  items: MyStoreItem[];
  day: DayInfo | null;
  sales: Sale[];
}) {
  const { rows, salesTotal, collected, anyTracked } = useMemo(
    () => computeDay(items, day, sales),
    [items, day, sales],
  );
  const openingCash = day?.openingCash ?? null;
  const notCollected = Math.round((salesTotal - collected) * 100) / 100;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5 rounded-xl border p-3">
        <Figure label="Customers" value={String(sales.length)} />
        <Figure label="Sales total" value={inr(salesTotal)} />
        <Figure label="Cash collected" value={inr(collected)} />
        {notCollected > 0 && <Figure label="Not collected" value={inr(notCollected)} />}
        {openingCash !== null && (
          <>
            <div className="my-1 border-t" />
            <Figure label="Opening cash" value={inr(openingCash)} />
            <Figure label="Cash that should be in hand" value={inr(openingCash + collected)} strong />
          </>
        )}
      </div>

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Product</th>
                {anyTracked && <th className="px-2 py-2 text-right font-medium">Opening</th>}
                <th className="px-2 py-2 text-right font-medium">Sold</th>
                {anyTracked && <th className="px-3 py-2 text-right font-medium">Remaining</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.item.productId}>
                  <td className="px-3 py-2">{r.item.name}</td>
                  {anyTracked && (
                    <td className="px-2 py-2 text-right">{r.opening ? fmtStock(r.opening) : "–"}</td>
                  )}
                  <td className="px-2 py-2 text-right">
                    {fmtStock({ crates: r.soldCrates, pieces: r.soldPieces })}
                  </td>
                  {anyTracked && (
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-semibold",
                        r.remainingBase !== null && r.remainingBase < 0 && "text-red-600 dark:text-red-400",
                      )}
                    >
                      {r.remainingBase === null ? "–" : fmtBase(r.remainingBase, r.item)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- history ----------

export function HistoryDialog({
  sales,
  onClose,
}: {
  sales: Sale[];
  onClose: () => void;
}) {
  const total = sales.reduce((sum, s) => sum + s.total, 0);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Today&apos;s sales</DialogTitle>
          <DialogDescription>
            {sales.length} {sales.length === 1 ? "customer" : "customers"} · {inr(total)}. Kept on this
            device until you reset the day.
          </DialogDescription>
        </DialogHeader>
        <SalesList sales={sales} />
      </DialogContent>
    </Dialog>
  );
}

// ---------- close day -> start new day ----------

const wholeNumber = (v: string) => Math.max(0, Math.floor(Number(v) || 0));

export function CloseDayDialog({
  items,
  day,
  sales,
  cartHasItems,
  askOpening,
  onCancel,
  onConfirm,
}: {
  items: MyStoreItem[];
  day: DayInfo | null;
  sales: Sale[];
  cartHasItems: boolean;
  /** When false the "start new day" step is skipped entirely. */
  askOpening: boolean;
  onCancel: () => void;
  /** `opening` is null when the user skipped the setup (calculator-only day). */
  onConfirm: (opening: Opening | null, dontAskAgain: boolean) => void;
}) {
  const hasData = dayHasData(day, sales);
  const [step, setStep] = useState<"close" | "open">(hasData ? "close" : "open");
  const [showSales, setShowSales] = useState(false);
  const [cash, setCash] = useState("");
  const [dontAsk, setDontAsk] = useState(false);

  // Tomorrow's opening stock defaults to what is left of today's tracked stock.
  const [stock, setStock] = useState<Record<string, StockInput>>(() => {
    const { rows } = computeDay(items, day, sales);
    const out: Record<string, StockInput> = {};
    for (const r of rows) {
      if (r.remainingBase === null) continue;
      const base = Math.max(0, Math.round(r.remainingBase));
      const crates = crateCapable(r.item) ? Math.floor(base / perCrate(r.item)) : 0;
      const pieces = base - crates * perCrate(r.item);
      out[r.item.productId] = {
        c: crates ? String(crates) : "",
        p: pieces ? String(pieces) : "",
      };
    }
    return out;
  });

  function start() {
    const stockOut: Record<string, Stock> = {};
    for (const [productId, v] of Object.entries(stock)) {
      if (v.c === "" && v.p === "") continue; // blank = not tracked
      stockOut[productId] = { crates: wholeNumber(v.c), pieces: wholeNumber(v.p) };
    }
    onConfirm(
      { cash: cash === "" ? null : Math.max(0, Number(cash) || 0), stock: stockOut },
      dontAsk,
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className={cn("max-h-[94vh] overflow-y-auto", step === "open" ? "sm:max-w-4xl" : "sm:max-w-2xl")}>
        {step === "close" ? (
          <>
            <DialogHeader>
              <DialogTitle>Close day</DialogTitle>
              <DialogDescription>
                {day?.openedAt
                  ? `Started ${new Date(day.openedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}. `
                  : ""}
                Check today&apos;s figures. Closing clears the sales history.
              </DialogDescription>
            </DialogHeader>

            <DaySummary items={items} day={day} sales={sales} />

            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-primary"
              onClick={() => setShowSales((v) => !v)}
            >
              {showSales ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {showSales ? "Hide" : "View"} sales list ({sales.length})
            </button>
            {showSales && <SalesList sales={sales} />}

            {cartHasItems && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                The sale currently in the cart has not been completed and will be cleared.
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {askOpening ? (
                <Button onClick={() => setStep("open")}>Next: start new day</Button>
              ) : (
                <Button onClick={() => onConfirm(null, false)}>Close day &amp; start new</Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Start new day</DialogTitle>
              <DialogDescription>
                Optional. Enter what you start with to see cash in hand and remaining stock at the end of
                the day, or skip and use this as a plain calculator. Blank fields are not tracked.
              </DialogDescription>
            </DialogHeader>

            <OpeningWheel items={items} stock={stock} setStock={setStock} cash={cash} setCash={setCash} />

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={dontAsk} onCheckedChange={(v) => setDontAsk(v === true)} />
              Don&apos;t ask for opening cash &amp; stock again (turn back on with the switch on the page)
            </label>

            <DialogFooter className="gap-2 sm:gap-2">
              {hasData ? (
                <Button variant="outline" onClick={() => setStep("close")}>
                  Back
                </Button>
              ) : (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button variant="outline" onClick={() => onConfirm(null, dontAsk)}>
                Skip, just use as calculator
              </Button>
              <Button onClick={start}>Start day</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
