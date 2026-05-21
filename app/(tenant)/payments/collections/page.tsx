"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  Target,
  TrendingUp,
  Users,
  Store,
  Smartphone,
  Wallet,
  Clock,
  User,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/chart-card";
import { StatusBadge } from "@/components/shared/status-badge";

import { usePayments } from "@/lib/hooks/use-payments";
import { todayIST, dateToIST } from "@/lib/utils";
import { useShopkeepers } from "@/lib/hooks/use-shopkeepers";
import { useEmployees } from "@/lib/hooks/use-employees";
import { Loader2 as LoaderIcon } from "lucide-react";
import { useTranslations } from "@/components/providers/intl-provider";

// --- Type Color Map ---

const paymentTypeColorMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  online: { label: "Online", variant: "info" },
  offline: { label: "Cash", variant: "default" },
};

// --- Helpers ---

function formatINR(amount: number): string {
  return `INR ${amount.toLocaleString("en-IN")}`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Main Page ---

export default function CollectionsDashboardPage() {
  const tPage = useTranslations("pages.collections");
  // Fetch data from API
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments({ pageSize: 200 });
  const { data: shopkeepersData } = useShopkeepers({ pageSize: 200 });
  const { data: employeesData } = useEmployees({ pageSize: 200 });

  const payments = useMemo(() => paymentsData?.data ?? [], [paymentsData]);
  const shopkeepersList = useMemo(() => shopkeepersData?.data ?? [], [shopkeepersData]);
  const employeesList = useMemo(() => employeesData?.data ?? [], [employeesData]);

  // Lookup helpers
  function getShopName(shopId: string): string {
    return shopkeepersList.find((s: any) => s.id === shopId)?.shopName ?? "Unknown Shop";
  }
  function getEmployeeName(employeeId: string): string {
    return employeesList.find((e: any) => e.id === employeeId)?.name ?? "Unknown Employee";
  }

  // --- Today's date (IST) ---
  const today = useMemo(() => todayIST(), []);

  // --- Today's payments ---
  const todayPayments = useMemo(() => {
    return payments.filter((p: any) => p.collectedAt && dateToIST(p.collectedAt) === today);
  }, [payments, today]);

  // --- Employee-wise collection summaries for today ---
  const employeeCollections = useMemo(() => {
    const byEmployee: Record<string, { id: string; employeeId: string; employeeName: string; totalCollected: number; onlineAmount: number; offlineAmount: number; paymentCount: number; date: string }> = {};
    todayPayments.forEach((p: any) => {
      const eid = p.collectedById || p.employeeId || "";
      if (!byEmployee[eid]) {
        byEmployee[eid] = {
          id: eid,
          employeeId: eid,
          employeeName: getEmployeeName(eid),
          totalCollected: 0,
          onlineAmount: 0,
          offlineAmount: 0,
          paymentCount: 0,
          date: today,
        };
      }
      byEmployee[eid].totalCollected += p.amount ?? 0;
      byEmployee[eid].paymentCount += 1;
      if (p.paymentType === "online") {
        byEmployee[eid].onlineAmount += p.amount ?? 0;
      } else {
        byEmployee[eid].offlineAmount += p.amount ?? 0;
      }
    });
    return Object.values(byEmployee);
  }, [todayPayments, employeesList]);

  // --- Today's summary ---
  const todaySummary = useMemo(() => {
    const target = 25000;
    const collected = employeeCollections.reduce((sum, c) => sum + c.totalCollected, 0);
    const remaining = Math.max(0, target - collected);
    const progressPercent = Math.min(100, Math.round((collected / target) * 100));
    return { target, collected, remaining, progressPercent };
  }, [employeeCollections]);

  // --- Recent collections (latest payments) ---
  const recentCollections = useMemo(() => {
    return [...payments]
      .filter((p: any) => p.status === "confirmed" || p.status === "pending")
      .sort((a: any, b: any) =>
        new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
      )
      .slice(0, 8);
  }, [payments]);

  // --- Overall stats ---
  const overallStats = useMemo(() => {
    const totalEmployees = employeeCollections.length;
    const totalPayments = employeeCollections.reduce((sum, c) => sum + c.paymentCount, 0);
    return { totalEmployees, totalPayments };
  }, [employeeCollections]);

  // --- Collection trend data (last 7 days) ---
  const collectionTrendData = useMemo(() => {
    const days: { date: string; collected: number; target: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = dateToIST(d);
      const dayLabel = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" }).format(d);
      const dayPayments = payments.filter((p: any) => p.collectedAt && dateToIST(p.collectedAt) === dateStr);
      const collected = dayPayments.reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0);
      days.push({ date: dayLabel, collected, target: 25000 });
    }
    return days;
  }, [payments]);

  // --- Loading State ---
  if (paymentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading collections dashboard...</p>
        </div>
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={tPage("title")}
        description={tPage("description")}
      />

      {/* Today's Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Today&apos;s Collection Summary</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Target Amount</p>
            <p className="text-xl font-bold">{formatINR(todaySummary.target)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Collected So Far</p>
            <p className="text-xl font-bold text-[var(--success)]">
              {formatINR(todaySummary.collected)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className="text-xl font-bold text-[var(--destructive)]">
              {formatINR(todaySummary.remaining)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Active Collectors</p>
            <p className="text-xl font-bold">{overallStats.totalEmployees}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Collection Progress</span>
            <span className="font-semibold">{todaySummary.progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${todaySummary.progressPercent}%` }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Collected Today"
          value={formatINR(todaySummary.collected)}
          description="Confirmed payments"
          icon={IndianRupee}
          trend={{ value: 18.5, isPositive: true }}
        />
        <StatCard
          title="Payments Collected"
          value={overallStats.totalPayments}
          description="Individual transactions"
          icon={TrendingUp}
        />
        <StatCard
          title="Active Collectors"
          value={overallStats.totalEmployees}
          description="Employees collecting today"
          icon={Users}
        />
        <StatCard
          title="Target Achievement"
          value={`${todaySummary.progressPercent}%`}
          description="Daily target progress"
          icon={Target}
          trend={{
            value: todaySummary.progressPercent >= 100 ? 5.0 : -2.1,
            isPositive: todaySummary.progressPercent >= 100,
          }}
        />
      </div>

      {/* Employee-wise Collection Cards */}
      <div>
        <h3 className="text-base font-semibold mb-3">Employee-wise Collections</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employeeCollections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="glass rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{collection.employeeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {collection.paymentCount} payment{collection.paymentCount !== 1 ? "s" : ""} collected
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Collected</span>
                  <span className="text-sm font-bold">
                    {formatINR(collection.totalCollected)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-subtle rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Smartphone className="h-3 w-3 text-blue-500" />
                      <span className="text-[10px] text-muted-foreground">Online</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatINR(collection.onlineAmount)}
                    </p>
                  </div>
                  <div className="glass-subtle rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Wallet className="h-3 w-3 text-green-500" />
                      <span className="text-[10px] text-muted-foreground">Cash</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatINR(collection.offlineAmount)}
                    </p>
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Online vs Cash split</span>
                    <span>
                      {collection.totalCollected > 0
                        ? Math.round(
                            (collection.onlineAmount / collection.totalCollected) * 100
                          )
                        : 0}
                      % online
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-blue-500 rounded-l-full"
                      style={{
                        width: `${
                          collection.totalCollected > 0
                            ? (collection.onlineAmount / collection.totalCollected) * 100
                            : 0
                        }%`,
                      }}
                    />
                    <div
                      className="h-full bg-green-500 rounded-r-full"
                      style={{
                        width: `${
                          collection.totalCollected > 0
                            ? (collection.offlineAmount / collection.totalCollected) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chart + Recent Collections Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Collection Trend Chart */}
        <ChartCard
          title="Collection Trend"
          description="Daily collected amounts over the last 7 days"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collectionTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) =>
                  `${(Number(v) / 1000).toFixed(0)}K`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => [
                  `INR ${Number(value).toLocaleString("en-IN")}`,
                  undefined,
                ]}
              />
              <Legend />
              <Bar
                dataKey="collected"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                name="Collected"
              />
              <Bar
                dataKey="target"
                fill="hsl(var(--muted-foreground))"
                radius={[4, 4, 0, 0]}
                name="Target"
                opacity={0.3}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recent Collections List */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-base font-semibold mb-4">Recent Collections</h3>
          <div className="space-y-4">
            {recentCollections.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  {payment.paymentType === "online" ? (
                    <Smartphone className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Wallet className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium truncate">
                      {getEmployeeName(payment.collectedById)}
                    </span>
                    <StatusBadge
                      status={payment.paymentType}
                      colorMap={paymentTypeColorMap}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    {getShopName(payment.shopId)}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-semibold">
                      {formatINR(payment.amount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(payment.collectedAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
