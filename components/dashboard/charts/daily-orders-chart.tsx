"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { ChartTooltip, CHART_COLORS } from "./chart-tooltip";
import type { DailyOrdersPoint } from "@/lib/types";

interface Props {
  data: DailyOrdersPoint[];
}

export function DailyOrdersChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 28, right: 16, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="dailyOrdersFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.c1} stopOpacity={0.45} />
            <stop offset="100%" stopColor={CHART_COLORS.c1} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: CHART_COLORS.primary, strokeOpacity: 0.25, strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="orders"
          name="Orders"
          stroke={CHART_COLORS.c1}
          strokeWidth={2.5}
          fill="url(#dailyOrdersFill)"
          dot={{ r: 4, fill: CHART_COLORS.c1, stroke: "var(--card)", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: CHART_COLORS.c1, stroke: "var(--card)", strokeWidth: 2 }}
          isAnimationActive
          animationDuration={900}
        >
          <LabelList
            dataKey="orders"
            position="top"
            fill="var(--foreground)"
            fontSize={11}
            fontWeight={600}
            offset={10}
          />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  );
}
