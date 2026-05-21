"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartTooltip, CHART_COLORS, formatINR, formatCompact } from "./chart-tooltip";
import type { SalesPurchaseMarginPoint } from "@/lib/types";

interface Props {
  data: SalesPurchaseMarginPoint[];
}

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: SalesPurchaseMarginPoint;
}

interface SpmTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}

function SpmTooltip({ active, payload, label }: SpmTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg p-3 text-sm min-w-[200px]">
      <div className="flex items-center justify-between mb-2 gap-3">
        <p className="font-medium text-foreground">{String(label)}</p>
        {point.estimated && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            Est.
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <Row color={CHART_COLORS.c1} label="Sales" value={formatINR(point.sales)} />
        <Row
          color={CHART_COLORS.c3}
          label={point.estimated ? "Purchase (est.)" : "Purchase"}
          value={formatINR(point.purchase)}
        />
        <div className="border-t border-border my-1.5" />
        <Row
          color={CHART_COLORS.c4}
          label="Margin"
          value={`${point.margin.toFixed(1)}%`}
        />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Profit</span>
          <span
            className={`font-semibold tabular-nums ${
              point.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatINR(point.profit)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-2.5 h-2.5 rounded-sm"
        style={{ background: color }}
      />
      <span className="text-muted-foreground flex-1">{label}:</span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export function SalesPurchaseMarginChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="salesBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.c1} stopOpacity={1} />
            <stop offset="100%" stopColor={CHART_COLORS.c1} stopOpacity={0.55} />
          </linearGradient>
          <linearGradient id="purchaseBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.c3} stopOpacity={1} />
            <stop offset="100%" stopColor={CHART_COLORS.c3} stopOpacity={0.55} />
          </linearGradient>
          <pattern id="estimatedPattern" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={CHART_COLORS.c3} fillOpacity={0.55} />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--card)" strokeWidth="2" />
          </pattern>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCompact(Number(v))}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<SpmTooltip />} cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} iconType="circle" />
        <Bar
          yAxisId="left"
          dataKey="sales"
          name="Sales"
          fill={CHART_COLORS.c1}
          radius={[6, 6, 0, 0]}
          isAnimationActive
          animationDuration={900}
        >
          {data.map((_, i) => (
            <Cell key={i} fill="url(#salesBar)" />
          ))}
        </Bar>
        <Bar
          yAxisId="left"
          dataKey="purchase"
          name="Purchase"
          fill={CHART_COLORS.c3}
          radius={[6, 6, 0, 0]}
          isAnimationActive
          animationDuration={900}
        >
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.estimated ? "url(#estimatedPattern)" : "url(#purchaseBar)"}
            />
          ))}
        </Bar>
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="margin"
          name="Margin"
          stroke={CHART_COLORS.c4}
          strokeWidth={2.5}
          dot={{ r: 4, fill: CHART_COLORS.c4, stroke: "var(--card)", strokeWidth: 2 }}
          activeDot={{ r: 6 }}
          isAnimationActive
          animationDuration={900}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
