"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip, CHART_COLORS, formatCompact } from "./chart-tooltip";
import type { ReceivablesAgingPoint } from "@/lib/types";

interface Props {
  data: ReceivablesAgingPoint[];
}

export function ReceivablesAgingChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="bucket"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCompact(Number(v))}
        />
        <Tooltip
          content={<ChartTooltip formatter={(v) => formatCompact(Number(v))} />}
          cursor={{ fill: "var(--muted)", fillOpacity: 0.35 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} iconType="circle" />
        <Bar
          dataKey="Paid"
          stackId="aging"
          fill={CHART_COLORS.c3}
          isAnimationActive
          animationDuration={900}
        />
        <Bar
          dataKey="Partial"
          stackId="aging"
          fill={CHART_COLORS.c4}
          isAnimationActive
          animationDuration={900}
        />
        <Bar
          dataKey="Unpaid"
          stackId="aging"
          fill={CHART_COLORS.destructive}
          radius={[6, 6, 0, 0]}
          isAnimationActive
          animationDuration={900}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
