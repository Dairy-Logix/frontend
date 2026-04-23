"use client";

import { cn } from "@/lib/utils";

/**
 * Animated gradient fog background with 3 floating color orbs.
 * Place as the first child inside a `relative` container.
 */
export function AnimatedBg({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className
      )}
    >
      {/* Orb 1 — sky blue, horizontal sweep */}
      <div className="animated-orb animated-orb-1" />

      {/* Orb 2 — mint, horizontal sweep */}
      <div className="animated-orb animated-orb-2" />

      {/* Orb 3 — peach, horizontal sweep */}
      <div className="animated-orb animated-orb-3" />

      {/* Orb 4 — orange, horizontal sweep */}
      <div className="animated-orb animated-orb-4" />
    </div>
  );
}
