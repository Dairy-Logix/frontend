"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  IndianRupee,
  Factory,
  Percent,
  CheckCircle2,
  XCircle,
  Loader2 as LoaderIcon,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { FactoryProduct } from "@/lib/types";
import { useFactoryProducts } from "@/lib/hooks/use-factory";
import { useProducts } from "@/lib/hooks/use-products";

// --- Status Color Map ---

const activeStatusMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "default" },
};

// --- Factory Names ---

const FACTORY_NAMES = ["Gujarat Dairy Co-op", "Amul Processing Unit"];

// --- Helpers ---

function formatINR(amount: number): string {
  return `INR ${(amount ?? 0).toLocaleString("en-IN")}`;
}

function calcMargin(distributorPrice: number, factoryPrice: number): number {
  return distributorPrice - factoryPrice;
}

function calcMarginPercent(distributorPrice: number, factoryPrice: number): number {
  if (distributorPrice === 0) return 0;
  return ((distributorPrice - factoryPrice) / distributorPrice) * 100;
}

// --- Main Page ---

export default function FactoryProductsPage() {
  // Filter state
  const [search, setSearch] = useState("");
  const [factoryFilter, setFactoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch products for lookups
  const { data: allProductsData } = useProducts({ pageSize: 200 });
  const allProducts = useMemo(() => allProductsData?.data ?? [], [allProductsData]);

  // Product lookup helpers
  function getProductName(productId: string): string {
    return allProducts.find((p: any) => p.id === productId)?.name ?? "Unknown Product";
  }
  function getDistributorPrice(productId: string): number {
    const product = allProducts.find((p: any) => p.id === productId);
    return product?.purchasePricePerUnit ?? 0;
  }
  function getStorePrice(productId: string): number {
    const product = allProducts.find((p: any) => p.id === productId);
    return product?.sellingPricePerUnit ?? 0;
  }

  // Data fetching with real API
  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useFactoryProducts({
    page,
    pageSize,
    factoryName: factoryFilter !== "all" ? factoryFilter : undefined,
  });

  const factoryProducts = productsData?.data || [];

  // Add/Edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FactoryProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formProductId, setFormProductId] = useState("");
  const [formFactoryName, setFormFactoryName] = useState("");
  const [formFactoryPrice, setFormFactoryPrice] = useState("");
  const [formFactorySku, setFormFactorySku] = useState("");

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<FactoryProduct | null>(null);

  // --- Client-side filtering for status (not yet in API) ---

  const filteredProducts = useMemo(() => {
    return factoryProducts.filter((fp) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && fp.isActive) ||
        (statusFilter === "inactive" && !fp.isActive);
      return matchesStatus;
    });
  }, [factoryProducts, statusFilter]);

  // --- Stats ---

  const stats = useMemo(() => {
    const total = factoryProducts.length;
    const active = factoryProducts.filter((fp) => fp.isActive).length;

    // Average margin percent across active mappings
    const activeProducts = factoryProducts.filter((fp) => fp.isActive);
    const avgMargin =
      activeProducts.length > 0
        ? activeProducts.reduce((sum, fp) => {
            const distPrice = getDistributorPrice(fp.productId);
            return sum + calcMarginPercent(distPrice, fp.factoryPrice);
          }, 0) / activeProducts.length
        : 0;

    return { total, active, avgMargin };
  }, [factoryProducts]);

  // --- Form handlers ---

  function openAddModal() {
    setEditingProduct(null);
    setFormProductId("");
    setFormFactoryName(FACTORY_NAMES[0]);
    setFormFactoryPrice("");
    setFormFactorySku("");
    setFormOpen(true);
  }

  function openEditModal(fp: FactoryProduct) {
    setEditingProduct(fp);
    setFormProductId(fp.productId);
    setFormFactoryName(fp.factoryName);
    setFormFactoryPrice(String(fp.factoryPrice));
    setFormFactorySku(fp.factorySku ?? "");
    setFormOpen(true);
  }

  function handleFormSubmit() {
    if (!formProductId) {
      toast.error("Please select a product");
      return;
    }
    if (!formFactoryName) {
      toast.error("Please select a factory");
      return;
    }
    if (!formFactoryPrice || Number(formFactoryPrice) <= 0) {
      toast.error("Enter a valid factory price");
      return;
    }

    // TODO: Implement create/update mutations when API endpoints are available
    toast.info("Create/Update factory product - API integration pending");
  }

  function confirmDelete(fp: FactoryProduct) {
    setDeletingProduct(fp);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (!deletingProduct) return;
    // TODO: Implement delete mutation when API endpoint is available
    toast.info("Delete factory product - API integration pending");
    setDeleteOpen(false);
    setDeletingProduct(null);
  }

  function toggleActive(fp: FactoryProduct) {
    // TODO: Implement toggle active mutation when API endpoint is available
    toast.info(`Toggle active status - API integration pending`);
  }

  // Available products (those not already mapped to the selected factory when adding)
  const availableProducts = useMemo(() => {
    const activeProds = allProducts.filter((p: any) => p.isActive);
    if (editingProduct) return activeProds;
    // Filter out products already mapped to the same factory
    const mappedIds = factoryProducts
      .filter((fp) => fp.factoryName === formFactoryName)
      .map((fp) => fp.productId);
    return activeProds.filter((p: any) => !mappedIds.includes(p.id));
  }, [formFactoryName, factoryProducts, editingProduct, allProducts]);

  // --- Loading State ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading factory products...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Factory Products"
          description="Map factory products and pricing"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load factory products. {error.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Factory Products"
        description="Map factory products and pricing"
        action={
          <Button
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            onClick={openAddModal}
          >
            <Plus className="h-4 w-4" />
            Add Mapping
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Mapped Products"
          value={stats.total}
          description="Factory-product mappings"
          icon={Package}
        />
        <StatCard
          title="Active"
          value={stats.active}
          description="Active mappings"
          icon={CheckCircle2}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Avg Margin %"
          value={`${stats.avgMargin.toFixed(1)}%`}
          description="Distributor - factory margin"
          icon={Percent}
        />
      </div>

      {/* Filter Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-subtle rounded-xl p-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by product, factory, SKU..."
            className="flex-1"
          />
          <Select value={factoryFilter} onValueChange={setFactoryFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="All Factories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Factories</SelectItem>
              {FACTORY_NAMES.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Product Mapping Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Product
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Factory
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  Factory Price
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">
                  Distributor Price
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">
                  Store Price
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  Margin
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  Margin %
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredProducts.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={9} className="py-12 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground text-lg font-medium">
                        No product mappings found
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Try adjusting your filters or add a new mapping.
                      </p>
                    </td>
                  </motion.tr>
                ) : (
                  filteredProducts.map((fp, index) => {
                    const distPrice = getDistributorPrice(fp.productId);
                    const storePrice = getStorePrice(fp.productId);
                    const margin = calcMargin(distPrice, fp.factoryPrice);
                    const marginPercent = calcMarginPercent(distPrice, fp.factoryPrice);

                    return (
                      <motion.tr
                        key={fp.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="border-b border-border/30 last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{getProductName(fp.productId)}</p>
                            {fp.factorySku && (
                              <p className="text-[10px] font-mono text-muted-foreground">
                                {fp.factorySku}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Factory className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs">{fp.factoryName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1 font-semibold">
                            <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                            {fp.factoryPrice.toLocaleString("en-IN")}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right hidden md:table-cell">
                          <span className="text-muted-foreground">
                            {formatINR(distPrice)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right hidden md:table-cell">
                          <span className="text-muted-foreground">
                            {formatINR(storePrice)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={margin >= 0 ? "text-[var(--success)] font-semibold" : "text-[var(--destructive)] font-semibold"}>
                            {formatINR(margin)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-bold text-sm ${
                              marginPercent >= 20
                                ? "text-[var(--success)]"
                                : marginPercent >= 10
                                  ? "text-[var(--warning-dark)]"
                                  : "text-[var(--destructive)]"
                            }`}
                          >
                            {marginPercent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge
                            status={fp.isActive ? "active" : "inactive"}
                            colorMap={activeStatusMap}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditModal(fp)}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => toggleActive(fp)}
                              title={fp.isActive ? "Deactivate" : "Activate"}
                            >
                              {fp.isActive ? (
                                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => confirmDelete(fp)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {productsData?.pagination && (
        <div className="flex items-center justify-between glass-subtle rounded-xl px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {productsData.pagination.total ?? factoryProducts.length} products
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {productsData.pagination.totalPages || 1}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= (productsData.pagination.totalPages || 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Add/Edit Product Mapping Modal */}
      <FormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingProduct ? "Edit Product Mapping" : "Add Product Mapping"}
        description={
          editingProduct
            ? "Update the factory product mapping"
            : "Map a product to a factory with pricing"
        }
        className="sm:max-w-lg"
      >
        <div className="space-y-4 py-2">
          {/* Product */}
          <div className="space-y-1.5">
            <Label htmlFor="fp-product">Product</Label>
            <Select
              value={formProductId}
              onValueChange={setFormProductId}
              disabled={!!editingProduct}
            >
              <SelectTrigger id="fp-product" className="w-full">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.productCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Factory */}
          <div className="space-y-1.5">
            <Label htmlFor="fp-factory">Factory Name</Label>
            <Select
              value={formFactoryName}
              onValueChange={setFormFactoryName}
              disabled={!!editingProduct}
            >
              <SelectTrigger id="fp-factory" className="w-full">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {FACTORY_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Factory Price */}
          <div className="space-y-1.5">
            <Label htmlFor="fp-price">Factory Price (INR)</Label>
            <Input
              id="fp-price"
              type="number"
              placeholder="0"
              value={formFactoryPrice}
              onChange={(e) => setFormFactoryPrice(e.target.value)}
            />
          </div>

          {/* Factory SKU */}
          <div className="space-y-1.5">
            <Label htmlFor="fp-sku">Factory SKU (optional)</Label>
            <Input
              id="fp-sku"
              placeholder="e.g. GDCO-FCM-001"
              value={formFactorySku}
              onChange={(e) => setFormFactorySku(e.target.value)}
            />
          </div>

          {/* Margin Preview */}
          {formProductId && formFactoryPrice && Number(formFactoryPrice) > 0 && (
            <div className="glass-subtle rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">
                Margin Preview
              </h4>
              {(() => {
                const distPrice = getDistributorPrice(formProductId);
                const factPrice = Number(formFactoryPrice);
                const margin = calcMargin(distPrice, factPrice);
                const marginPct = calcMarginPercent(distPrice, factPrice);
                return (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Distributor Price</p>
                      <p className="text-sm font-semibold">{formatINR(distPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Margin</p>
                      <p className={`text-sm font-bold ${margin >= 0 ? "text-[var(--success)]" : "text-[var(--destructive)]"}`}>
                        {formatINR(margin)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Margin %</p>
                      <p
                        className={`text-sm font-bold ${
                          marginPct >= 20
                            ? "text-[var(--success)]"
                            : marginPct >= 10
                              ? "text-[var(--warning-dark)]"
                              : "text-[var(--destructive)]"
                        }`}
                      >
                        {marginPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
              onClick={handleFormSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : editingProduct
                  ? "Update Mapping"
                  : "Add Mapping"}
            </Button>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Product Mapping"
        description={`Are you sure you want to delete the mapping for "${deletingProduct ? getProductName(deletingProduct.productId) : ""}" from "${deletingProduct?.factoryName ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
