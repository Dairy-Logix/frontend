"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Delete, ListChecks, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MyStoreItem } from "@/lib/api/services/my-store.service";

/**
 * Opening cash / stock entry for "Start new day": a rolling wheel of products on
 * one side and a big keypad on the other. Row 0 of the wheel is opening cash,
 * rows 1..n are the products. Values are strings (blank = not tracked).
 */

export type StockInput = { c: string; p: string };

const ROW = 80; // px height of one wheel row
const SPAN = 2; // rows visible above and below the centre
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Soft theme-coloured glow whose strength follows the row's --g (1 = centred, 0 = away). */
const glow = (px: number, pct: number) =>
  `0 0 calc(var(--g, 0) * ${px}px) color-mix(in oklab, var(--primary) calc(var(--g, 0) * ${pct}%), transparent)`;
const crateCapable = (item: MyStoreItem) => item.category === "Crate" && !!item.cratePrice;
const inr = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "clear", "0", "back"];

function fmt(item: MyStoreItem, v: StockInput | undefined): string {
  if (!v) return "–";
  const parts = [
    crateCapable(item) && v.c !== "" ? `${Number(v.c)} C` : "",
    v.p !== "" ? `${Number(v.p)} P` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" + ") : "–";
}

const same = (a: StockInput | undefined, b: StockInput | undefined) =>
  !!a && !!b && a.c === b.c && a.p === b.p && (a.c !== "" || a.p !== "");

function Tile({ item }: { item: MyStoreItem | null }) {
  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-xl font-semibold text-muted-foreground ring-1 ring-border"
      style={{ boxShadow: glow(20, 70) }}
    >
      {item === null ? (
        "₹"
      ) : item.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        item.name.charAt(0).toUpperCase() || <Package className="h-5 w-5" />
      )}
    </div>
  );
}

export function OpeningWheel({
  items,
  stock,
  setStock,
  cash,
  setCash,
}: {
  items: MyStoreItem[];
  stock: Record<string, StockInput>;
  setStock: (updater: (s: Record<string, StockInput>) => Record<string, StockInput>) => void;
  cash: string;
  setCash: (v: string) => void;
}) {
  const [view, setView] = useState<"wheel" | "review">("wheel");
  const [index, setIndex] = useState(0); // 0 = cash, 1..n = items[index - 1]
  const [field, setField] = useState<"c" | "p">("c");
  const [fresh, setFresh] = useState(true); // next digit replaces the old value
  const prefill = useRef(stock); // what came from yesterday
  const scroller = useRef<HTMLDivElement>(null);
  const rowEls = useRef<(HTMLButtonElement | null)[]>([]);
  const lock = useRef<{ top: number } | null>(null); // a programmatic scroll is in flight
  const lockTimer = useRef<number | undefined>(undefined);
  const settleTimer = useRef<number | undefined>(undefined);
  const indexRef = useRef(0);
  const last = items.length; // highest index

  useEffect(() => {
    indexRef.current = index;
  }, [index]);
  useEffect(
    () => () => {
      window.clearTimeout(lockTimer.current);
      window.clearTimeout(settleTimer.current);
    },
    [],
  );

  /**
   * Reel look, driven straight from the scroll position (no React re-render per
   * frame): rows fade, shrink and tilt away from the centre and the centred one glows.
   */
  const paint = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const pos = el.scrollTop / ROW;
    rowEls.current.forEach((r, i) => {
      if (!r) return;
      const off = i - pos;
      const d = Math.min(Math.abs(off), SPAN);
      r.style.opacity = String(1 - d * 0.4);
      r.style.transform = `perspective(520px) rotateX(${-clamp(off, -SPAN, SPAN) * 16}deg) scale(${1 - d * 0.07})`;
      r.style.setProperty("--g", Math.max(0, 1 - Math.abs(off)).toFixed(3));
    });
  }, []);

  const cur = index > 0 ? items[index - 1] : null;
  const activeField: "c" | "p" = cur && crateCapable(cur) ? field : "p";

  const reduced = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const select = useCallback((i: number) => {
    setIndex(i);
    setFresh(true);
    setField("c");
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const next = clamp(i, 0, last);
      const el = scroller.current;
      if (el) {
        const top = next * ROW;
        if (reduced()) el.scrollTop = top;
        else {
          // While the smooth scroll runs, scroll events must not re-select rows
          // on the way past (that is what made the boxes above the keypad flicker).
          lock.current = { top };
          window.clearTimeout(lockTimer.current);
          lockTimer.current = window.setTimeout(() => (lock.current = null), 900);
          el.scrollTo({ top, behavior: "smooth" });
        }
      }
      select(next);
    },
    [last, select],
  );

  // Returning from the review table: put the wheel back on the chosen row.
  useLayoutEffect(() => {
    if (view === "wheel" && scroller.current) scroller.current.scrollTop = index * ROW;
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    paint();
    if (lock.current) {
      if (Math.abs(el.scrollTop - lock.current.top) < 1.5) lock.current = null;
      return;
    }
    // User drag / flick: only commit the row once the wheel has settled.
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const i = clamp(Math.round(el.scrollTop / ROW), 0, last);
      if (i !== indexRef.current) select(i);
    }, 90);
  };

  const press = useCallback(
    (key: string) => {
      const value = cur ? stock[cur.productId]?.[activeField] ?? "" : cash;
      const max = cur ? 3 : 6;
      let next = value;
      if (key === "clear") next = "";
      else if (key === "back") next = fresh ? "" : value.slice(0, -1);
      else {
        const base = fresh ? "" : value;
        if (base.length >= max) return;
        next = String(Number(base + key));
      }
      setFresh(false);
      if (cur) {
        setStock((s) => ({
          ...s,
          [cur.productId]: { ...(s[cur.productId] ?? { c: "", p: "" }), [activeField]: next },
        }));
      } else setCash(next);
    },
    [cur, stock, activeField, cash, fresh, setStock, setCash],
  );

  const advance = useCallback(
    (delta: 1 | -1) => {
      if (delta === 1 && index === last) setView("review");
      else goTo(index + delta);
    },
    [index, last, goTo],
  );

  useEffect(() => {
    if (view !== "wheel") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("back");
      else if (e.key === "Enter") advance(e.shiftKey ? -1 : 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, press, advance]);

  // ---------- review ----------
  if (view === "review") {
    const tracked = items.filter((it) => stock[it.productId] && fmt(it, stock[it.productId]) !== "–");
    const untracked = items.filter((it) => !tracked.includes(it));
    const open = (i: number) => {
      select(i);
      setView("wheel");
    };
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Review opening figures — tap a row to change it</p>
          <Button variant="outline" size="sm" onClick={() => setView("wheel")}>
            Back to keypad
          </Button>
        </div>
        <div className="max-h-[48vh] divide-y overflow-y-auto rounded-xl border">
          <button type="button" onClick={() => open(0)} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm">
            <span>Opening cash</span>
            <span className="font-semibold">{cash === "" ? "–" : inr(Number(cash))}</span>
          </button>
          {tracked.map((it) => (
            <button
              key={it.productId}
              type="button"
              onClick={() => open(items.indexOf(it) + 1)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm"
            >
              <span className="truncate">{it.name}</span>
              <span className="shrink-0 font-semibold">{fmt(it, stock[it.productId])}</span>
            </button>
          ))}
          {tracked.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">No product stock entered.</p>}
        </div>
        {untracked.length > 0 && (
          <details className="rounded-xl border px-3 py-2 text-sm">
            <summary className="cursor-pointer text-muted-foreground">Not tracked ({untracked.length})</summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {untracked.map((it) => (
                <button
                  key={it.productId}
                  type="button"
                  onClick={() => open(items.indexOf(it) + 1)}
                  className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted"
                >
                  {it.name}
                </button>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  }

  // ---------- wheel + keypad ----------
  const rows: (MyStoreItem | null)[] = [null, ...items];
  const box = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center rounded-xl border-2 px-2 py-2 text-center transition-colors",
      active ? "border-primary bg-primary/5" : "border-border",
    );

  return (
    <div className="space-y-3">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Wheel */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-muted/70 via-card to-muted/70 shadow-[inset_0_2px_16px_rgba(0,0,0,0.12)] ring-1 ring-border">
          {/* Centre band: the "pay line" */}
          <div
            className="pointer-events-none absolute inset-x-2 rounded-xl border border-primary/50 bg-primary/[0.07] shadow-[0_0_24px_-6px_var(--primary),inset_0_0_18px_-8px_var(--primary)]"
            style={{ top: SPAN * ROW + 4, height: ROW - 8 }}
          />
          <div
            className="pointer-events-none absolute left-0 z-20 h-4 w-2 bg-primary"
            style={{ top: SPAN * ROW + ROW / 2 - 8, clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
          />
          <div
            className="pointer-events-none absolute right-0 z-20 h-4 w-2 bg-primary"
            style={{ top: SPAN * ROW + ROW / 2 - 8, clipPath: "polygon(100% 0, 0 50%, 100% 100%)" }}
          />

          <div
            ref={scroller}
            onScroll={onScroll}
            className="relative z-10 overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              height: ROW * (2 * SPAN + 1),
              scrollSnapType: "y mandatory",
              scrollPaddingTop: SPAN * ROW,
              paddingTop: SPAN * ROW,
              paddingBottom: SPAN * ROW,
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {rows.map((it, i) => {
              const v = it ? stock[it.productId] : undefined;
              const fromYesterday = it ? same(v, prefill.current[it.productId]) : false;
              return (
                <button
                  key={it ? it.productId : "cash"}
                  ref={(n) => {
                    rowEls.current[i] = n;
                  }}
                  type="button"
                  onClick={() => goTo(i)}
                  className="flex w-full items-center gap-3 px-5 text-left will-change-transform"
                  style={{ height: ROW, scrollSnapAlign: "start", scrollSnapStop: "always" }}
                >
                  <Tile item={it} />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-base font-semibold"
                      style={{ textShadow: glow(14, 60) }}
                    >
                      {it ? it.name : "Opening cash"}
                    </p>
                    <p
                      className="text-lg font-bold tabular-nums text-primary"
                      style={{ textShadow: glow(16, 70) }}
                    >
                      {it ? fmt(it, v) : cash === "" ? "–" : inr(Number(cash))}
                      {fromYesterday && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">· from yesterday</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{i === 0 ? "" : `${i}/${items.length}`}</span>
                </button>
              );
            })}
          </div>

          {/* Reel fade top and bottom */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-card to-transparent"
            style={{ height: ROW * 1.2 }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-card to-transparent"
            style={{ height: ROW * 1.2 }}
          />
        </div>

        {/* Keypad */}
        <div className="space-y-3">
          {cur ? (
            <div className="flex gap-2">
              {/* Both boxes always render so the layout never jumps between products. */}
              <button
                type="button"
                disabled={!crateCapable(cur)}
                className={cn(box(activeField === "c" && crateCapable(cur)), "h-[76px] disabled:opacity-40")}
                onClick={() => {
                  setField("c");
                  setFresh(true);
                }}
              >
                <span className="text-xs text-muted-foreground">Crates</span>
                <span className="text-2xl font-bold tabular-nums">
                  {crateCapable(cur) ? stock[cur.productId]?.c || "0" : "–"}
                </span>
              </button>
              <button
                type="button"
                className={cn(box(activeField === "p"), "h-[76px]")}
                onClick={() => {
                  setField("p");
                  setFresh(true);
                }}
              >
                <span className="text-xs text-muted-foreground">Pieces</span>
                <span className="text-2xl font-bold tabular-nums">{stock[cur.productId]?.p || "0"}</span>
              </button>
            </div>
          ) : (
            <div className={cn(box(true), "h-[76px] w-full")}>
              <span className="text-xs text-muted-foreground">Opening cash (optional)</span>
              <span className="text-2xl font-bold tabular-nums">{cash === "" ? "₹0" : inr(Number(cash))}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {KEYS.map((k) => (
              <Button
                key={k}
                type="button"
                variant={k === "clear" || k === "back" ? "secondary" : "outline"}
                className="h-14 text-xl"
                onClick={() => press(k)}
                aria-label={k === "back" ? "Backspace" : k === "clear" ? "Clear" : k}
              >
                {k === "back" ? <Delete className="h-5 w-5" /> : k === "clear" ? "AC" : k}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="h-12" disabled={index === 0} onClick={() => advance(-1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Prev
            </Button>
            <Button type="button" className="h-12" onClick={() => advance(1)}>
              {index === last ? "Review" : "Next"} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Button type="button" variant="ghost" size="sm" onClick={() => setView("review")}>
        <ListChecks className="mr-1.5 h-4 w-4" /> Review all
      </Button>
    </div>
  );
}
