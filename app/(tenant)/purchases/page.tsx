"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Loader2,
  AlertCircle,
  Receipt,
  Package,
  IndianRupee,
  Calendar,
  MinusCircle,
  PlusCircle,
  Sparkles,
  Building2,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatCard } from "@/components/shared/stat-card";

import { useAgencies } from "@/lib/hooks/use-agencies";
import { useProducts } from "@/lib/hooks/use-products";
import {
  useCreatePurchasesBulk,
  usePurchases,
} from "@/lib/hooks/use-purchases";
import type { Agency, Product, CreatePurchaseInput, Purchase } from "@/lib/types";
import { useTranslations } from "@/components/providers/intl-provider";

function formatINR(n: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

interface AgencyEntry {
  qty: Record<string, string>;
  tax: string;
  subsidy: string;
  purchaseNumber: string;
}

const emptyEntry: AgencyEntry = {
  qty: {},
  tax: "",
  subsidy: "",
  purchaseNumber: "",
};

export default function PurchasesPage() {
  const tPage = useTranslations("pages.purchases");
  const today = new Date().toISOString().slice(0, 10);
  const [purchaseDate, setPurchaseDate] = useState<string>(today);

  const {
    data: agenciesPage,
    isLoading: agenciesLoading,
    error: agenciesError,
  } = useAgencies({ pageSize: 100 });
  const {
    data: productsPage,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts({ pageSize: 200 });
  const { data: recentPurchasesPage } = usePurchases({ pageSize: 10 });
  const createBulk = useCreatePurchasesBulk();

  const agencies: Agency[] = useMemo(
    () => (agenciesPage?.data || []).filter((a) => a.isActive),
    [agenciesPage]
  );
  const products: Product[] = useMemo(
    () => (productsPage?.data || []).filter((p) => p.isActive),
    [productsPage]
  );

  const [matrix, setMatrix] = useState<Record<string, AgencyEntry>>({});

  function getEntry(agencyId: string): AgencyEntry {
    return matrix[agencyId] || emptyEntry;
  }

  function setQty(agencyId: string, productId: string, value: string) {
    setMatrix((prev) => {
      const cur = prev[agencyId] || emptyEntry;
      return {
        ...prev,
        [agencyId]: { ...cur, qty: { ...cur.qty, [productId]: value } },
      };
    });
  }

  function setField(
    agencyId: string,
    field: "tax" | "subsidy" | "purchaseNumber",
    value: string
  ) {
    setMatrix((prev) => {
      const cur = prev[agencyId] || emptyEntry;
      return { ...prev, [agencyId]: { ...cur, [field]: value } };
    });
  }

  function basicAmountFor(agencyId: string): number {
    const entry = getEntry(agencyId);
    return products.reduce((sum, p) => {
      const q = Number(entry.qty[p.id]) || 0;
      return sum + q * (p.purchasePricePerUnit || 0);
    }, 0);
  }

  function netAmountFor(agencyId: string): number {
    const entry = getEntry(agencyId);
    return (
      basicAmountFor(agencyId) +
      (Number(entry.tax) || 0) -
      (Number(entry.subsidy) || 0)
    );
  }

  const grandTotals = useMemo(() => {
    let basic = 0;
    let tax = 0;
    let subsidy = 0;
    let agenciesWithEntries = 0;
    for (const agency of agencies) {
      const b = basicAmountFor(agency.id);
      if (b > 0) agenciesWithEntries++;
      basic += b;
      tax += Number(getEntry(agency.id).tax) || 0;
      subsidy += Number(getEntry(agency.id).subsidy) || 0;
    }
    return {
      basic,
      tax,
      subsidy,
      net: basic + tax - subsidy,
      agenciesWithEntries,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrix, agencies, products]);

  async function handleSave() {
    if (!purchaseDate) {
      toast.error("Pick a purchase date");
      return;
    }
    const purchases: CreatePurchaseInput[] = [];
    for (const agency of agencies) {
      const entry = getEntry(agency.id);
      const items = products
        .map((p) => ({
          productId: p.id,
          quantity: Number(entry.qty[p.id]) || 0,
        }))
        .filter((i) => i.quantity > 0);
      if (items.length === 0) continue;
      purchases.push({
        agencyId: agency.id,
        purchaseDate,
        purchaseNumber: entry.purchaseNumber.trim() || undefined,
        items,
        taxAmount: Number(entry.tax) || 0,
        subsidy: Number(entry.subsidy) || 0,
      });
    }
    if (purchases.length === 0) {
      toast.error("Enter quantities for at least one agency");
      return;
    }
    try {
      await createBulk.mutateAsync({ purchases });
      setMatrix({});
    } catch {
      // hook already toasts
    }
  }

  const isLoading = agenciesLoading || productsLoading;
  const loadError = agenciesError || productsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading purchase entry...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Purchases" description="Daily purchase entry from the dairy" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(loadError as Error).message || "Failed to load page data"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Record daily purchases from the dairy across all agencies"
        action={
          <Button
            onClick={handleSave}
            disabled={createBulk.isPending || agencies.length === 0}
            size="lg"
            className="gap-2 bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20"
          >
            {createBulk.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Purchases
          </Button>
        }
      />

      {/* Top stats / date row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground shadow-md">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <Label htmlFor="purchase-date" className="text-xs text-muted-foreground">
              Purchase Date
            </Label>
            <Input
              id="purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="h-8 px-2 border-0 bg-transparent font-semibold text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <StatCard
          title="Basic Amount"
          value={formatINR(grandTotals.basic)}
          icon={Package}
          tone="cyan"
        />
        <StatCard
          title="Subsidy − / Tax +"
          value={`${formatINR(grandTotals.subsidy)} / ${formatINR(grandTotals.tax)}`}
          icon={Sparkles}
          tone="amber"
        />
        <StatCard
          title="Net Amount"
          value={formatINR(grandTotals.net)}
          icon={IndianRupee}
          tone="primary"
          description={`${grandTotals.agenciesWithEntries} of ${agencies.length} agenc${agencies.length === 1 ? "y" : "ies"}`}
        />
      </motion.div>

      {/* Helpful hint */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground px-1">
        <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary" />
        <span>
          Enter the order quantity for each agency. Prices come from the Products
          page. Subsidy is deducted, tax is added — Net = Basic + Tax − Subsidy.
        </span>
      </div>

      {/* Matrix Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass rounded-2xl overflow-hidden"
      >
        {agencies.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-lg font-medium">No active agencies</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create an agency before recording purchases.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-lg font-medium">No active products</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add products from the Products page first.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-20 bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-purple-500/15 backdrop-blur">
                <tr className="border-b-2 border-primary/20">
                  <th className="text-left py-3 px-4 font-semibold sticky left-0 z-30 bg-gradient-to-r from-cyan-500/20 to-blue-500/15 backdrop-blur min-w-[110px] border-r border-border">
                    Code
                  </th>
                  <th className="text-left py-3 px-4 font-semibold sticky left-[110px] z-30 bg-gradient-to-r from-blue-500/15 to-purple-500/10 backdrop-blur min-w-[200px] border-r border-border">
                    Product
                  </th>
                  <th className="text-right py-3 px-4 font-semibold min-w-[110px] border-r border-border/50">
                    <div className="flex items-center justify-end gap-1">
                      <IndianRupee className="h-3.5 w-3.5" />
                      Price
                    </div>
                  </th>
                  {agencies.map((a) => (
                    <th
                      key={a.id}
                      className="text-center py-3 px-3 font-medium min-w-[150px] border-r border-border/40"
                    >
                      <div className="flex flex-col gap-1 items-center">
                        <span className="font-semibold text-foreground">{a.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wide">
                          {a.location || a.agencyType}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, rowIndex) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: rowIndex * 0.02 }}
                    className={`border-b border-border/30 last:border-0 hover:bg-primary/[0.03] transition-colors ${
                      rowIndex % 2 === 0 ? "bg-foreground/[0.015]" : ""
                    }`}
                  >
                    <td className="py-2 px-4 font-mono text-xs text-muted-foreground sticky left-0 z-10 bg-background/95 backdrop-blur border-r border-border">
                      {p.productCode}
                    </td>
                    <td className="py-2 px-4 sticky left-[110px] z-10 bg-background/95 backdrop-blur border-r border-border">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Package className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                          {p.shortName && p.shortName !== p.name && (
                            <div className="text-xs text-muted-foreground truncate">
                              {p.shortName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums font-medium border-r border-border/40">
                      {formatINR(p.purchasePricePerUnit)}
                    </td>
                    {agencies.map((a) => {
                      const value = getEntry(a.id).qty[p.id] || "";
                      const hasValue = Number(value) > 0;
                      return (
                        <td
                          key={a.id}
                          className="py-2 px-2 border-r border-border/40"
                        >
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={value}
                            onChange={(e) => setQty(a.id, p.id, e.target.value)}
                            placeholder="0"
                            className={`h-9 text-center tabular-nums transition-all ${
                              hasValue
                                ? "bg-primary/5 border-primary/40 font-semibold focus-visible:ring-primary/30"
                                : "bg-background/60 border-border/60 focus-visible:ring-primary/20"
                            }`}
                          />
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}

                {/* Basic Amount */}
                <tr className="border-t-2 border-primary/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur font-semibold">
                  <td
                    colSpan={3}
                    className="py-3 px-4 text-right sticky left-0 z-10 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 backdrop-blur uppercase text-xs tracking-wider"
                  >
                    Basic Amount
                  </td>
                  {agencies.map((a) => (
                    <td
                      key={a.id}
                      className="text-center py-3 px-3 tabular-nums border-r border-border/40"
                    >
                      {formatINR(basicAmountFor(a.id))}
                    </td>
                  ))}
                </tr>

                {/* Subsidy */}
                <tr className="bg-amber-500/[0.04]">
                  <td
                    colSpan={3}
                    className="py-2 px-4 text-right sticky left-0 z-10 bg-background/95 backdrop-blur uppercase text-xs tracking-wider text-muted-foreground"
                  >
                    <div className="flex items-center justify-end gap-1.5 font-semibold">
                      <MinusCircle className="h-3.5 w-3.5 text-amber-600" />
                      Subsidy <span className="text-muted-foreground">( − )</span>
                    </div>
                  </td>
                  {agencies.map((a) => (
                    <td key={a.id} className="py-2 px-2 border-r border-border/40">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={getEntry(a.id).subsidy}
                        onChange={(e) => setField(a.id, "subsidy", e.target.value)}
                        placeholder="0"
                        className="h-9 text-center tabular-nums bg-amber-500/[0.06] border-amber-500/30 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/60"
                      />
                    </td>
                  ))}
                </tr>

                {/* Tax */}
                <tr className="bg-emerald-500/[0.04]">
                  <td
                    colSpan={3}
                    className="py-2 px-4 text-right sticky left-0 z-10 bg-background/95 backdrop-blur uppercase text-xs tracking-wider text-muted-foreground"
                  >
                    <div className="flex items-center justify-end gap-1.5 font-semibold">
                      <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                      Tax <span className="text-muted-foreground">( + )</span>
                    </div>
                  </td>
                  {agencies.map((a) => (
                    <td key={a.id} className="py-2 px-2 border-r border-border/40">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={getEntry(a.id).tax}
                        onChange={(e) => setField(a.id, "tax", e.target.value)}
                        placeholder="0"
                        className="h-9 text-center tabular-nums bg-emerald-500/[0.06] border-emerald-500/30 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/60"
                      />
                    </td>
                  ))}
                </tr>

                {/* Net Amount */}
                <tr className="border-t-2 border-primary/30 bg-gradient-primary text-primary-foreground font-bold shadow-inner">
                  <td
                    colSpan={3}
                    className="py-4 px-4 text-right sticky left-0 z-10 bg-gradient-primary uppercase text-xs tracking-widest"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <Sparkles className="h-4 w-4" />
                      Net Amount
                    </div>
                  </td>
                  {agencies.map((a) => (
                    <td
                      key={a.id}
                      className="text-center py-4 px-3 tabular-nums text-base border-r border-white/10 last:border-r-0"
                    >
                      {formatINR(netAmountFor(a.id))}
                    </td>
                  ))}
                </tr>

                {/* Purchase No (optional) */}
                <tr className="bg-muted/20">
                  <td
                    colSpan={3}
                    className="py-2 px-4 text-right sticky left-0 z-10 bg-muted/30 backdrop-blur text-xs text-muted-foreground"
                  >
                    Purchase No. (optional — auto if blank)
                  </td>
                  {agencies.map((a) => (
                    <td key={a.id} className="py-2 px-2 border-r border-border/40">
                      <Input
                        value={getEntry(a.id).purchaseNumber}
                        onChange={(e) =>
                          setField(a.id, "purchaseNumber", e.target.value)
                        }
                        placeholder="Auto"
                        className="h-8 text-center text-xs bg-background/60 border-border/60"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Recent Purchases */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="glass rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground">
              <Receipt className="h-4 w-4" />
            </div>
            <h3 className="font-semibold">Recent Purchases</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {(recentPurchasesPage?.data || []).length} entries
          </span>
        </div>
        <div className="p-4">
          {(recentPurchasesPage?.data || []).length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p>No purchases recorded yet</p>
              <p className="text-xs mt-1">
                Enter quantities above and hit Save to record your first purchase.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(recentPurchasesPage?.data || []).map((p: Purchase, idx: number) => {
                const agency =
                  typeof p.agencyId === "object" ? p.agencyId : null;
                const net =
                  (p.basicAmount || 0) + (p.taxAmount || 0) - (p.subsidy || 0);
                return (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="group relative overflow-hidden rounded-xl border border-border/50 bg-background/40 hover:bg-background/70 hover:border-primary/40 transition-all p-4"
                  >
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                            {p.purchaseNumber}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(p.purchaseDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium truncate">
                            {agency?.name || "—"}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">
                            {p.items.length} item{p.items.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>Basic {formatINR(p.basicAmount)}</span>
                          <span className="text-amber-600">
                            − {formatINR(p.subsidy)}
                          </span>
                          <span className="text-emerald-600">
                            + {formatINR(p.taxAmount)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">
                          Net
                        </div>
                        <div className="text-lg font-bold text-gradient-primary tabular-nums">
                          {formatINR(net)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

