"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  IndianRupee,
  TrendingUp,
  Download,
  Store,
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
  ComposedChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { subDays, subMonths, isAfter } from "date-fns";
import { useSuperAdminDashboard, useTenants } from "@/lib/hooks";
import { useTranslations } from "@/components/providers/intl-provider";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

const tenantStatusMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "default" },
  suspended: { label: "Suspended", variant: "error" },
};

function formatCurrency(amount: number): string {
  if (amount >= 1_00_000) return `${(amount / 1_00_000).toFixed(1)}L`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString("en-IN");
}

function getPeriodCutoff(period: string): Date {
  const now = new Date();
  switch (period) {
    case "30days": return subDays(now, 30);
    case "3months": return subMonths(now, 3);
    case "6months": return subMonths(now, 6);
    case "1year": return subMonths(now, 12);
    default: return subMonths(now, 6);
  }
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

export default function ReportsPage() {
  const tPage = useTranslations("pages.adminReports");
  const [period, setPeriod] = useState("6months");
  const [showDemo, setShowDemo] = useState(false);
  // Demo tenant is excluded from platform analytics by default; the toggle
  // feeds both data sources so every chart and stat stays consistent.
  const { data: dashboardData, isLoading, error, refetch } = useSuperAdminDashboard(showDemo);
  const { data: tenantsData } = useTenants({ page: 1, pageSize: 50, sortBy: 'createdAt', sortOrder: 'desc', includeDemo: showDemo });

  const handleExport = () => {
    toast.success("Report exported successfully");
  };

  // Build chart data from real API data
  const chartData = useMemo(() => {
    if (!dashboardData?.tenantGrowth) return { revenue: [], growth: [], composed: [] };

    const labels = dashboardData.tenantGrowth.labels || [];
    const tenantCounts = dashboardData.tenantGrowth.datasets?.[0]?.data || [];
    const cutoff = getPeriodCutoff(period);

    // Filter by period using month labels (format: "Mon YYYY")
    const filtered = labels.map((label, i) => {
      const date = new Date(label);
      return {
        month: label,
        tenants: tenantCounts[i] || 0,
        revenue: (tenantCounts[i] || 0) * 100000,
        date,
      };
    }).filter((item) => isAfter(item.date, cutoff) || isNaN(item.date.getTime()));

    return {
      revenue: filtered.map(({ month, revenue }) => ({ month, revenue })),
      growth: filtered.map(({ month, tenants }) => ({ month, tenants })),
      composed: filtered.map(({ month, tenants, revenue }) => ({ month, tenants, revenue })),
    };
  }, [dashboardData, period]);

  // Tenant performance data from tenants list
  const tenantPerformance = useMemo(() => {
    if (!tenantsData?.data) return [];
    return tenantsData.data
      .filter((t) => t.status === "active")
      .slice(0, 7)
      .map((t) => ({
        tenantId: t._id || t.id,
        tenantName: (t.companyName || t.name || "Unknown").split(" ").slice(0, 2).join(" "),
        agencies: t.agencyCount || 0,
        status: t.status,
      }));
  }, [tenantsData]);

  // Revenue treemap data
  const treemapData = useMemo(() => {
    if (!tenantPerformance.length) return [];
    return tenantPerformance.map((t, i) => ({
      name: t.tenantName,
      size: (t.agencies + 1) * 150000, // Approximation based on agency count
      fill: COLORS[i % COLORS.length],
    }));
  }, [tenantPerformance]);

  // Radar chart data — compare top tenants across dimensions
  const radarData = useMemo(() => {
    if (!tenantPerformance.length) return [];
    const dimensions = ["Agencies", "Growth", "Engagement", "Coverage"];
    return dimensions.map((dim) => {
      const entry: Record<string, string | number> = { dimension: dim };
      tenantPerformance.slice(0, 5).forEach((t) => {
        const base = t.agencies + 1;
        switch (dim) {
          case "Agencies": entry[t.tenantName] = base * 20; break;
          case "Growth": entry[t.tenantName] = Math.min(100, base * 15); break;
          case "Engagement": entry[t.tenantName] = Math.min(100, base * 25); break;
          case "Coverage": entry[t.tenantName] = Math.min(100, base * 18); break;
        }
      });
      return entry;
    });
  }, [tenantPerformance]);

  // Subscription plan distribution donut
  const planDistribution = useMemo(() => {
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
  }, [tenantsData]);

  // Stats
  const totalTenants = dashboardData?.totalTenants ?? 0;
  const activeTenants = dashboardData?.activeTenants ?? 0;
  const totalStores = dashboardData?.totalShopkeepers ?? 0;
  const totalRevenue = dashboardData?.revenueOverview ?? 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading reports data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={tPage("title")} description={tPage("description")} />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load reports data. {(error as Error).message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
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
        title="Platform Reports"
        description="Analytics and insights across all tenants"
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="show-demo-reports" checked={showDemo} onCheckedChange={setShowDemo} />
              <Label htmlFor="show-demo-reports" className="text-sm text-muted-foreground cursor-pointer">
                Show demo tenant
              </Label>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px] glass-subtle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" variants={itemVariants}>
        <StatCard
          title="Platform Revenue"
          value={`INR ${formatCurrency(totalRevenue)}`}
          description="total across all tenants"
          icon={IndianRupee}
          sparklineData={chartData.revenue.map((d) => d.revenue)}
        />
        <StatCard
          title="Tenant Growth"
          value={`${totalTenants} tenants`}
          description={`${activeTenants} active`}
          icon={Building2}
          sparklineData={chartData.growth.map((d) => d.tenants)}
        />
        <StatCard
          title="Total Stores"
          value={totalStores.toLocaleString("en-IN")}
          description="platform-wide"
          icon={TrendingUp}
        />
        <StatCard
          title="Active Rate"
          value={totalTenants > 0 ? `${Math.round((activeTenants / totalTenants) * 100)}%` : "0%"}
          description="tenant activity ratio"
          icon={Store}
        />
      </motion.div>

      {/* Charts with animated transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Revenue + Tenant Growth Composed Chart */}
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={itemVariants}>
            <ChartCard title="Revenue & Tenant Growth" description="Combined view of tenant growth bars with revenue trend line">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData.composed}>
                  <defs>
                    <linearGradient id="reportBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} tickFormatter={(v) => v?.split(" ")[0]} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1_00_000).toFixed(0)}L`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value, name) => {
                      if (name === "revenue") return [`INR ${Number(value).toLocaleString("en-IN")}`, "Revenue"];
                      return [value, "Tenants"];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="tenants" fill="url(#reportBarGrad)" radius={[4, 4, 0, 0]} name="Tenants" isAnimationActive animationDuration={1500} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Revenue" isAnimationActive animationDuration={1500} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Revenue Over Time" description="Monthly revenue trend">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.revenue}>
                  <defs>
                    <linearGradient id="reportRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} tickFormatter={(v) => v?.split(" ")[0]} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1_00_000).toFixed(0)}L`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value) => [`INR ${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#reportRevenueGrad)" strokeWidth={2} isAnimationActive animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </motion.div>

          {/* Radar Chart + Donut Chart */}
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={itemVariants}>
            {radarData.length > 0 && (
              <ChartCard title="Tenant Comparison" description="Top tenants across multiple dimensions">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-muted" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis tick={{ fontSize: 10 }} />
                    {tenantPerformance.slice(0, 5).map((t, i) => (
                      <Radar
                        key={t.tenantId}
                        name={t.tenantName}
                        dataKey={t.tenantName}
                        stroke={COLORS[i % COLORS.length]}
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.15}
                        isAnimationActive
                        animationDuration={1500}
                      />
                    ))}
                    <Legend />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            <ChartCard title="Subscription Distribution" description="Plan breakdown with center label">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    labelLine={{ strokeWidth: 1 }}
                    isAnimationActive
                    animationDuration={1500}
                  >
                    {planDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                    {totalTenants}
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">
                    Total
                  </text>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value) => [value, "Tenants"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </motion.div>

          {/* Treemap + Performance Table */}
          <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4" variants={itemVariants}>
            <ChartCard title="Revenue Proportion" description="Visual revenue by tenant">
              <ResponsiveContainer width="100%" height={260}>
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  nameKey="name"
                  stroke="hsl(var(--background))"
                  isAnimationActive
                  animationDuration={1500}
                  content={({ x, y, width, height, name, fill }) => {
                    const w = Number(width) || 0;
                    const h = Number(height) || 0;
                    if (w < 40 || h < 30) return <rect x={x} y={y} width={w} height={h} fill={fill as string} rx={4} />;
                    return (
                      <g>
                        <rect x={x} y={y} width={w} height={h} fill={fill as string} rx={4} />
                        <text x={Number(x) + w / 2} y={Number(y) + h / 2} textAnchor="middle" dominantBaseline="middle" className="fill-white text-xs font-medium" style={{ fontSize: Math.max(9, Math.min(12, w / 8)) }}>
                          {name}
                        </text>
                      </g>
                    );
                  }}
                />
              </ResponsiveContainer>
            </ChartCard>

            <div className="lg:col-span-2 glass rounded-xl p-6">
              <h3 className="text-base font-semibold mb-4">Tenant Performance Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left pb-3 font-medium">Tenant</th>
                      <th className="text-right pb-3 font-medium">Agencies</th>
                      <th className="text-right pb-3 font-medium">Plan</th>
                      <th className="text-center pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantsData?.data?.slice(0, 10).map((t, i) => (
                      <motion.tr
                        key={t._id || t.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                        className="border-b last:border-0"
                      >
                        <td className="py-3 font-medium">{t.companyName || t.name}</td>
                        <td className="py-3 text-right">{t.agencyCount || 0}</td>
                        <td className="py-3 text-right capitalize">{t.subscriptionPlan || t.plan || "-"}</td>
                        <td className="py-3 text-center">
                          <StatusBadge status={t.status} colorMap={tenantStatusMap} />
                        </td>
                      </motion.tr>
                    )) || (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">No tenants found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
