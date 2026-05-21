"use client";

/**
 * Theme tokens are defined as oklch(...) values, so they must be referenced
 * via var(--token) directly — not wrapped in hsl().
 */
export const CHART_COLORS = {
  c1: "var(--chart-1)",
  c2: "var(--chart-2)",
  c3: "var(--chart-3)",
  c4: "var(--chart-4)",
  c5: "var(--chart-5)",
  primary: "var(--primary)",
  accent: "var(--accent)",
  destructive: "var(--destructive)",
  muted: "var(--muted-foreground)",
} as const;

export const CHART_PALETTE = [
  CHART_COLORS.c1,
  CHART_COLORS.c2,
  CHART_COLORS.c3,
  CHART_COLORS.c4,
  CHART_COLORS.c5,
  CHART_COLORS.accent,
  CHART_COLORS.destructive,
  "var(--primary-light, var(--primary))",
];

type Formatter = (value: number, name: string) => string;

interface TooltipPayloadEntry {
  value?: number | string;
  name?: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
  formatter?: Formatter;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg p-3 text-sm">
      {label !== undefined && (
        <p className="font-medium text-foreground mb-1.5">{String(label)}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {formatter
                ? formatter(Number(entry.value ?? 0), String(entry.name ?? ""))
                : Number(entry.value ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function formatINR(value: number): string {
  if (!value) return "0";
  if (value >= 1_00_000) return `INR ${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `INR ${(value / 1_000).toFixed(1)}K`;
  return `INR ${value.toLocaleString("en-IN")}`;
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_00_000) return `${(value / 1_00_000).toFixed(1)}L`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString("en-IN");
}
