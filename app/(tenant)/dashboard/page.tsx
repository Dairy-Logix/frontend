"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/chart-card";
import {
  ShoppingCart,
  IndianRupee,
  Truck,
  Store,
  Users,
  Clock,
  CreditCard,
  TrendingUp,
  Loader2,
  AlertCircle,
  BarChart3,
  Package,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTenantDashboard } from "@/lib/hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { AnalyticsData } from "@/lib/types";

function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "0";
  if (amount >= 1_00_000) return `${(amount / 1_00_000).toFixed(1)}L`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString("en-IN");
}

/** Check if an AnalyticsData object has meaningful chart data */
function hasChartData(chart: AnalyticsData | undefined | null): boolean {
  if (!chart?.labels?.length) return false;
  return chart.datasets?.some((ds) => ds.data?.some((v) => v > 0)) ?? false;
}

/** Empty state placeholder for charts */
function ChartEmptyState({ icon: Icon, message }: { icon: typeof BarChart3; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
      <Icon className="h-10 w-10 mb-3 opacity-30" />
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs mt-1 opacity-60">Data will appear here once available</p>
    </div>
  );
}

export default function TenantDashboardPage() {
  const { data: dashboardData, isLoading, error, refetch } = useTenantDashboard();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dashboardData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Overview of orders, deliveries, and collections"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load dashboard data. {error?.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of orders, deliveries, and collections"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Orders"
          value={dashboardData.ordersToday ?? 0}
          description="orders placed today"
          icon={ShoppingCart}
        />
        <StatCard
          title="Pending Deliveries"
          value={dashboardData.pendingDeliveries ?? 0}
          description="awaiting dispatch"
          icon={Truck}
        />
        <StatCard
          title="Revenue This Month"
          value={`INR ${formatCurrency(dashboardData.revenueThisMonth)}`}
          description="total collections"
          icon={IndianRupee}
        />
        <StatCard
          title="Outstanding"
          value={`INR ${formatCurrency(dashboardData.outstandingPayments)}`}
          description="pending payments"
          icon={CreditCard}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Stores"
          value={dashboardData.totalShopkeepers ?? 0}
          description="registered shops"
          icon={Store}
        />
        <StatCard
          title="Active Employees"
          value={dashboardData.activeEmployees ?? 0}
          description="field agents"
          icon={Users}
        />
        <StatCard
          title="Pending Collections"
          value={dashboardData.pendingCollections ?? 0}
          description="payments to collect"
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Daily Orders" description="Order count over the last 14 days">
          {hasChartData(dashboardData.dailyOrderTrend) ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dashboardData.dailyOrderTrend.labels.map((label, index) => ({
                date: label,
                orders: dashboardData.dailyOrderTrend.datasets[0]?.data[index] || 0
              }))}>
                <defs>
                  <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.split(" ")[0]} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [value, "Orders"]}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--primary))"
                  fill="url(#orderGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState icon={ShoppingCart} message="No orders yet" />
          )}
        </ChartCard>

        <ChartCard title="Collection vs Outstanding" description="Last 7 days payment trend">
          {hasChartData(dashboardData.collectionVsOutstanding) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dashboardData.collectionVsOutstanding.labels.map((label, index) => ({
                date: label,
                collected: dashboardData.collectionVsOutstanding.datasets[0]?.data[index] || 0,
                outstanding: dashboardData.collectionVsOutstanding.datasets[1]?.data[index] || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.split(" ")[0]} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`INR ${Number(value).toLocaleString("en-IN")}`, undefined]}
                />
                <Legend />
                <Bar dataKey="collected" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Collected" />
                <Bar dataKey="outstanding" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Outstanding" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState icon={IndianRupee} message="No payment data yet" />
          )}
        </ChartCard>
      </div>

      {/* Product Sales + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Top Products" description="Revenue by product this month" className="lg:col-span-2">
          {hasChartData(dashboardData.productSales) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dashboardData.productSales.labels.map((label, index) => ({
                productName: label,
                totalRevenue: dashboardData.productSales.datasets[0]?.data[index] || 0
              }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="productName" tick={{ fontSize: 12 }} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`INR ${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState icon={Package} message="No product sales yet" />
          )}
        </ChartCard>

        {/* Recent Activity */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-base font-semibold mb-4">Recent Activity</h3>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No recent activity</p>
            <p className="text-xs mt-1 opacity-60">Activity will appear here as orders come in</p>
          </div>
        </div>
      </div>
    </div>
  );
}
