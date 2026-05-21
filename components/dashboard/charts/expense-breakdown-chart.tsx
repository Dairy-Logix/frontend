"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip, CHART_PALETTE, formatINR } from "./chart-tooltip";
import type { ExpenseBreakdown } from "@/lib/types";

interface Props {
  data: ExpenseBreakdown;
}

export function ExpenseBreakdownChart({ data }: Props) {
  const chartData = data.categories.map((c) => ({
    name: c.label,
    value: c.amount,
    percentage: c.percentage,
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-4 items-center">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
            stroke="var(--card)"
            strokeWidth={3}
            isAnimationActive
            animationDuration={900}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            content={
              <ChartTooltip
                formatter={(v, name) => {
                  const c = chartData.find((d) => d.name === name);
                  return c
                    ? `${formatINR(Number(v))} (${c.percentage}%)`
                    : formatINR(Number(v));
                }}
              />
            }
          />
          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="13"
            fill="var(--muted-foreground)"
          >
            Total
          </text>
          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="16"
            fontWeight="700"
            fill="var(--foreground)"
          >
            {formatINR(data.total)}
          </text>
        </PieChart>
      </ResponsiveContainer>

      <ul className="space-y-2 text-sm">
        {data.categories.map((c, i) => (
          <li key={c.category} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="inline-block size-2.5 rounded-sm shrink-0"
                style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }}
              />
              <span className="text-muted-foreground truncate">{c.label}</span>
            </div>
            <span className="font-medium text-foreground tabular-nums">
              {c.percentage}%
            </span>
          </li>
        ))}
        {data.categories.length === 0 && (
          <li className="text-muted-foreground text-sm">No expenses recorded.</li>
        )}
      </ul>
    </div>
  );
}
