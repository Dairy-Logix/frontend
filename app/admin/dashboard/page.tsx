"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/chart-card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Building2,
  Store,
  ShoppingCart,
  IndianRupee,
  Truck,
  TrendingUp,
  Clock,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSuperAdminDashboard, useTenants } from "@/lib/hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

const activityTypeIcons: Record<string, typeof Building2> = {
  tenant_signup: Building2,
  order_placed: ShoppingCart,
  payment_collected: IndianRupee,
  delivery_completed: Truck,
  plan_upgrade: TrendingUp,
  tenant_suspended: Building2,
  employee_added: Users,
  invoice_generated: IndianRupee,
};

const activityTypeColorMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  tenant_signup: { label: "Signup", variant: "info" },
  order_placed: { label: "Order", variant: "success" },
  payment_collected: { label: "Payment", variant: "success" },
  delivery_completed: { label: "Delivery", variant: "info" },
  plan_upgrade: { label: "Upgrade", variant: "warning" },
  tenant_suspended: { label: "Suspended", variant: "error" },
  employee_added: { label: "Employee", variant: "default" },
  invoice_generated: { label: "Invoice", variant: "default" },
};

const tenantStatusMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "default" },
  suspended: { label: "Suspended", variant: "error" },
};

function formatCurrency(amount: number): string {
  if (amount >= 1_00_000) {
    return `${(amount / 1_00_000).toFixed(1)}L`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return amount.toLocaleString("en-IN");
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PlatformDashboardPage() {
  const router = useRouter();
  const { data: dashboardData, isLoading, error, refetch } = useSuperAdminDashboard();
  const { data: tenantsData } = useTenants({ page: 1, pageSize: 10, sortBy: 'createdAt', sortOrder: 'desc' });

  // Compute growth trends from tenantGrowth data
  const computeGrowth = (data: number[] | undefined): { value: number; isPositive: boolean } | undefined => {
    if (!data || data.length < 2) return undefined;
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    if (previous === 0) return { value: 0, isPositive: true };
    const growth = ((current - previous) / previous) * 100;
    return { value: Math.abs(parseFloat(growth.toFixed(1))), isPositive: growth >= 0 };
  };

  const tenantGrowthTrend = computeGrowth(dashboardData?.tenantGrowth?.datasets?.[0]?.data);

  // Sparkline data from tenant growth
  const tenantSparkline = dashboardData?.tenantGrowth?.datasets?.[0]?.data;
  const revenueSparkline = dashboardData?.tenantGrowth?.datasets?.[0]?.data?.map((v) => v * 100000);

  // Platform health data for radial gauge
  const activeRatio = dashboardData
    ? Math.round((dashboardData.activeTenants / Math.max(dashboardData.totalTenants, 1)) * 100)
    : 0;
  const platformHealthData = [
    { name: "Active", value: activeRatio, fill: "#10b981" },
  ];

  // Subscription plan distribution (derived from tenants data)
  const planDistribution = (() => {
    if (!tenantsData?.data) return [];
    const planCounts: Record<string, number> = {};
    tenantsData.data.forEach((t) => {
      const plan = t.subscriptionPlan || t.plan || "basic";
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });
    return Object.entries(planCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  })();

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
          title="Platform Dashboard"
          description="Overview of all tenants and platform metrics"
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
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="Platform Dashboard"
        description="Overview of all tenants and platform metrics"
      />

      {/* Stat Cards with Sparklines */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        <StatCard
          title="Total Tenants"
          value={dashboardData.totalTenants}
          description="across all plans"
          icon={Building2}
          trend={tenantGrowthTrend}
          sparklineData={tenantSparkline}
        />
        <StatCard
          title="Active Tenants"
          value={dashboardData.activeTenants}
          description={`${dashboardData.totalTenants - dashboardData.activeTenants} inactive/suspended`}
          icon={Building2}
          trend={dashboardData.totalTenants > 0
            ? { value: parseFloat(((dashboardData.activeTenants / dashboardData.totalTenants) * 100).toFixed(1)), isPositive: true }
            : undefined
          }
        />
        <StatCard
          title="Total Stores"
          value={dashboardData.totalShopkeepers.toLocaleString("en-IN")}
          description="across all tenants"
          icon={Store}
        />
        <StatCard
          title="Total Revenue"
          value={`INR ${formatCurrency(dashboardData.revenueOverview)}`}
          description="platform-wide"
          icon={IndianRupee}
          sparklineData={revenueSparkline}
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={itemVariants}>
        <ChartCard title="Revenue Trend" description="Monthly revenue across all tenants">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dashboardData.tenantGrowth?.datasets?.[0]?.data?.map((value, index) => ({
              month: dashboardData.tenantGrowth.labels[index],
              revenue: value * 100000
            })) || []}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={(v) => v?.split(" ")[0]}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={(v) => `${(v / 1_00_000).toFixed(0)}L`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => [`INR ${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fill="url(#revenueGradient)"
                strokeWidth={2}
                isAnimationActive={true}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tenant Growth" description="Cumulative tenant count over time">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dashboardData.tenantGrowth?.labels?.map((label, index) => ({
              month: label,
              tenants: dashboardData.tenantGrowth.datasets[0]?.data[index] || 0
            })) || []}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={(v) => v?.split(" ")[0]}
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => [value, "Tenants"]}
              />
              <Bar
                dataKey="tenants"
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* New Charts Row: Platform Health + Plan Distribution */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={itemVariants}>
        <ChartCard title="Platform Health" description="Active tenant ratio">
          <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              barSize={20}
              data={platformHealthData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                isAnimationActive={true}
                animationDuration={1500}
              />
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-3xl font-bold"
              >
                {activeRatio}%
              </text>
              <text
                x="50%"
                y="58%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-xs"
              >
                Active Tenants
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Subscription Plans" description="Distribution across plan tiers">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={planDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                labelLine={{ strokeWidth: 1 }}
                isAnimationActive={true}
                animationDuration={1500}
              >
                {planDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => [value, "Tenants"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Bottom Row: Tenant Stats + Activity */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4" variants={itemVariants}>
        {/* Tenant Stats Table */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <h3 className="text-base font-semibold mb-4">Tenant Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-3 font-medium">Tenant</th>
                  <th className="text-right pb-3 font-medium">Orders</th>
                  <th className="text-right pb-3 font-medium">Revenue</th>
                  <th className="text-right pb-3 font-medium">Shops</th>
                  <th className="text-center pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenantsData && tenantsData.data?.length > 0 ? (
                  tenantsData.data.slice(0, 10).map((tenant) => (
                    <motion.tr
                      key={tenant._id || tenant.id}
                      whileHover={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
                      className="border-b last:border-0 cursor-pointer"
                      onClick={() => router.push(`/admin/tenants/${tenant._id || tenant.id}`)}
                    >
                      <td className="py-3 font-medium">{tenant.companyName || tenant.name}</td>
                      <td className="py-3 text-right">-</td>
                      <td className="py-3 text-right">-</td>
                      <td className="py-3 text-right">{tenant.agencyCount || 0}</td>
                      <td className="py-3 text-center">
                        <StatusBadge status={tenant.status} colorMap={tenantStatusMap} />
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No tenants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-base font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {(dashboardData.recentActivity || []).slice(0, 6).map((activity, index) => {
              const Icon = activityTypeIcons[activity.type] || Clock;
              const typeInfo = activityTypeColorMap[activity.type];

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">{activity.tenantName}</span>
                      {typeInfo && (
                        <StatusBadge status={activity.type} colorMap={{ [activity.type]: typeInfo }} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
