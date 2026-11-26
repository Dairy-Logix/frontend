"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, GripVertical, Loader2, Save, Search } from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMyStoreConfig, useSaveMyStoreItems } from "@/lib/hooks/use-my-store";
import type { MyStoreConfigProduct } from "@/lib/api/services/my-store.service";

interface Row {
  selected: boolean;
  piecePrice: string;
  cratePrice: string;
}

const inr = (v?: number | null) =>
  v == null ? "—" : `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const round2 = (n: number) => String(Math.round(n * 100) / 100);

export default function MyStoreSettingsPage() {
  const { data: products, isLoading, dataUpdatedAt } = useMyStoreConfig();
  if (isLoading || !products) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  // Re-mount (re-seed edit state) whenever fresh server data arrives, e.g. after a save.
  return <SettingsEditor key={dataUpdatedAt} products={products} />;
}

const HOLD_MS = 350; // press-and-hold time before a row lifts
const HOLD_SLOP = 8; // px of movement that cancels the hold (it was a scroll)
const NO_HOLD_TARGETS = "input, button, label, a, [role='checkbox']";
// Timestamp of the last drag/hold release, so the click that follows it
// doesn't also toggle the row's selection.
let lastDragEnd = 0;

function SortableRow({
  id,
  renderRow,
}: {
  id: string;
  renderRow: (id: string, handle?: React.ReactNode) => React.ReactNode;
}) {
  const controls = useDragControls();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const [lifted, setLifted] = useState(false);

  const cancelHold = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // Once a drag has started, stop the browser from also scrolling the page.
  useEffect(() => {
    const block = (e: TouchEvent) => {
      if (dragging.current && e.cancelable) e.preventDefault();
    };
    document.addEventListener("touchmove", block, { passive: false });
    return () => {
      document.removeEventListener("touchmove", block);
      cancelHold();
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(NO_HOLD_TARGETS)) return;
    origin.current = { x: e.clientX, y: e.clientY };
    const native = e.nativeEvent;
    cancelHold();
    timer.current = setTimeout(() => {
      dragging.current = true;
      setLifted(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(15);
      controls.start(native);
    }, HOLD_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!timer.current || !origin.current) return;
    if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > HOLD_SLOP) {
      cancelHold(); // finger moved before the hold finished — treat as a scroll
    }
  };

  const endDrag = () => {
    cancelHold();
    if (dragging.current) lastDragEnd = Date.now();
    dragging.current = false;
    setLifted(false);
  };

  const handle = (
    <button
      type="button"
      onPointerDown={(e) => {
        e.stopPropagation();
        dragging.current = true;
        setLifted(true);
        controls.start(e);
      }}
      className="-ml-1 flex h-10 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground active:cursor-grabbing"
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );

  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={cancelHold}
      onDragEnd={endDrag}
      onContextMenu={(e) => {
        // Android shows a context menu on long-press; suppress it outside text fields.
        if (!(e.target as HTMLElement).closest("input")) e.preventDefault();
      }}
      className={cn(
        "relative select-none bg-card transition-colors [&_input]:select-text",
        lifted && "bg-accent",
      )}
      style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
      whileDrag={{ boxShadow: "0 8px 24px rgba(0,0,0,0.18)", zIndex: 10, scale: 1.01 }}
    >
      {renderRow(id, handle)}
    </Reorder.Item>
  );
}

function SettingsEditor({ products }: { products: MyStoreConfigProduct[] }) {
  const save = useSaveMyStoreItems();

  // Selected products first, in saved order (the backend returns them sorted).
  const [order, setOrder] = useState<string[]>(() => products.map((p) => p.productId));
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      products.map((p) => [
        p.productId,
        {
          selected: p.selected,
          piecePrice: p.piecePrice != null ? String(p.piecePrice) : "",
          cratePrice: p.cratePrice != null ? String(p.cratePrice) : "",
        },
      ]),
    ),
  );
  const [search, setSearch] = useState("");

  const byId = useMemo(() => new Map(products.map((p) => [p.productId, p])), [products]);

  const patch = (id: string, change: Partial<Row>) =>
    setRows((r) => ({ ...r, [id]: { ...r[id], ...change } }));

  const toggle = (p: MyStoreConfigProduct, selected: boolean) => {
    const row = rows[p.productId];
    const change: Partial<Row> = { selected };
    // Prefill from the distributor price so selecting is one tap + tweak.
    if (selected && !row.piecePrice) {
      if (p.category === "Crate") {
        change.cratePrice = row.cratePrice || round2(p.distributorPrice);
        change.piecePrice = round2(p.distributorPrice / p.piecesPerCrate);
      } else {
        change.piecePrice = round2(p.distributorPrice);
      }
    }
    patch(p.productId, change);
  };

  // Crate <-> piece helper: when one is edited and the other is blank, derive it.
  const fillOther = (p: MyStoreConfigProduct, edited: "piece" | "crate") => {
    if (p.category !== "Crate" || p.piecesPerCrate <= 1) return;
    const row = rows[p.productId];
    if (edited === "crate" && Number(row.cratePrice) > 0 && !row.piecePrice) {
      patch(p.productId, { piecePrice: round2(Number(row.cratePrice) / p.piecesPerCrate) });
    }
    if (edited === "piece" && Number(row.piecePrice) > 0 && !row.cratePrice) {
      patch(p.productId, { cratePrice: round2(Number(row.piecePrice) * p.piecesPerCrate) });
    }
  };

  const selectedCount = order.filter((id) => rows[id]?.selected).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return order.filter((id) => {
      const p = byId.get(id);
      return p && (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
    });
  }, [order, search, byId]);

  const renderRow = (id: string, handle?: React.ReactNode) => {
    const p = byId.get(id);
    const row = rows[id];
    if (!p || !row) return null;
    const isCrate = p.category === "Crate";
    return (
    <div
      className="flex cursor-pointer flex-wrap items-center gap-3 bg-card p-3 sm:flex-nowrap"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(NO_HOLD_TARGETS)) return;
        if (Date.now() - lastDragEnd < 400) return;
        toggle(p, !row.selected);
      }}
    >
      {handle}
      <Checkbox
        checked={row.selected}
        onCheckedChange={(v) => toggle(p, v === true)}
        className="h-6 w-6"
        aria-label={`Sell ${p.name}`}
      />
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
        {p.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{p.name}</p>
        <p className="text-xs text-muted-foreground">
          <Badge variant="secondary" className="mr-1.5">{p.category}</Badge>
          Your cost {inr(p.distributorPrice)}/{isCrate ? "crate" : "piece"}
          {p.mrp ? ` · MRP ${inr(p.mrp)}` : ""}
          {isCrate && p.piecesPerCrate > 1 ? ` · ${p.piecesPerCrate} pcs/crate` : ""}
        </p>
      </div>

      {row.selected && (
        <div className="flex w-full items-end gap-2 sm:w-auto">
          <label className="text-xs text-muted-foreground">
            Per piece (₹)
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={row.piecePrice}
              onChange={(e) => patch(id, { piecePrice: e.target.value })}
              onBlur={() => fillOther(p, "piece")}
              className="mt-1 w-28"
            />
          </label>
          {isCrate && (
            <label className="text-xs text-muted-foreground">
              Per crate (₹)
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={row.cratePrice}
                onChange={(e) => patch(id, { cratePrice: e.target.value })}
                onBlur={() => fillOther(p, "crate")}
                className="mt-1 w-28"
              />
            </label>
          )}
        </div>
      )}
    </div>
    );
  };

  // Drag-to-reorder applies to the selected products, and only while not searching.
  const canReorder = !search.trim();
  const selectedIds = order.filter((id) => rows[id]?.selected);
  const unselectedIds = visible.filter((id) => !rows[id]?.selected);
  const onReorder = (next: string[]) =>
    setOrder([...next, ...order.filter((id) => !rows[id]?.selected)]);

  const onSave = () => {
    const payload = [];
    for (const id of order) {
      const row = rows[id];
      if (!row?.selected) continue;
      const p = byId.get(id)!;
      const piecePrice = Number(row.piecePrice);
      if (!(piecePrice > 0)) {
        toast.error(`Enter a piece price for "${p.name}"`);
        return;
      }
      const cratePrice = Number(row.cratePrice);
      payload.push({
        productId: id,
        piecePrice,
        ...(p.category === "Crate" && cratePrice > 0 ? { cratePrice } : {}),
      });
    }
    save.mutate(payload);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back to My Store">
          <Link href="/my-store"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold">My Store · Products &amp; prices</h1>
          <p className="text-sm text-muted-foreground">
            Pick the products you sell from your own store and set your selling prices. Press and hold a selected product, then drag it to set the order it appears in. Piece products are sold by the piece only.
          </p>
        </div>
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="pl-8" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        {canReorder ? (
          <Reorder.Group axis="y" values={selectedIds} onReorder={onReorder} className="divide-y">
            {selectedIds.map((id) => (
              <SortableRow key={id} id={id} renderRow={renderRow} />
            ))}
          </Reorder.Group>
        ) : null}
        <div className="divide-y border-t first:border-t-0">
          {(canReorder ? unselectedIds : visible).map((id) => (
            <div key={id}>{renderRow(id)}</div>
          ))}
        </div>
        {visible.length === 0 && (
          <p className="p-8 text-center text-muted-foreground">No products found.</p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur md:left-auto">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{selectedCount} product{selectedCount === 1 ? "" : "s"} selected</span>
          <Button onClick={onSave} disabled={save.isPending} size="lg">
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
