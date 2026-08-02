"use client";

import { useState, useMemo } from "react";
import { todayIST, dateToIST } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/chart-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  FileText,
  Download,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wallet,
  Loader2,
  AlertCircle as AlertCircleIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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
} from "@/lib/hooks";
import type { ReportFilter } from "@/lib/types";
import { useTranslations } from "@/components/providers/intl-provider";

// --- Helpers ---

function formatCurrency(amount: number): string {
  return `INR ${amount.toLocaleString("en-IN")}`;
}

function formatCurrencyShort(amount: number): string {
  if (amount >= 1_00_000) return `INR ${(amount / 1_00_000).toFixed(1)}L`;
  if (amount >= 1_000) return `INR ${(amount / 1_000).toFixed(0)}K`;
  return `INR ${amount.toLocaleString("en-IN")}`;
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
};

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  destructive: "hsl(var(--destructive))",
  green: "hsl(142 76% 36%)",
  amber: "hsl(38 92% 50%)",
};

const AGING_COLORS = [
  CHART_COLORS.green,
  CHART_COLORS.amber,
  "hsl(25 95% 53%)",
  CHART_COLORS.destructive,
];

// --- Sales Tab ---

function SalesTab({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  const { data: salesData, isLoading, error } = useSalesReport({ dateFrom, dateTo });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading sales report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertDescription>
          Failed to load sales report. {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!salesData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No sales data available for the selected period.</p>
      </div>
    );
  }

  const totalRevenue = salesData.totalSales || 0;
  const totalOrders = salesData.totalOrders || 0;
  const avgOrderValue = salesData.averageOrderValue || 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrencyShort(totalRevenue)}
          description="in selected period"
          icon={IndianRupee}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          description="orders placed"
          icon={BarChart3}
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrencyShort(Math.round(avgOrderValue))}
          description="per order"
          icon={TrendingUp}
        />
      </div>

      {/* Revenue Trend Line Chart */}
      {salesData.dailyBreakdown && salesData.dailyBreakdown.length > 0 && (
        <ChartCard
          title="Revenue Trend"
          description="Daily revenue over the selected period"
        >
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={salesData.dailyBreakdown}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                }
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={CHART_COLORS.primary}
                strokeWidth={2.5}
                dot={{ r: 3, fill: CHART_COLORS.primary }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Product Sales Bar Chart */}
      {salesData.topProducts && salesData.topProducts.length > 0 && (
        <ChartCard
          title="Product-wise Sales"
          description="Revenue breakdown by product"
        >
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={salesData.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}K`}
              />
              <YAxis
                type="category"
                dataKey="productName"
                tick={{ fontSize: 11 }}
                width={140}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
              />
              <Bar
                dataKey="revenue"
                fill={CHART_COLORS.primary}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Top Stores Table */}
      {salesData.topShops && salesData.topShops.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-base font-semibold mb-4">Top Stores by Revenue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    Store
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                    Orders
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesData.topShops.map((store, i) => (
                  <motion.tr
                    key={store.shopId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-2 font-medium">{store.shopName}</td>
                    <td className="py-3 px-2 text-right">{store.orderCount}</td>
                    <td className="py-3 px-2 text-right">
                      {formatCurrency(store.revenue)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// --- Collections Tab ---

function CollectionsTab({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  const { data: collectionData, isLoading, error } = useCollectionReport({ dateFrom, dateTo });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading collection report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertDescription>
          Failed to load collection report. {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!collectionData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No collection data available for the selected period.</p>
      </div>
    );
  }

  const totalCollected = collectionData.totalCollected || 0;
  const totalOutstanding = collectionData.totalOutstanding || 0;
  const collectionRate = collectionData.collectionRate || 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Collected"
          value={formatCurrencyShort(totalCollected)}
          description="in selected period"
          icon={IndianRupee}
        />
        <StatCard
          title="Total Outstanding"
          value={formatCurrencyShort(totalOutstanding)}
          description="pending collections"
          icon={TrendingUp}
        />
        <StatCard
          title="Collection Rate"
          value={`${collectionRate.toFixed(1)}%`}
          description="efficiency rate"
          icon={CheckCircle}
        />
      </div>

      {/* Collection Efficiency Area Chart */}
      {collectionData.dailyBreakdown && collectionData.dailyBreakdown.length > 0 && (
        <ChartCard
          title="Collection Trend"
          description="Daily collection amounts over the selected period"
        >
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={collectionData.dailyBreakdown}>
              <defs>
                <linearGradient
                  id="collectedGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={CHART_COLORS.green}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS.green}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatCurrency(Number(value))]}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })
                }
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="collected"
                stroke={CHART_COLORS.green}
                fill="url(#collectedGradient)"
                strokeWidth={2}
                name="Collected"
              />
              <Area
                type="monotone"
                dataKey="outstanding"
                stroke={CHART_COLORS.destructive}
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Outstanding"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Employee Performance Table */}
      {collectionData.employeeBreakdown && collectionData.employeeBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-base font-semibold mb-4">
            Employee Collection Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    Employee
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                    Collected
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                    Payments
                  </th>
                </tr>
              </thead>
              <tbody>
                {collectionData.employeeBreakdown.map((emp, i) => (
                  <motion.tr
                    key={emp.employeeId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-2 font-medium">{emp.employeeName}</td>
                    <td className="py-3 px-2 text-right">
                      {formatCurrency(emp.collected)}
                    </td>
                    <td className="py-3 px-2 text-right">{emp.paymentCount}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// --- Financial Tab ---

function FinancialTab({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  const { data: financialData, isLoading, error } = useFinancialReport({ dateFrom, dateTo });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading financial report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertDescription>
          Failed to load financial report. {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!financialData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No financial data available for the selected period.</p>
      </div>
    );
  }

  const totalRevenue = financialData.totalRevenue || 0;
  const totalExpenses = financialData.totalExpenses || 0;
  const netProfit = financialData.netProfit || 0;
  const profitMargin = financialData.profitMargin || 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrencyShort(totalRevenue)}
          description="in selected period"
          icon={IndianRupee}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrencyShort(totalExpenses)}
          description="operational costs"
          icon={Wallet}
        />
        <StatCard
          title="Net Profit"
          value={formatCurrencyShort(netProfit)}
          description="after expenses"
          icon={TrendingUp}
        />
        <StatCard
          title="Profit Margin"
          value={`${profitMargin.toFixed(1)}%`}
          description="profitability rate"
          icon={BarChart3}
        />
      </div>

      {/* Monthly P&L Bar Chart */}
      {financialData.monthlyBreakdown && financialData.monthlyBreakdown.length > 0 && (
        <ChartCard
          title="Monthly Profit & Loss"
          description="Revenue vs expenses over time"
        >
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={financialData.monthlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatCurrency(Number(value))]}
              />
              <Legend />
              <Bar
                dataKey="expenses"
                fill={CHART_COLORS.destructive}
                radius={[4, 4, 0, 0]}
                name="Expenses"
                opacity={0.7}
              />
              <Bar
                dataKey="revenue"
                fill={CHART_COLORS.green}
                radius={[4, 4, 0, 0]}
                name="Revenue"
              />
              <Bar
                dataKey="profit"
                fill={CHART_COLORS.primary}
                radius={[4, 4, 0, 0]}
                name="Net Profit"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Revenue by Product Table */}
      {financialData.revenueByProduct && financialData.revenueByProduct.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-base font-semibold mb-4">
            Revenue by Product
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    Product
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                    Revenue
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                    Cost
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                    Profit
                  </th>
                </tr>
              </thead>
              <tbody>
                {financialData.revenueByProduct.map((product, i) => (
                  <motion.tr
                    key={product.productId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-2 font-medium">{product.productName}</td>
                    <td className="py-3 px-2 text-right">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="py-3 px-2 text-right text-destructive">
                      {formatCurrency(product.cost)}
                    </td>
                    <td className="py-3 px-2 text-right text-emerald-500 font-semibold">
                      {formatCurrency(product.profit)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// --- Main Reports Page ---

export default function ReportsPage() {
  const tPage = useTranslations("pages.reports");
  // Default to last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(dateToIST(thirtyDaysAgo));
  const [dateTo, setDateTo] = useState(todayIST());

  return (
    <div className="space-y-6">
      <PageHeader
        title={tPage("title")}
        description={tPage("description")}
      />

      {/* Date Range & Export Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="glass-subtle rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="glass-subtle rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 transition-all shadow-sm">
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 transition-all shadow-sm">
              <Download className="h-4 w-4" />
              Export Excel
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabbed Sections */}
      <Tabs defaultValue="sales">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="sales" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="collections" className="gap-1.5">
            <IndianRupee className="h-4 w-4" />
            Collections
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-1.5">
            <Users className="h-4 w-4" />
            Financial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          <SalesTab dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="collections" className="mt-6">
          <CollectionsTab dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <FinancialTab dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
