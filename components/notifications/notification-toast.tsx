"use client";

import { X, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Rich, theme-aware toast used for live in-app notifications (the navbar-bell
 * companion). Colours are driven entirely by the semantic oklch design tokens
 * (`--success`, `--info`, …) so the toast looks correct in both light and dark
 * mode without any hard-coded hex values.
 *
 * Rendered via `showNotificationToast(...)`, which hands it to `toast.custom`.
 */
export type NotificationToastVariant =
  | "success"
  | "info"
  | "warning"
  | "accent";

interface VariantStyle {
  /** Coloured accent bar down the left edge. */
  bar: string;
  /** Tinted square behind the icon. */
  iconWrap: string;
  /** Icon glyph colour. */
  icon: string;
  /** Actor pill. */
  badge: string;
  /** Filled action button. */
  action: string;
}

// Each variant maps to a semantic token + its light/dark companions. The `/NN`
// opacity tints (e.g. `bg-[var(--success)]/15`) are the same pattern used across
// the app, and `dark:` swaps the badge text to the lighter token for contrast
// against the darker popover background.
const VARIANT_STYLES: Record<NotificationToastVariant, VariantStyle> = {
  success: {
    bar: "bg-[var(--success)]",
    iconWrap: "bg-[var(--success)]/15 ring-1 ring-inset ring-[var(--success)]/25",
    icon: "text-[var(--success)]",
    badge:
      "bg-[var(--success)]/15 text-[var(--success-dark)] dark:text-[var(--success-light)]",
    action:
      "bg-[var(--success)] text-[var(--success-foreground)] hover:opacity-90",
  },
  info: {
    bar: "bg-[var(--info)]",
    iconWrap: "bg-[var(--info)]/15 ring-1 ring-inset ring-[var(--info)]/25",
    icon: "text-[var(--info)]",
    badge:
      "bg-[var(--info)]/15 text-[var(--info-dark)] dark:text-[var(--info-light)]",
    action: "bg-[var(--info)] text-[var(--info-foreground)] hover:opacity-90",
  },
  warning: {
    bar: "bg-[var(--warning)]",
    iconWrap: "bg-[var(--warning)]/20 ring-1 ring-inset ring-[var(--warning)]/30",
    icon: "text-[var(--warning-dark)]",
    badge:
      "bg-[var(--warning)]/20 text-[var(--warning-dark)] dark:text-[var(--warning-light)]",
    action:
      "bg-[var(--warning)] text-[var(--warning-foreground)] hover:opacity-90",
  },
  accent: {
    bar: "bg-[var(--accent)]",
    iconWrap: "bg-[var(--accent)]/15 ring-1 ring-inset ring-[var(--accent)]/25",
    icon: "text-[var(--accent)]",
    badge:
      "bg-[var(--accent)]/15 text-[var(--accent-dark)] dark:text-[var(--accent-light)]",
    action:
      "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90",
  },
};

export interface NotificationToastProps {
  toastId: string | number;
  variant: NotificationToastVariant;
  icon: LucideIcon;
  /** Small pill naming who triggered the event (e.g. "Shopkeeper"). */
  actor?: string;
  title: string;
  message: string;
  /** Optional secondary line (e.g. relative time). */
  meta?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function NotificationToast({
  toastId,
  variant,
  icon: Icon,
  actor,
  title,
  message,
  meta,
  actionLabel,
  onAction,
}: NotificationToastProps) {
  const s = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-[min(360px,calc(100vw-2rem))] items-start gap-3",
        "overflow-hidden rounded-[var(--radius)] border border-[var(--border)]",
        "bg-[var(--popover)] text-[var(--popover-foreground)] p-3 pl-4 shadow-lg",
      )}
    >
      {/* Coloured accent bar */}
      <span className={cn("absolute inset-y-0 left-0 w-1.5", s.bar)} aria-hidden />

      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
          s.iconWrap,
        )}
      >
        <Icon className={cn("size-[18px]", s.icon)} />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{title}</p>
          {actor && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                s.badge,
              )}
            >
              {actor}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {message}
        </p>
        {meta && (
          <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
            {meta}
          </p>
        )}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={() => {
              onAction();
              toast.dismiss(toastId);
            }}
            className={cn(
              "mt-2 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-opacity",
              s.action,
            )}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => toast.dismiss(toastId)}
        aria-label="Dismiss notification"
        className={cn(
          "shrink-0 rounded-md p-1 text-muted-foreground/70 opacity-0 transition",
          "hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100",
        )}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * Fire a themed notification toast. Returns the sonner toast id.
 */
export function showNotificationToast(
  props: Omit<NotificationToastProps, "toastId">,
  options?: { duration?: number },
) {
  return toast.custom(
    (id) => <NotificationToast toastId={id} {...props} />,
    { duration: options?.duration ?? 6000 },
  );
}
