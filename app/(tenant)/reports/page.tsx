"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { todayIST, dateToIST } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/chart-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  FileText,
  Download,
  Calendar,
  Users,
  ShoppingCart,
  Truck,
  Wallet,
  CheckCircle,
  Loader2,
  AlertCircle as AlertCircleIcon,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import {
  useSalesReport,
  useCollectionReport,
  useFinancialReport,
  useCustomerReport,
  usePurchasesReport,
  reportKeys,
} from "@/lib/hooks";
import type { ReportFilter } from "@/lib/types";
import type {
  SalesReportData,
  CollectionReportData,
  FinancialReportData,
  CustomerReportData,
  PurchasesReportData,
} from "@/lib/api/services";
import { useTranslations } from "@/components/providers/intl-provider";

// --- Formatting helpers ---

function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function formatINRShort(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

function formatAxisINR(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_00_00_000) return `${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (abs >= 1_00_000) return `${(v / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
}

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}

// --- Chart theme (tokens are oklch — reference as var(--token), never hsl()) ---

const CHART = {
  blue: "var(--chart-1)", // revenue / primary series
  green: "var(--chart-2)", // collections / profit
  orange: "var(--chart-3)", // expenses / costs
  yellow: "var(--chart-4)",
  red: "var(--chart-5)",
  other: "var(--muted-foreground)", // "Other" bucket — neutral, never a series hue
};

const DONUT_COLORS = [CHART.blue, CHART.green, CHART.yellow, CHART.other];

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--foreground)",
  fontSize: "12px",
};

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  cheque: "Cheque",
  card: "Card",
  online: "Online",
  offline: "Offline",
  wallet: "Wallet",
  other: "Other",
};

// --- Shared states ---

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center space-y-3">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function ErrorState({ label, error }: { label: string; error: unknown }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon className="h-4 w-4" />
      <AlertDescription>
        {label} {(error as Error)?.message}
      </AlertDescription>
    </Alert>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-16">
      <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ReportTable({
  title,
  headers,
  align,
  rows,
  delay = 0.1,
}: {
  title: string;
  headers: string[];
  /** "l" | "r" per column; defaults to first left, rest right */
  align?: ("l" | "r")[];
  rows: (string | number)[][];
  delay?: number;
}) {
  const colAlign = (i: number) =>
    (align ? align[i] : i === 0 ? "l" : "r") === "l" ? "text-left" : "text-right";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass rounded-xl p-6"
    >
      <h3 className="text-base font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={`py-3 px-2 font-medium text-muted-foreground ${colAlign(i)}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <motion.tr
                key={ri}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(ri * 0.03, 0.4) }}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`py-3 px-2 tabular-nums ${colAlign(ci)} ${
                      ci === 0 ? "font-medium" : ""
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// --- Sales Tab ---

// Fixed pipeline order + a token dot per status (status colors are reserved:
// green = fulfilled, yellow = waiting, orange = in motion, red = cancelled)
const ORDER_STATUS_META: { key: string; label: string; dot: string }[] = [
  { key: "pending", label: "Pending", dot: CHART.yellow },
  { key: "confirmed", label: "Confirmed", dot: CHART.blue },
  { key: "processing", label: "Processing", dot: CHART.blue },
  { key: "dispatched", label: "Dispatched", dot: CHART.orange },
  { key: "delivered", label: "Delivered", dot: CHART.green },
  { key: "completed", label: "Completed", dot: CHART.green },
  { key: "cancelled", label: "Cancelled", dot: CHART.red },
];

function SalesTab({ filters }: { filters: ReportFilter }) {
  const { data, isLoading, error } = useSalesReport(filters);

  if (isLoading) return <LoadingState label="Loading sales report..." />;
  if (error) return <ErrorState label="Failed to load sales report." error={error} />;

  const statusBreakdown = data?.statusBreakdown ?? [];
  const allOrderCount = statusBreakdown.reduce((s, b) => s + b.count, 0);
  if (!data || allOrderCount === 0)
    return <EmptyState label="No orders in the selected period." />;

  const pipeline = ORDER_STATUS_META.map((m) => ({
    ...m,
    ...(statusBreakdown.find((b) => b.status === m.key) ?? { count: 0, value: 0 }),
  })).filter((p) => p.count > 0);
  const unfulfilledCount = allOrderCount - data.totalOrders;
  const dailyRevenue = data.dailyBreakdown?.map((d) => d.revenue) ?? [];

  return (
    <div className="space-y-6">
      {data.totalOrders === 0 && (
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            {unfulfilledCount.toLocaleString("en-IN")} order
            {unfulfilledCount === 1 ? "" : "s"} in this period, but none are delivered or
            completed yet — revenue counts only fulfilled orders. See the pipeline below.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatINRShort(data.totalSales)}
          description="delivered + completed orders"
          icon={IndianRupee}
          tone="primary"
          sparklineData={dailyRevenue}
        />
        <StatCard
          title="Fulfilled Orders"
          value={`${data.totalOrders.toLocaleString("en-IN")} / ${allOrderCount.toLocaleString("en-IN")}`}
          description="delivered + completed of all orders"
          icon={ShoppingCart}
          tone="cyan"
        />
        <StatCard
          title="Avg Order Value"
          value={formatINRShort(data.averageOrderValue)}
          description="revenue per fulfilled order"
          icon={TrendingUp}
          tone="emerald"
        />
      </div>

      {pipeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex flex-col gap-1 mb-4">
            <h3 className="text-base font-semibold leading-none tracking-tight">
              Order Pipeline
            </h3>
            <p className="text-sm text-muted-foreground">
              Every order in the period by current status
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pipeline.map((p) => (
              <div
                key={p.key}
                className="glass-subtle rounded-lg border border-border/50 px-4 py-3"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.dot }}
                  />
                  {p.label}
                </div>
                <div className="mt-1 text-lg font-bold tabular-nums">{p.count}</div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {formatINRShort(p.value)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {data.dailyBreakdown && data.dailyBreakdown.length > 0 && (
        <ChartCard title="Revenue Trend" description="Daily revenue in the selected period">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data.dailyBreakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesRevGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART.blue} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={CHART.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                tickFormatter={formatDayLabel}
              />
              <YAxis
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatAxisINR(Number(v))}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatINR(Number(value)), "Revenue"]}
                labelFormatter={(label) =>
                  new Date(`${label}T00:00:00`).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={CHART.blue}
                fill="url(#salesRevGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.dailyBreakdown && data.dailyBreakdown.length > 0 && (
          <ChartCard title="Orders per Day" description="Order volume in the selected period">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.dailyBreakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tickFormatter={formatDayLabel}
                />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  formatter={(value) => [Number(value), "Orders"]}
                  labelFormatter={(label) => formatDayLabel(String(label))}
                />
                <Bar dataKey="orders" fill={CHART.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {data.topProducts && data.topProducts.length > 0 && (
          <ChartCard title="Top Products" description="Revenue by product (top 10)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.topProducts}
                layout="vertical"
                margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatAxisINR(Number(v))}
                />
                <YAxis
                  type="category"
                  dataKey="productName"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  formatter={(value, _name, item) => [
                    `${formatINR(Number(value))} · ${item?.payload?.quantity ?? 0} units`,
                    "Revenue",
                  ]}
                />
                <Bar dataKey="revenue" fill={CHART.blue} radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {data.topShops && data.topShops.length > 0 && (
        <ReportTable
          title="Top Stores by Revenue"
          headers={["Store", "Orders", "Revenue", "Share"]}
          rows={data.topShops.map((s) => [
            s.shopName,
            s.orderCount,
            formatINR(s.revenue),
            data.totalSales > 0 ? `${((s.revenue / data.totalSales) * 100).toFixed(1)}%` : "—",
          ])}
        />
      )}
    </div>
  );
}

// --- Collections Tab ---

function CollectionsTab({ filters }: { filters: ReportFilter }) {
  const { data, isLoading, error } = useCollectionReport(filters);

  const donutData = useMemo(() => {
    const breakdown = data?.paymentTypeBreakdown ?? [];
    if (breakdown.length === 0) return [];
    const sorted = [...breakdown].sort((a, b) => b.collected - a.collected);
    const top = sorted.slice(0, 3).map((p) => ({
      name: PAYMENT_TYPE_LABELS[p.paymentType] ?? p.paymentType,
      value: p.collected,
      count: p.count,
    }));
    const rest = sorted.slice(3);
    if (rest.length > 0) {
      top.push({
        name: "Other",
        value: rest.reduce((s, p) => s + p.collected, 0),
        count: rest.reduce((s, p) => s + p.count, 0),
      });
    }
    return top.filter((d) => d.value > 0);
  }, [data]);

  if (isLoading) return <LoadingState label="Loading collection report..." />;
  if (error) return <ErrorState label="Failed to load collection report." error={error} />;
  if (!data || (data.totalCollected === 0 && data.totalOutstanding === 0))
    return <EmptyState label="No payments or outstanding invoices in the selected period." />;

  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Collected"
          value={formatINRShort(data.totalCollected)}
          description="completed payments"
          icon={IndianRupee}
          tone="emerald"
          sparklineData={data.dailyBreakdown?.map((d) => d.collected)}
        />
        <StatCard
          title="Outstanding"
          value={formatINRShort(data.totalOutstanding)}
          description="unpaid + partially paid invoices"
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          title="Collection Rate"
          value={`${data.collectionRate.toFixed(1)}%`}
          description="collected vs billed"
          icon={CheckCircle}
          tone="primary"
        />
        <StatCard
          title="Payments"
          value={(data.totalPayments ?? 0).toLocaleString("en-IN")}
          description="payment entries recorded"
          icon={Receipt}
          tone="cyan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {data.dailyBreakdown && data.dailyBreakdown.length > 0 && (
          <ChartCard
            title="Daily Collections"
            description="Amount collected per day"
            className="lg:col-span-3"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.dailyBreakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tickFormatter={formatDayLabel}
                />
                <YAxis
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatAxisINR(Number(v))}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  formatter={(value, _name, item) => [
                    `${formatINR(Number(value))} · ${item?.payload?.count ?? 0} payments`,
                    "Collected",
                  ]}
                  labelFormatter={(label) => formatDayLabel(String(label))}
                />
                <Bar dataKey="collected" fill={CHART.green} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {donutData.length > 0 && (
          <ChartCard
            title="Payment Modes"
            description="Collections by payment type"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="82%"
                  stroke="var(--card)"
                  strokeWidth={2}
                  paddingAngle={1}
                >
                  {donutData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name === "Other"
                          ? CHART.other
                          : DONUT_COLORS[Math.min(i, DONUT_COLORS.length - 1)]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name, item) => [
                    `${formatINR(Number(value))} · ${item?.payload?.count ?? 0} payments`,
                    name,
                  ]}
                />
                <Legend
                  formatter={(value: string, entry) => {
                    const v = (entry?.payload as { value?: number })?.value ?? 0;
                    const pct = donutTotal > 0 ? ((v / donutTotal) * 100).toFixed(0) : "0";
                    return (
                      <span className="text-xs text-foreground">
                        {value} · {pct}%
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.employeeBreakdown && data.employeeBreakdown.length > 0 && (
          <ReportTable
            title="Collections by Employee"
            headers={["Employee", "Payments", "Collected"]}
            rows={data.employeeBreakdown.map((e) => [
              e.employeeName,
              e.paymentCount,
              formatINR(e.collected),
            ])}
          />
        )}
        {data.shopkeeperBreakdown && data.shopkeeperBreakdown.length > 0 && (
          <ReportTable
            title="Top Paying Stores"
            headers={["Store", "Payments", "Paid"]}
            rows={data.shopkeeperBreakdown.map((s) => [
              s.shopkeeperName,
              s.paymentCount,
              formatINR(s.collected),
            ])}
            delay={0.15}
          />
        )}
      </div>
    </div>
  );
}

// --- Financial Tab ---

function FinancialTab({ filters }: { filters: ReportFilter }) {
  const { data, isLoading, error } = useFinancialReport(filters);

  if (isLoading) return <LoadingState label="Loading financial report..." />;
  if (error) return <ErrorState label="Failed to load financial report." error={error} />;
  if (!data || (data.totalRevenue === 0 && data.totalExpenses === 0))
    return <EmptyState label="No revenue or purchase expenses in the selected period." />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatINRShort(data.totalRevenue)}
          description="delivered + completed orders"
          icon={IndianRupee}
          tone="primary"
        />
        <StatCard
          title="Purchase Expenses"
          value={formatINRShort(data.totalExpenses)}
          description="stock purchases (net of subsidy)"
          icon={Wallet}
          tone="amber"
        />
        <StatCard
          title="Net Profit"
          value={formatINRShort(data.netProfit)}
          description="revenue − purchases"
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          title="Profit Margin"
          value={`${data.profitMargin.toFixed(1)}%`}
          description="of revenue"
          icon={BarChart3}
          tone="cyan"
        />
      </div>

      {data.monthlyBreakdown && data.monthlyBreakdown.length > 0 && (
        <ChartCard
          title="Monthly Profit & Loss"
          description="Purchase expenses vs revenue, with resulting profit"
        >
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={data.monthlyBreakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                tickFormatter={formatMonthLabel}
              />
              <YAxis
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatAxisINR(Number(v))}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                formatter={(value) => formatINR(Number(value))}
                labelFormatter={(label) => formatMonthLabel(String(label))}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="expenses" name="Expenses" fill={CHART.orange} radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="revenue" name="Revenue" fill={CHART.blue} radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="profit" name="Net Profit" fill={CHART.green} radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {data.revenueByProduct && data.revenueByProduct.length > 0 && (
        <ReportTable
          title="Revenue by Product"
          headers={["Product", "Revenue", "Share"]}
          rows={data.revenueByProduct.map((p) => [
            p.productName,
            formatINR(p.revenue),
            data.totalRevenue > 0
              ? `${((p.revenue / data.totalRevenue) * 100).toFixed(1)}%`
              : "—",
          ])}
        />
      )}
    </div>
  );
}

// --- Customers Tab ---

function CustomersTab({ filters }: { filters: ReportFilter }) {
  const { data, isLoading, error } = useCustomerReport(filters);

  if (isLoading) return <LoadingState label="Loading customer report..." />;
  if (error) return <ErrorState label="Failed to load customer report." error={error} />;
  if (!data || data.activeCustomers === 0)
    return <EmptyState label="No store activity in the selected period." />;

  const chartData = data.topCustomers.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Stores"
          value={data.activeCustomers.toLocaleString("en-IN")}
          description="stores that ordered in period"
          icon={Users}
          tone="primary"
        />
        <StatCard
          title="Revenue"
          value={formatINRShort(data.totalRevenue)}
          description="from all stores"
          icon={IndianRupee}
          tone="emerald"
        />
        <StatCard
          title="Avg Revenue / Store"
          value={formatINRShort(
            data.activeCustomers > 0 ? data.totalRevenue / data.activeCustomers : 0
          )}
          description="in selected period"
          icon={TrendingUp}
          tone="cyan"
        />
      </div>

      {chartData.length > 0 && (
        <ChartCard title="Top Stores" description="Revenue by store (top 10)">
          <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 34)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis
                type="number"
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatAxisINR(Number(v))}
              />
              <YAxis
                type="category"
                dataKey="shopkeeperName"
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                width={140}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                formatter={(value, _name, item) => [
                  `${formatINR(Number(value))} · ${item?.payload?.totalOrders ?? 0} orders`,
                  "Revenue",
                ]}
              />
              <Bar dataKey="totalRevenue" fill={CHART.blue} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ReportTable
        title="Store Performance"
        headers={["Store", "Orders", "Revenue", "Avg Order"]}
        rows={data.topCustomers.map((c) => [
          c.shopkeeperName,
          c.totalOrders,
          formatINR(c.totalRevenue),
          formatINR(c.averageOrderValue),
        ])}
      />
    </div>
  );
}

// --- Purchases Tab ---

function PurchasesTab({ filters }: { filters: ReportFilter }) {
  const { data, isLoading, error } = usePurchasesReport(filters);

  if (isLoading) return <LoadingState label="Loading purchases report..." />;
  if (error) return <ErrorState label="Failed to load purchases report." error={error} />;
  if (!data || data.summary.count === 0)
    return <EmptyState label="No purchases recorded in the selected period." />;

  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Purchases"
          value={summary.count.toLocaleString("en-IN")}
          description="purchase entries"
          icon={Truck}
          tone="primary"
        />
        <StatCard
          title="Basic Amount"
          value={formatINRShort(summary.basicAmount)}
          description="before tax and subsidy"
          icon={IndianRupee}
          tone="cyan"
        />
        <StatCard
          title="Tax"
          value={formatINRShort(summary.taxAmount)}
          description="GST on purchases"
          icon={Receipt}
          tone="amber"
        />
        <StatCard
          title="Net Spend"
          value={formatINRShort(summary.netAmount)}
          description={`after ₹${Math.round(summary.subsidy).toLocaleString("en-IN")} subsidy`}
          icon={Wallet}
          tone="emerald"
        />
      </div>

      {data.byAgency && data.byAgency.length > 0 && (
        <>
          <ChartCard title="Purchases by Agency" description="Net purchase spend per agency">
            <ResponsiveContainer width="100%" height={Math.max(200, data.byAgency.length * 40)}>
              <BarChart
                data={data.byAgency}
                layout="vertical"
                margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatAxisINR(Number(v))}
                />
                <YAxis
                  type="category"
                  dataKey="agencyName"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  tickFormatter={(v) => v || "Unassigned"}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  formatter={(value, _name, item) => [
                    `${formatINR(Number(value))} · ${item?.payload?.count ?? 0} purchases`,
                    "Net spend",
                  ]}
                />
                <Bar dataKey="netAmount" fill={CHART.blue} radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ReportTable
            title="Agency Purchase Details"
            headers={["Agency", "Purchases", "Basic", "Tax", "Subsidy", "Net"]}
            rows={data.byAgency.map((a) => [
              a.agencyName || "Unassigned",
              a.count,
              formatINR(a.basicAmount),
              formatINR(a.taxAmount),
              formatINR(a.subsidy),
              formatINR(a.netAmount),
            ])}
          />
        </>
      )}
    </div>
  );
}

// --- Date range presets ---

const PRESETS = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
] as const;

function daysAgoIST(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return dateToIST(d);
}

function monthStartIST(): string {
  return `${todayIST().slice(0, 7)}-01`;
}

// --- CSV export ---

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  // BOM so Excel opens ₹ and other UTF-8 characters correctly
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Main Reports Page ---

type TabKey = "sales" | "collections" | "financial" | "customers" | "purchases";

export default function ReportsPage() {
  const tPage = useTranslations("pages.reports");
  const queryClient = useQueryClient();

  const [dateFrom, setDateFrom] = useState(daysAgoIST(30));
  const [dateTo, setDateTo] = useState(todayIST());
  const [activeTab, setActiveTab] = useState<TabKey>("sales");

  const filters = useMemo<ReportFilter>(
    () => ({ dateFrom, dateTo }),
    [dateFrom, dateTo]
  );

  const activePreset = useMemo(() => {
    if (dateTo !== todayIST()) return null;
    if (dateFrom === monthStartIST()) return "month";
    const preset = PRESETS.find((p) => dateFrom === daysAgoIST(p.days));
    return preset?.key ?? null;
  }, [dateFrom, dateTo]);

  const applyPreset = (key: string, days?: number) => {
    setDateTo(todayIST());
    setDateFrom(key === "month" ? monthStartIST() : daysAgoIST(days ?? 30));
  };

  const handleExportCSV = () => {
    const range = `${dateFrom}_to_${dateTo}`;
    if (activeTab === "sales") {
      const d = queryClient.getQueryData<SalesReportData>(reportKeys.sales(filters));
      if (!d) return toast.error("Sales data is still loading — try again in a moment.");
      downloadCSV(
        `sales-report_${range}.csv`,
        ["Date", "Orders", "Revenue"],
        d.dailyBreakdown.map((r) => [r.date, r.orders, r.revenue])
      );
    } else if (activeTab === "collections") {
      const d = queryClient.getQueryData<CollectionReportData>(reportKeys.collection(filters));
      if (!d) return toast.error("Collection data is still loading — try again in a moment.");
      downloadCSV(
        `collections-report_${range}.csv`,
        ["Date", "Payments", "Collected"],
        d.dailyBreakdown.map((r) => [r.date, r.count ?? 0, r.collected])
      );
    } else if (activeTab === "financial") {
      const d = queryClient.getQueryData<FinancialReportData>(reportKeys.financial(filters));
      if (!d) return toast.error("Financial data is still loading — try again in a moment.");
      downloadCSV(
        `financial-report_${range}.csv`,
        ["Month", "Revenue", "Expenses", "Profit"],
        d.monthlyBreakdown.map((r) => [r.month, r.revenue, r.expenses, r.profit])
      );
    } else if (activeTab === "customers") {
      const d = queryClient.getQueryData<CustomerReportData>(reportKeys.customers(filters));
      if (!d) return toast.error("Customer data is still loading — try again in a moment.");
      downloadCSV(
        `customer-report_${range}.csv`,
        ["Store", "Orders", "Revenue", "Avg Order Value"],
        d.topCustomers.map((r) => [
          r.shopkeeperName,
          r.totalOrders,
          r.totalRevenue,
          Math.round(r.averageOrderValue),
        ])
      );
    } else {
      const d = queryClient.getQueryData<PurchasesReportData>(reportKeys.purchases(filters));
      if (!d) return toast.error("Purchases data is still loading — try again in a moment.");
      downloadCSV(
        `purchases-report_${range}.csv`,
        ["Agency", "Purchases", "Basic", "Tax", "Subsidy", "Net"],
        d.byAgency.map((r) => [
          r.agencyName || "Unassigned",
          r.count,
          r.basicAmount,
          r.taxAmount,
          r.subsidy,
          r.netAmount,
        ])
      );
    }
    toast.success("Report exported");
  };

  return (
    <div className="space-y-6">
      <PageHeader title={tPage("title")} description={tPage("description")} />

      {/* Date Range & Export Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-xl p-4 print:hidden"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key, p.days)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    activePreset === p.key
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/60 text-muted-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => applyPreset("month")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  activePreset === "month"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/60 text-muted-foreground"
                }`}
              >
                This Month
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={(e) => setDateFrom(e.target.value)}
                className="glass-subtle rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                max={todayIST()}
                onChange={(e) => setDateTo(e.target.value)}
                className="glass-subtle rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted/60 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Print / PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabbed Sections */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="w-full sm:w-auto flex-wrap h-auto">
          <TabsTrigger value="sales" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="collections" className="gap-1.5">
            <IndianRupee className="h-4 w-4" />
            Collections
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-1.5">
            <Wallet className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5">
            <Users className="h-4 w-4" />
            Stores
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-1.5">
            <Truck className="h-4 w-4" />
            Purchases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          <SalesTab filters={filters} />
        </TabsContent>
        <TabsContent value="collections" className="mt-6">
          <CollectionsTab filters={filters} />
        </TabsContent>
        <TabsContent value="financial" className="mt-6">
          <FinancialTab filters={filters} />
        </TabsContent>
        <TabsContent value="customers" className="mt-6">
          <CustomersTab filters={filters} />
        </TabsContent>
        <TabsContent value="purchases" className="mt-6">
          <PurchasesTab filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
