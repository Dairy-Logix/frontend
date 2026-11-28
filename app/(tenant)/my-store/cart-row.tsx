"use client";

import { useRef, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

const TAP_SLOP = 8; // px of movement still counted as a tap
const REMOVE_FRACTION = 0.4; // share of the row width that confirms a swipe
const FLICK_SPEED = 0.6; // px/ms

interface CartRowProps {
  picked: boolean;
  onToggle: () => void;
  onRemove: () => void;
  children: ReactNode;
}

/**
 * One cart line. Tap toggles the green "given to customer" mark; dragging it to
 * the right (touch or mouse) removes it. Vertical drags are left to the browser
 * so the cart still scrolls.
 */
export function CartRow({ picked, onToggle, onRemove, children }: CartRowProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; t: number; id: number } | null>(null);
  const axis = useRef<"x" | "y" | null>(null);

  const reset = () => {
    start.current = null;
    axis.current = null;
    setDragging(false);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (leaving || (e.pointerType === "mouse" && e.button !== 0)) return;
    start.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    axis.current = null;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!axis.current) {
      if (Math.abs(mx) < TAP_SLOP && Math.abs(my) < TAP_SLOP) return;
      axis.current = Math.abs(mx) > Math.abs(my) ? "x" : "y";
      if (axis.current === "x") {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }
    }
    if (axis.current === "x") setDx(Math.max(0, mx)); // right only
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    const wasAxis = axis.current;
    const width = ref.current?.offsetWidth ?? 200;
    const speed = mx / Math.max(1, performance.now() - s.t);
    reset();

    if (wasAxis === "x") {
      if (mx > width * REMOVE_FRACTION || (mx > 40 && speed > FLICK_SPEED)) {
        setLeaving(true);
        setDx(width);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.setTimeout(onRemove, reduced ? 0 : 180);
      } else {
        setDx(0);
      }
    } else if (!wasAxis && Math.abs(mx) < TAP_SLOP && Math.abs(my) < TAP_SLOP) {
      onToggle();
    }
  };

  const onPointerCancel = () => {
    reset();
    setDx(0);
  };

  return (
    <div ref={ref} className="relative overflow-hidden">
      <div
        className="absolute inset-0 flex items-center bg-red-500 pl-4 text-white"
        aria-hidden
      >
        <Trash2 className="h-5 w-5" />
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-pressed={picked}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onToggle();
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{
          transform: `translateX(${dx}px)`,
          touchAction: "pan-y",
          transition: dragging ? "none" : "transform 180ms ease-out",
        }}
        className={cn(
          "relative flex cursor-pointer select-none items-center gap-2 px-3 py-2.5",
          picked ? "bg-green-100 dark:bg-green-900/40" : "bg-card",
        )}
      >
        {children}
      </div>
    </div>
  );
}
