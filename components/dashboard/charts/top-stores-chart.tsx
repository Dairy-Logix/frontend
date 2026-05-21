"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { ChartTooltip, CHART_PALETTE, formatCompact } from "./chart-tooltip";
import type { TopStorePoint } from "@/lib/types";

interface Props {
  data: TopStorePoint[];
}

export function TopStoresChart({ data }: Props) {
  const height = Math.max(280, data.length * 36);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 64, left: 12, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCompact(Number(v))}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: "var(--foreground)" }}
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <Tooltip
          content={<ChartTooltip formatter={(v) => formatCompact(Number(v))} />}
          cursor={{ fill: "var(--muted)", fillOpacity: 0.35 }}
        />
        <Bar
          dataKey="revenue"
          name="Revenue"
          radius={[0, 8, 8, 0]}
          isAnimationActive
          animationDuration={900}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
          ))}
          <LabelList
            dataKey="revenue"
            position="right"
            fill="var(--foreground)"
            fontSize={11}
            fontWeight={600}
            formatter={(v: unknown) => formatCompact(Number(v))}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
