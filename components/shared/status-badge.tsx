"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface StatusBadgeBaseProps {
  status: string;
  className?: string;
}

interface StatusBadgeWithVariant extends StatusBadgeBaseProps {
  variant?: BadgeVariant;
  colorMap?: never;
}

interface StatusBadgeWithColorMap extends StatusBadgeBaseProps {
  variant?: never;
  colorMap?: Record<string, { label: string; variant: BadgeVariant }>;
}

type StatusBadgeProps = StatusBadgeWithVariant | StatusBadgeWithColorMap;

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-muted text-muted-foreground border-border",
  success:
    "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
  warning:
    "bg-[var(--warning)]/10 text-[var(--warning-dark)] border-[var(--warning)]/20",
  error:
    "bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/20",
  info:
    "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
};

export function StatusBadge({
  status,
  variant,
  colorMap,
  className,
}: StatusBadgeProps) {
  let resolvedVariant: BadgeVariant = "default";
  let resolvedLabel = status;

  if (colorMap && status in colorMap) {
    const mapped = colorMap[status];
    resolvedVariant = mapped.variant as BadgeVariant;
    resolvedLabel = mapped.label;
  } else if (variant) {
    resolvedVariant = variant;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        variantStyles[resolvedVariant],
        className
      )}
    >
      {resolvedLabel}
    </span>
  );
}
