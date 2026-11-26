"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarX2, Delete, Loader2, Minus, RotateCcw, Search, Settings, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useMyStoreItems } from "@/lib/hooks/use-my-store";
import type { MyStoreItem } from "@/lib/api/services/my-store.service";

type Unit = "piece" | "crate";

/** Everything below is temporary, device-local sales state (never sent to the server). */
interface Session {
  cart: Record<string, number>; // key = `${productId}:${unit}` -> qty
  units: Record<string, Unit>; // per-card selected unit
  dayTotal: number;
  saleCount: number;
}

const EMPTY: Session = { cart: {}, units: {}, dayTotal: 0, saleCount: 0 };

const inr = (v: number) =>
  `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const lineKey = (productId: string, unit: Unit) => `${productId}:${unit}`;
const unitPrice = (item: MyStoreItem, unit: Unit) =>
  unit === "crate" ? item.cratePrice ?? 0 : item.piecePrice;
const canCrate = (item: MyStoreItem) => item.category === "Crate" && !!item.cratePrice;

function CompleteSaleDialog({
  total,
  onCancel,
  onComplete,
}: {
  total: number;
  onCancel: () => void;
  onComplete: (dontAskAgain: boolean) => void;
}) {
  const [other, setOther] = useState<string>(""); // amount received, typed on the pad
  const [dontAsk, setDontAsk] = useState(false);

  const pressKey = (k: string) =>
    setOther((v) => {
      if (k === "back") return v.slice(0, -1);
      if (v === "" && (k === "0" || k === "00")) return v; // no leading zeros
      return v.length + k.length > 7 ? v : v + k; // cap at 9,999,999
    });

  const received = Number(other) > 0 ? Number(other) : null;
  const diff = received === null ? null : Math.round((received - total) * 100) / 100;

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[96vh] max-w-2xl gap-3 p-4 sm:p-5">
        <DialogHeader className="space-y-0">
          <DialogTitle>Complete sale</DialogTitle>
          <DialogDescription className="sr-only">
            Enter the amount received to see the change to return.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Left: totals and change */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-2xl font-bold">{inr(total)}</span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Amount received</p>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setOther(String(total))}>
                  Exact
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setOther("")}>
                  Clear
                </Button>
              </div>
            </div>
            <div
              className={cn(
                "flex h-12 items-center justify-end rounded-lg border bg-muted/40 px-3 text-2xl font-bold",
                other === "" && "text-muted-foreground/50",
              )}
              aria-live="polite"
            >
              {other === "" ? "₹0" : inr(Number(other))}
            </div>

            <div
              className={cn(
                "flex flex-1 flex-col items-center justify-center rounded-xl px-3 py-2 text-center",
                diff === null && "bg-muted text-muted-foreground",
                diff !== null && diff >= 0 && "bg-green-500/10 text-green-600 dark:text-green-400",
                diff !== null && diff < 0 && "bg-red-500/10 text-red-600 dark:text-red-400",
              )}
            >
              {diff === null ? (
                <p className="text-sm">Enter the amount received</p>
              ) : diff > 0 ? (
                <>
                  <p className="text-sm">Return to customer</p>
                  <p className="text-4xl font-extrabold leading-tight">{inr(diff)}</p>
                </>
              ) : diff === 0 ? (
                <p className="font-semibold">Exact amount — no change</p>
              ) : (
                <>
                  <p className="text-sm">Still to collect</p>
                  <p className="text-4xl font-extrabold leading-tight">{inr(-diff)}</p>
                </>
              )}
            </div>
          </div>

          {/* Right: number pad */}
          <div className="grid grid-cols-3 gap-2">
            {["7", "8", "9", "4", "5", "6", "1", "2", "3", "00", "0", "back"].map((k) => (
              <Button
                key={k}
                type="button"
                variant="outline"
                className="h-12 text-xl font-semibold"
                aria-label={k === "back" ? "Backspace" : k}
                onClick={() => pressKey(k)}
              >
                {k === "back" ? <Delete className="h-5 w-5" /> : k}
              </Button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={dontAsk} onCheckedChange={(v) => setDontAsk(v === true)} />
          Don&apos;t ask me again (turn back on with &quot;Ask on Complete&quot;)
        </label>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" className="h-11" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" className="h-11" onClick={() => onComplete(dontAsk)}>
            Complete sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function loadSession(storageKey: string): Session {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export default function MyStorePage() {
  const tenantId = useAuthStore((s) => s.user?.tenantId) || "";
  if (!tenantId) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <MyStoreSales key={tenantId} tenantId={tenantId} />;
}

function MyStoreSales({ tenantId }: { tenantId: string }) {
  const storageKey = `my-store-session:${tenantId}`;
  const { data: items = [], isLoading } = useMyStoreItems();

  const [session, setSession] = useState<Session>(() => loadSession(storageKey));
  const [search, setSearch] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDone, setConfirmDone] = useState(false);

  // Device-local preference: show the "amount received / change" popup on Complete.
  const askKey = `my-store-ask-complete:${tenantId}`;
  const [askOnComplete, setAskOnComplete] = useState<boolean>(() => {
    try {
      return localStorage.getItem(askKey) !== "false";
    } catch {
      return true;
    }
  });
  const updateAsk = (value: boolean) => {
    setAskOnComplete(value);
    try {
      localStorage.setItem(askKey, String(value));
    } catch {
      /* ignore — preference just won't persist */
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(session));
    } catch {
      /* storage unavailable — the calculator still works in memory */
    }
  }, [session, storageKey]);

  const selectedUnit = (item: MyStoreItem): Unit =>
    canCrate(item) && session.units[item.productId] !== "piece" ? "crate" : "piece";

  const setUnit = (productId: string, unit: Unit) =>
    setSession((s) => ({ ...s, units: { ...s.units, [productId]: unit } }));

  const adjust = useCallback((productId: string, unit: Unit, delta: number) => {
    setSession((s) => {
      const key = lineKey(productId, unit);
      const next = Math.max(0, (s.cart[key] ?? 0) + delta);
      const cart = { ...s.cart };
      if (next === 0) delete cart[key];
      else cart[key] = next;
      return { ...s, cart };
    });
  }, []);

  const removeLine = (key: string) =>
    setSession((s) => {
      const cart = { ...s.cart };
      delete cart[key];
      return { ...s, cart };
    });

  const lines = useMemo(() => {
    const out: { key: string; item: MyStoreItem; unit: Unit; qty: number; price: number; total: number }[] = [];
    for (const item of items) {
      for (const unit of ["crate", "piece"] as Unit[]) {
        const qty = session.cart[lineKey(item.productId, unit)] ?? 0;
        if (!qty) continue;
        const price = unitPrice(item, unit);
        out.push({ key: lineKey(item.productId, unit), item, unit, qty, price, total: qty * price });
      }
    }
    return out;
  }, [items, session.cart]);

  // Today's date, e.g. "26 Nov 2026" (Indian format, device local time).
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const cartTotal = lines.reduce((sum, l) => sum + l.total, 0);

  const nextCustomer = () => {
    setSession((s) => ({
      ...s,
      cart: {},
      dayTotal: s.dayTotal + cartTotal,
      saleCount: s.saleCount + (lines.length ? 1 : 0),
    }));
    setConfirmDone(false);
  };

  const clearSale = () => setSession((s) => ({ ...s, cart: {} }));
  const onCompleteClick = () => {
    if (askOnComplete) setConfirmDone(true);
    else nextCustomer();
  };
  const resetDay = () => {
    setSession(EMPTY);
    setConfirmReset(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || (i.shortName ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">My Store</h1>
        <p className="text-muted-foreground">
          Choose the products you sell from your own store and set your selling prices to get started.
        </p>
        <Button asChild size="lg">
          <Link href="/my-store/settings">
            <Settings className="mr-2 h-4 w-4" /> Set up products &amp; prices
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[560px] flex-col gap-4 lg:flex-row">
      {/* Product grid */}
      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-2xl font-semibold">My Store</h1>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="pl-8"
            />
          </div>
          <Button asChild variant="outline" size="icon" aria-label="Prices & products">
            <Link href="/my-store/settings"><Settings className="h-4 w-4" /></Link>
          </Button>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={askOnComplete} onCheckedChange={updateAsk} />
            Ask on Complete
          </label>
        </div>

        <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-2 content-start gap-3 overflow-y-auto pb-2 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const unit = selectedUnit(item);
            const qty = session.cart[lineKey(item.productId, unit)] ?? 0;
            const otherUnit: Unit = unit === "crate" ? "piece" : "crate";
            const otherQty = session.cart[lineKey(item.productId, otherUnit)] ?? 0;
            return (
              <div
                key={item.productId}
                className="select-none overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                <div className="relative aspect-square w-full bg-muted">
                  <button
                    type="button"
                    onClick={() => adjust(item.productId, unit, 1)}
                    className="absolute inset-0 touch-manipulation active:scale-[0.98]"
                    aria-label={`Add one ${unit} of ${item.name}`}
                  >
                    {item.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        draggable={false}
                        className={cn(
                          "absolute inset-0 h-full w-full object-cover transition-opacity",
                          qty > 0 || otherQty > 0 ? "opacity-40" : "opacity-90",
                        )}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-muted-foreground/40">
                        {item.name[0]}
                      </div>
                    )}
                    <span
                      className={cn(
                        "absolute inset-0 flex items-center justify-center text-6xl font-extrabold drop-shadow",
                        qty > 0 ? "text-foreground" : "text-transparent",
                      )}
                    >
                      {qty > 0 ? qty : ""}
                    </span>
                  </button>

                  {/* Count of the other unit (top-left) */}
                  {otherQty > 0 && (
                    <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground">
                      {otherQty} {otherUnit === "crate" ? "C" : "P"}
                    </span>
                  )}

                  {/* P / C unit switch (top-right) */}
                  {canCrate(item) && (
                    <div className="absolute right-1.5 top-1.5 flex overflow-hidden rounded-md border bg-background/90 text-xs font-bold shadow-sm backdrop-blur">
                      {(["piece", "crate"] as Unit[]).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUnit(item.productId, u)}
                          className={cn(
                            "h-8 w-8 touch-manipulation transition-colors",
                            unit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                          )}
                          aria-label={u === "piece" ? "Sell by piece" : "Sell by crate"}
                          aria-pressed={unit === u}
                        >
                          {u === "piece" ? "P" : "C"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2 p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {inr(unitPrice(item, unit))} / {unit}
                      {unit === "crate" && item.piecesPerCrate > 1 ? ` (${item.piecesPerCrate} pcs)` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {unit === "crate" && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 w-9 px-0 text-sm font-bold"
                        onClick={() => adjust(item.productId, "crate", 0.5)}
                        aria-label={`Add half a crate of ${item.name}`}
                      >
                        .5
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      disabled={qty === 0}
                    onClick={() => adjust(item.productId, unit, -1)}
                    aria-label={`Remove one ${unit} of ${item.name}`}
                  >
                    <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-10 text-center text-muted-foreground">No products match.</p>
          )}
        </div>
      </section>

      {/* Cart panel */}
      <aside className="flex w-full flex-col rounded-2xl border bg-card lg:w-[250px] xl:w-[270px]">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold">{todayLabel}</h2>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400" onClick={() => setConfirmReset(true)}>
            <CalendarX2 className="mr-1.5 h-4 w-4" /> Reset day
          </Button>
        </div>

        <div className="min-h-[120px] flex-1 divide-y overflow-y-auto">
          {lines.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Tap a product to add it.
            </p>
          ) : (
            lines.map((l) => (
              <div key={l.key} className="flex items-center gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.qty} {l.unit === "crate" ? (l.qty === 1 ? "crate" : "crates") : l.qty === 1 ? "piece" : "pieces"} × {inr(l.price)}
                  </p>
                </div>
                <p className="text-right text-sm font-semibold">{inr(l.total)}</p>
                <button type="button" onClick={() => removeLine(l.key)} className="text-muted-foreground hover:text-destructive" aria-label="Remove line">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 border-t p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="text-3xl font-bold">{inr(cartTotal)}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-12 w-12 shrink-0 px-0"
              disabled={!lines.length}
              onClick={clearSale}
              aria-label="Reset current sale"
              title="Reset current sale"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button className="h-12 flex-1 text-base" disabled={!lines.length} onClick={onCompleteClick}>
              Complete
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Today · {session.saleCount} {session.saleCount === 1 ? "sale" : "sales"}</span>
            <span className="font-semibold">{inr(session.dayTotal)}</span>
          </div>
        </div>
      </aside>

      {confirmDone && (
        <CompleteSaleDialog
          total={cartTotal}
          onCancel={() => setConfirmDone(false)}
          onComplete={(dontAskAgain) => {
            if (dontAskAgain) updateAsk(false);
            nextCustomer();
          }}
        />
      )}

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset for a new day?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears the current cart and today&apos;s total ({inr(session.dayTotal)}, {session.saleCount} sales). Your products and prices are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetDay}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
