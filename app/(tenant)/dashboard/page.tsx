"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import {
  ShoppingCart,
  ShoppingBag,
  Store,
  Users,
  Clock,
  CreditCard,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTenantDashboard } from "@/lib/hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AnalyticsSection } from "@/components/dashboard/analytics-section";
import { TopProductsCard } from "@/components/dashboard/top-products-card";
import { useTranslations } from "@/components/providers/intl-provider";

function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "0";
  if (amount >= 1_00_000) return `${(amount / 1_00_000).toFixed(1)}L`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString("en-IN");
}

export default function TenantDashboardPage() {
  const { data: dashboardData, isLoading, error, refetch } = useTenantDashboard();
  const tPage = useTranslations("pages.dashboard");
  const tStats = useTranslations("stats");

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{tPage("loadingData")}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dashboardData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={tPage("title")}
          description={tPage("description")}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{tPage("loadFailed")} {error?.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {tPage("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tPage("title")}
        description={tPage("description")}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title={tStats("todaysOrders")}
          value={dashboardData.ordersToday ?? 0}
          description={tStats("todaysOrdersHint")}
          icon={ShoppingCart}
        />
        <StatCard
          title={tStats("pendingPlacedOrders")}
          value={dashboardData.pendingPlacedOrders ?? 0}
          description={tStats("pendingPlacedOrdersHint")}
          icon={ShoppingBag}
        />
        <StatCard
          title={tStats("outstanding")}
          value={`INR ${formatCurrency(dashboardData.outstandingPayments)}`}
          description={tStats("outstandingHint")}
          icon={CreditCard}
        />
        <StatCard
          title={tStats("totalActiveStores")}
          value={dashboardData.activeShopkeepers ?? 0}
          description={tStats("totalActiveStoresHint")}
          icon={Store}
        />
        <StatCard
          title={tStats("activeEmployees")}
          value={dashboardData.activeEmployees ?? 0}
          description={tStats("activeEmployeesHint")}
          icon={Users}
        />
        <StatCard
          title={tStats("pendingCollections")}
          value={dashboardData.pendingCollections ?? 0}
          description={tStats("pendingCollectionsHint")}
          icon={TrendingUp}
        />
      </div>

      <AnalyticsSection />

      {/* Top Products + Recent Activity (bottom row) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopProductsCard className="lg:col-span-2" />

        <div className="glass rounded-xl p-6">
          <h3 className="text-base font-semibold mb-4">{tPage("recentActivity")}</h3>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">{tPage("noRecentActivity")}</p>
            <p className="text-xs mt-1 opacity-60">{tPage("activityHint")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
