"use client";

import { useState } from "react";
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
import { Package, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTopProducts } from "@/lib/hooks/use-dashboard";
import {
  ChartTooltip,
  CHART_PALETTE,
  formatINR,
  formatCompact,
} from "./charts/chart-tooltip";
import type { TopProductsCriterion, TopProductPoint } from "@/lib/types";

const CRITERIA: Array<{
  value: TopProductsCriterion;
  label: string;
  description: string;
}> = [
  { value: "revenue", label: "Revenue", description: "Sales total this month" },
  { value: "quantity", label: "Quantity", description: "Units sold this month" },
  { value: "profit", label: "Profit", description: "Revenue minus product cost" },
  { value: "margin", label: "Margin %", description: "Profit margin per product" },
];

interface Props {
  className?: string;
  /** Optional shared agency filter (otherwise all agencies). */
  agencyId?: string;
}

export function TopProductsCard({ className, agencyId }: Props) {
  const [criterion, setCriterion] = useState<TopProductsCriterion>("revenue");
  const { data, isLoading, isFetching } = useTopProducts({
    criterion,
    days: 30,
    limit: 10,
    agencyId,
  });

  const meta = CRITERIA.find((c) => c.value === criterion)!;
  const products = data?.products ?? [];
  const fetching = isFetching && !isLoading;

  return (
    <div className={cn("glass rounded-xl p-6 flex flex-col gap-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="text-base font-semibold leading-none tracking-tight">
            Top Products
          </h3>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {fetching && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
          <Select
            value={criterion}
            onValueChange={(v) => setCriterion(v as TopProductsCriterion)}
          >
            <SelectTrigger className="h-8 min-w-[130px]" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CRITERIA.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  By {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full min-h-0">
        {isLoading ? (
          <div className="h-[280px] animate-pulse rounded-md bg-muted/30" />
        ) : products.length === 0 ? (
          <ChartEmpty />
        ) : (
          <Chart products={products} criterion={criterion} />
        )}
      </div>
    </div>
  );
}

function Chart({
  products,
  criterion,
}: {
  products: TopProductPoint[];
  criterion: TopProductsCriterion;
}) {
  const height = Math.max(280, products.length * 36);
  const valueKey = criterion;
  const formatter = (v: number) =>
    criterion === "margin"
      ? `${v.toFixed(1)}%`
      : criterion === "quantity"
        ? `${v.toLocaleString("en-IN")} units`
        : formatINR(v);
  const axisFormatter = (v: number) =>
    criterion === "margin"
      ? `${v}%`
      : criterion === "quantity"
        ? formatCompact(v)
        : formatCompact(v);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={products}
        layout="vertical"
        margin={{ top: 8, right: 72, left: 12, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => axisFormatter(Number(v))}
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
          content={
            <ChartTooltip
              formatter={(v) => formatter(Number(v))}
            />
          }
          cursor={{ fill: "var(--muted)", fillOpacity: 0.35 }}
        />
        <Bar
          dataKey={valueKey}
          name={CRITERIA.find((c) => c.value === criterion)!.label}
          radius={[0, 8, 8, 0]}
          isAnimationActive
          animationDuration={900}
        >
          {products.map((_, i) => (
            <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
          ))}
          <LabelList
            dataKey={valueKey}
            position="right"
            fill="var(--foreground)"
            fontSize={11}
            fontWeight={600}
            formatter={(v: unknown) => formatter(Number(v))}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
      <Package className="h-10 w-10 mb-3 opacity-30" />
      <p className="text-sm font-medium">No product sales yet</p>
      <p className="text-xs mt-1 opacity-60">
        Data will appear here once orders come in
      </p>
    </div>
  );
}
