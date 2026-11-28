"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw, AlertCircle } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormulaBuilder } from "@/components/planning-studio/formula-builder";
import { CalculationTable } from "@/components/planning-studio/calculation-table";

import {
  useAgencies,
  useAgencyFormula,
  useSaveAgencyFormula,
  useAgencyFormulaPreview,
  useSaveFormulaQuantities,
} from "@/lib/hooks";
import type {
  AgencyFormulaToken,
  FormulaQuantityEntry,
} from "@/lib/api/services/planning-studio.service";
import { useTranslations } from "@/components/providers/intl-provider";

/** Tomorrow as YYYY-MM-DD in the browser's local calendar. */
function tomorrowYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatLongDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AgencyFormulaCalculatorPage() {
  const [orderDate, setOrderDate] = useState<string>(tomorrowYmd);
  const isTomorrow = orderDate === tomorrowYmd();
  const tPage = useTranslations("pages.agencyFormula");
  const { data: agenciesData, isLoading: loadingAgencies } = useAgencies({
    page: 1,
    pageSize: 100,
    isActive: true,
  });
  const agencies = agenciesData?.data ?? [];

  const { data: formula, isLoading: loadingFormula } = useAgencyFormula();
  const saveFormula = useSaveAgencyFormula();

  const initialTokens: AgencyFormulaToken[] = useMemo(
    () => formula?.tokens ?? [],
    [formula],
  );

  const hasFormula = (formula?.tokens?.length ?? 0) > 0;

  const {
    data: preview,
    isLoading: loadingPreview,
    error: previewError,
    refetch: refetchPreview,
    isFetching: fetchingPreview,
  } = useAgencyFormulaPreview(hasFormula, orderDate);

  const saveQuantities = useSaveFormulaQuantities(orderDate);

  function handleSave(tokens: AgencyFormulaToken[]) {
    saveFormula.mutate(tokens);
  }

  function handleSaveQuantities(quantities: FormulaQuantityEntry[]) {
    if (quantities.length === 0) return;
    saveQuantities.mutate(quantities);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Final Calculator"
        description={`Orders taken for ${formatLongDate(orderDate)}${isTomorrow ? " (tomorrow)" : ""}. Assign each product's combined order to one of the two agencies.`}
        action={
          <Link href="/planning-studio">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Planning Studio
            </Button>
          </Link>
        }
      />

      {loadingAgencies || loadingFormula ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : agencies.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No active agencies found. Add agencies first to build a formula.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <FormulaBuilder
            agencies={agencies}
            initialTokens={initialTokens}
            onSave={handleSave}
            saving={saveFormula.isPending}
          />

          {hasFormula && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    Allocation for {formatLongDate(orderDate)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Formula Result is the combined order from both agencies.
                    Assignments persist day to day; row totals refresh with the
                    selected date&apos;s orders.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor="order-date"
                  >
                    Order for
                  </label>
                  <Input
                    id="order-date"
                    type="date"
                    value={orderDate}
                    onChange={(e) =>
                      e.target.value && setOrderDate(e.target.value)
                    }
                    className="h-9 w-40"
                  />
                  {!isTomorrow && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOrderDate(tomorrowYmd())}
                    >
                      Tomorrow
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchPreview()}
                    disabled={fetchingPreview}
                    className="gap-2"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${fetchingPreview ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>
              </div>

              {loadingPreview ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : previewError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {(previewError as Error).message}
                  </AlertDescription>
                </Alert>
              ) : preview ? (
                <CalculationTable
                  agencies={preview.agencies}
                  rows={preview.rows}
                  onSave={handleSaveQuantities}
                  saving={saveQuantities.isPending}
                />
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}
