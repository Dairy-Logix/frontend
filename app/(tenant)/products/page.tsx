"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  IndianRupee,
  LayoutGrid,
  Table as TableIcon,
  Archive,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
} from "@/lib/constants";
import type { Product, ProductCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/lib/hooks";
import { Loader2 as LoaderIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from "@/components/providers/intl-provider";

// --- Status Color Map ---

const productStatusMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  true: { label: "Active", variant: "success" },
  false: { label: "Inactive", variant: "default" },
};

// --- Helpers ---

function formatINR(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "₹0";
  return `₹${value.toLocaleString("en-IN")}`;
}

function calculateMargin(sellingPrice: number | undefined, purchasePrice: number | undefined): number {
  if (!purchasePrice || !sellingPrice || purchasePrice === 0) return 0;
  return ((sellingPrice - purchasePrice) / purchasePrice) * 100;
}

function getMarginColor(margin: number): string {
  if (margin >= 20) return "text-green-600";
  if (margin >= 10) return "text-yellow-600";
  return "text-red-600";
}

function getMarginBgColor(margin: number): string {
  if (margin >= 20) return "bg-green-100 text-green-800";
  if (margin >= 10) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

// --- Main Page ---

type ViewMode = "card" | "table";

export default function ProductsPage() {
  const tPage = useTranslations("pages.products");
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Filter state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Data fetching with real API
  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useProducts({
    page,
    pageSize,
    search: search || undefined,
    category: categoryFilter !== "all" ? (categoryFilter as ProductCategory) : undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  });

  // Mutations
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const products = productsData?.data || [];

  // Add / Edit modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formProductCode, setFormProductCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formShortName, setFormShortName] = useState("");
  const [formCategory, setFormCategory] = useState<ProductCategory>("Crate");
  const [formQuantityPerUnit, setFormQuantityPerUnit] = useState("");
  const [formPurchasePrice, setFormPurchasePrice] = useState("");
  const [formSellingPrice, setFormSellingPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Note: Filtering is now handled server-side via the API
  const filteredProducts = products;

  // --- Stats ---

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;

    // Calculate average margin
    const margins = products
      .filter((p) => p.isActive)
      .map((p) => calculateMargin(p.sellingPricePerUnit, p.purchasePricePerUnit));
    const avgMargin = margins.length > 0
      ? margins.reduce((sum, m) => sum + m, 0) / margins.length
      : 0;

    return { total, active, avgMargin };
  }, [products]);

  // --- Form Handlers ---

  function openAddModal() {
    setEditingProduct(null);
    setFormProductCode("");
    setFormName("");
    setFormShortName("");
    setFormCategory("Crate");
    setFormQuantityPerUnit("");
    setFormPurchasePrice("");
    setFormSellingPrice("");
    setFormDescription("");
    setFormOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormProductCode(product.productCode);
    setFormName(product.name);
    setFormShortName(product.shortName);
    setFormCategory(product.category);
    setFormQuantityPerUnit(String(product.quantityPerUnit));
    setFormPurchasePrice(String(product.purchasePricePerUnit));
    setFormSellingPrice(String(product.sellingPricePerUnit));
    setFormDescription(product.description ?? "");
    setFormOpen(true);
  }

  function handleFormSubmit() {
    // Basic validation
    if (!formProductCode.trim()) {
      toast.error("Product code is required");
      return;
    }
    if (!formName.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!formShortName.trim()) {
      toast.error("Short name is required");
      return;
    }
    if (formCategory !== "Piece" && (!formQuantityPerUnit || Number(formQuantityPerUnit) <= 0)) {
      toast.error("Valid quantity per unit is required");
      return;
    }
    if (!formPurchasePrice || Number(formPurchasePrice) <= 0) {
      toast.error("Valid purchase price is required");
      return;
    }
    if (!formSellingPrice || Number(formSellingPrice) <= 0) {
      toast.error("Valid selling price is required");
      return;
    }

    setIsSubmitting(true);

    const input = {
      productCode: formProductCode,
      name: formName,
      shortName: formShortName,
      category: formCategory,
      quantityPerUnit:
        formCategory === "Piece" ? 1 : Number(formQuantityPerUnit),
      purchasePricePerUnit: Number(formPurchasePrice),
      sellingPricePerUnit: Number(formSellingPrice),
      description: formDescription || undefined,
    };

    if (editingProduct) {
      updateProduct.mutate(
        { id: editingProduct.id, input },
        {
          onSuccess: () => {
            setFormOpen(false);
            setIsSubmitting(false);
          },
          onError: () => {
            setIsSubmitting(false);
          },
        }
      );
    } else {
      createProduct.mutate(input, {
        onSuccess: () => {
          setFormOpen(false);
          setIsSubmitting(false);
        },
        onError: () => {
          setIsSubmitting(false);
        },
      });
    }
  }

  function confirmDelete(product: Product) {
    setDeletingProduct(product);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (!deletingProduct) return;
    deleteProduct.mutate(deletingProduct.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeletingProduct(null);
      },
    });
  }

  // --- Table Columns ---

  const tableColumns: ColumnDef<Product>[] = [
    {
      key: "name",
      header: "Product Name",
      sortable: true,
      cell: (row) => (
        <div className="min-w-[120px]">
          <div className="font-semibold text-sm">{row.name}</div>
          <div className="text-xs text-muted-foreground">{row.shortName}</div>
        </div>
      ),
    },
    {
      key: "productCode",
      header: "Product Code",
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs">{row.productCode}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      cell: (row) => (
        <Badge
          variant="secondary"
          className={`text-xs ${
            row.category === "Crate"
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
          }`}
        >
          {row.category === "Crate" ? (
            <Archive className="h-3 w-3 mr-1" />
          ) : (
            <Tag className="h-3 w-3 mr-1" />
          )}
          {row.category}
        </Badge>
      ),
    },
    {
      key: "quantityPerUnit",
      header: "Qty/Unit",
      sortable: true,
      cell: (row) =>
        row.category === "Piece" ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <span className="text-sm">{row.quantityPerUnit}</span>
        ),
    },
    {
      key: "purchasePricePerUnit",
      header: "Purchase Price",
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-medium">
          {formatINR(row.purchasePricePerUnit)}
        </span>
      ),
    },
    {
      key: "sellingPricePerUnit",
      header: "Selling Price",
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-semibold">
          {formatINR(row.sellingPricePerUnit)}
        </span>
      ),
    },
    {
      key: "margin",
      header: "Margin",
      sortable: false,
      cell: (row) => {
        const margin = calculateMargin(
          row.sellingPricePerUnit,
          row.purchasePricePerUnit
        );
        return (
          <Badge
            variant="secondary"
            className={cn("text-xs font-semibold", getMarginBgColor(margin))}
          >
            {margin.toFixed(1)}%
          </Badge>
        );
      },
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <StatusBadge
          status={String(row.isActive)}
          colorMap={productStatusMap}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              confirmDelete(row);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  // --- Calculate live margin in form ---

  const liveMargin = useMemo(() => {
    const purchase = Number(formPurchasePrice);
    const selling = Number(formSellingPrice);
    if (!purchase || !selling || purchase <= 0) return null;
    return calculateMargin(selling, purchase);
  }, [formPurchasePrice, formSellingPrice]);

  // --- Loading State ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={tPage("title")}
          description={tPage("description")}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load products. {error.message}</span>
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
        title="Products"
        description="Manage your product catalog"
        action={
          <Button
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
            onClick={openAddModal}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Products"
          value={stats.total}
          description="In catalog"
          icon={Package}
        />
        <StatCard
          title="Active Products"
          value={stats.active}
          description="Currently listed"
          icon={Package}
          trend={{ value: 8.5, isPositive: true }}
        />
        <StatCard
          title="Avg Margin"
          value={`${stats.avgMargin.toFixed(1)}%`}
          description="Profit margin"
          icon={IndianRupee}
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
            placeholder="Search products..."
            className="flex-1"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {PRODUCT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {PRODUCT_CATEGORY_LABELS[cat]}
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

          {/* View Toggle */}
          <div className="flex items-center gap-1 glass-subtle rounded-lg p-1">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("table")}
              className={cn(
                viewMode === "table" &&
                  "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
              )}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("card")}
              className={cn(
                viewMode === "card" &&
                  "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Product List - Table View */}
      {viewMode === "table" && (
        <DataTable
          columns={tableColumns as unknown as ColumnDef<Record<string, unknown>>[]}
          data={filteredProducts as unknown as Record<string, unknown>[]}
          pagination={
            productsData
              ? {
                  page: productsData.page,
                  pageSize: productsData.pageSize,
                  total: productsData.total,
                  onPageChange: setPage,
                  onPageSizeChange: setPageSize,
                }
              : undefined
          }
        />
      )}

      {/* Product List - Card View */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full glass rounded-xl p-12 text-center"
              >
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-lg font-medium">
                  No products found
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Try adjusting your filters or add a new product.
                </p>
              </motion.div>
            ) : (
              filteredProducts.map((product, index) => {
                const margin = calculateMargin(
                  product.sellingPricePerUnit,
                  product.purchasePricePerUnit
                );

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                  >
                    <div className="glass rounded-xl p-5 h-full flex flex-col">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">
                            {product.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {product.shortName}
                          </p>
                        </div>
                        <StatusBadge
                          status={String(product.isActive)}
                          colorMap={productStatusMap}
                        />
                      </div>

                      {/* Product Code & Category */}
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs font-mono">
                          {product.productCode}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            product.category === "Crate"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {product.category === "Crate" ? (
                            <Archive className="h-3 w-3 mr-1" />
                          ) : (
                            <Tag className="h-3 w-3 mr-1" />
                          )}

                          {product.category}
                        </Badge>
                      </div>

                      {/* Quantity (only relevant for Crate) */}
                      {product.category !== "Piece" && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground">
                            Quantity per unit
                          </p>
                          <p className="text-sm font-medium">
                            {product.quantityPerUnit} pcs
                          </p>
                        </div>
                      )}

                      {/* Prices */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Purchase Price
                          </p>
                          <p className="text-sm font-semibold">
                            {formatINR(product.purchasePricePerUnit)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Selling Price
                          </p>
                          <p className="text-sm font-semibold text-green-600">
                            {formatINR(product.sellingPricePerUnit)}
                          </p>
                        </div>
                      </div>

                      {/* Margin */}
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-1">
                          Profit Margin
                        </p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-sm font-semibold",
                            getMarginBgColor(margin)
                          )}
                        >
                          {margin.toFixed(1)}%
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/30">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditModal(product)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => confirmDelete(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      <FormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingProduct ? "Edit Product" : "Add Product"}
        description={
          editingProduct
            ? "Update the product details"
            : "Fill in the details to create a new product"
        }
        className="sm:max-w-lg"
      >
        <div className="space-y-4 py-2">
          {/* Product Code */}
          <div className="space-y-1.5">
            <Label htmlFor="product-code">Product Code</Label>
            <Input
              id="product-code"
              placeholder="e.g. MLK-FC-1L"
              value={formProductCode}
              onChange={(e) => setFormProductCode(e.target.value)}
            />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="product-name">Product Name</Label>
            <Input
              id="product-name"
              placeholder="e.g. Full Cream Milk 1L"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          {/* Short Name */}
          <div className="space-y-1.5">
            <Label htmlFor="product-short-name">Short Name</Label>
            <Input
              id="product-short-name"
              placeholder="e.g. Milk 1L"
              value={formShortName}
              onChange={(e) => setFormShortName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="product-category">Category</Label>
            <Select
              value={formCategory}
              onValueChange={(val) => setFormCategory(val as ProductCategory)}
            >
              <SelectTrigger id="product-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "Crate" ? (
                      <span className="flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        {PRODUCT_CATEGORY_LABELS[cat]}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {PRODUCT_CATEGORY_LABELS[cat]}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formCategory === "Piece" && (
              <p className="text-xs text-muted-foreground">
                Piece products are sold individually — orders are charged per piece.
              </p>
            )}
          </div>

          {/* Quantity Per Unit (Crate only) */}
          {formCategory !== "Piece" && (
            <div className="space-y-1.5">
              <Label htmlFor="product-quantity">Quantity Per Unit</Label>
              <Input
                id="product-quantity"
                type="number"
                placeholder="e.g. 12"
                value={formQuantityPerUnit}
                onChange={(e) => setFormQuantityPerUnit(e.target.value)}
                min={1}
              />
            </div>
          )}

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="product-purchase-price">Purchase Price (₹)</Label>
              <Input
                id="product-purchase-price"
                type="number"
                placeholder="0.00"
                value={formPurchasePrice}
                onChange={(e) => setFormPurchasePrice(e.target.value)}
                min={0}
                step="0.01"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-selling-price">Selling Price (₹)</Label>
              <Input
                id="product-selling-price"
                type="number"
                placeholder="0.00"
                value={formSellingPrice}
                onChange={(e) => setFormSellingPrice(e.target.value)}
                min={0}
                step="0.01"
              />
            </div>
          </div>

          {/* Live Margin Preview */}
          {liveMargin !== null && (
            <div className="glass-subtle rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Profit Margin
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-sm font-semibold",
                    getMarginBgColor(liveMargin)
                  )}
                >
                  {liveMargin.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {liveMargin >= 20
                  ? "Excellent margin!"
                  : liveMargin >= 10
                    ? "Good margin"
                    : "Low margin - consider adjusting prices"}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              placeholder="Product description (optional)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
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
                  ? "Update Product"
                  : "Create Product"}
            </Button>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${deletingProduct?.name ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
