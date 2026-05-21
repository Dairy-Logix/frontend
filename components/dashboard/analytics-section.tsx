"use client";

import { useState } from "react";
import { ChartCard } from "@/components/shared/chart-card";
import { Loader2, BarChart3 } from "lucide-react";
import { useTenantAnalytics } from "@/lib/hooks/use-dashboard";
import type { AnalyticsRange } from "@/lib/types";
import { AnalyticsFilter } from "./analytics-filter";
import { DailyOrdersChart } from "./charts/daily-orders-chart";
import { SalesPurchaseMarginChart } from "./charts/sales-purchase-margin-chart";
import { TopStoresChart } from "./charts/top-stores-chart";
import { ExpenseBreakdownChart } from "./charts/expense-breakdown-chart";
import { ReceivablesAgingChart } from "./charts/receivables-aging-chart";

interface FilterState {
  range: AnalyticsRange;
  from?: string;
  to?: string;
  agencyId?: string;
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
      <BarChart3 className="h-10 w-10 mb-3 opacity-30" />
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs mt-1 opacity-60">Try a wider date range or different agency</p>
    </div>
  );
}

export function AnalyticsSection() {
  const [filter, setFilter] = useState<FilterState>({ range: "month" });
  const { data, isLoading, isFetching } = useTenantAnalytics(filter);

  const agencies = data?.agencies ?? [];
  const fetching = isFetching && !isLoading;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Sales, margins, top stores, expenses and receivables — filter by range and agency.
          </p>
        </div>
        {fetching && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <AnalyticsFilter
        range={filter.range}
        from={filter.from}
        to={filter.to}
        agencyId={filter.agencyId}
        agencies={agencies}
        onChange={setFilter}
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-6 h-[340px] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Daily Orders Trend"
              description="Order volume over the selected period"
            >
              {data.dailyOrders.some((d) => d.orders > 0) ? (
                <DailyOrdersChart data={data.dailyOrders} />
              ) : (
                <ChartEmpty message="No orders in this range" />
              )}
            </ChartCard>

            <div className="glass rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <h3 className="text-base font-semibold leading-none tracking-tight">
                    Sales, Purchase & Margin
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Revenue vs purchase cost with margin %
                  </p>
                </div>
                {data.salesPurchaseMargin.some((d) => d.estimated) && (
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Some periods estimated from product price
                  </span>
                )}
              </div>
              <div className="w-full min-h-0">
                {data.salesPurchaseMargin.some((d) => d.sales > 0 || d.purchase > 0) ? (
                  <SalesPurchaseMarginChart data={data.salesPurchaseMargin} />
                ) : (
                  <ChartEmpty message="No sales or purchases in this range" />
                )}
              </div>
            </div>
          </div>

          <ChartCard
            title="Top Stores by Revenue"
            description="Top 10 shops based on invoice total"
          >
            {data.topStores.length > 0 ? (
              <TopStoresChart data={data.topStores} />
            ) : (
              <ChartEmpty message="No store revenue in this range" />
            )}
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Expense Category Breakdown"
              description="Spend mix across expense categories"
            >
              {data.expenseBreakdown.total > 0 ? (
                <ExpenseBreakdownChart data={data.expenseBreakdown} />
              ) : (
                <ChartEmpty message="No expenses recorded" />
              )}
            </ChartCard>

            <ChartCard
              title="Receivables Aging"
              description="Outstanding amount by invoice age and status"
            >
              {data.receivablesAging.some((d) => d.total > 0) ? (
                <ReceivablesAgingChart data={data.receivablesAging} />
              ) : (
                <ChartEmpty message="No invoices yet" />
              )}
            </ChartCard>
          </div>
        </>
      )}
    </section>
  );
}

