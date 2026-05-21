"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Truck,
  CheckCircle2,
  Clock,
  IndianRupee,
  Edit3,
  Save,
  Search,
  Loader2 as LoaderIcon,
  AlertCircle,
  CalendarDays,
  Check,
  X,
  CheckSquare,
  ArrowRightLeft,
  Printer,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { TransferWizard } from "@/components/transfers/transfer-wizard";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OrderPrintTemplate } from "@/lib/types";

import {
  useAgencies,
  useProducts,
  useShopkeepers,
  useOrders,
  useCreateOrder,
  useUpdateOrder,
  useUpdateOrderStatus,
  useDeleteOrder,
  useSettings,
} from "@/lib/hooks";

import { useTenantStore } from "@/lib/stores/tenant-store";
import { todayIST, isTodayIST } from "@/lib/utils";
import { useTranslations } from "@/components/providers/intl-provider";

// --- Types ---

interface MatrixCell {
  shopId: string;
  shopName: string;
  productQuantities: Record<string, number>;
  totalAmount: number;
  orderId: string | null;
  orderStatus: string | null;
}

// --- Main Page ---

export default function OrdersPage() {
  const tPage = useTranslations("pages.orders");
  // State
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchShop, setSearchShop] = useState("");
  const [editedQuantities, setEditedQuantities] = useState<Record<string, Record<string, number>>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayIST());
  const [transferWizardOpen, setTransferWizardOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  // Fetch data from all 4 sources
  const { data: agenciesData, isLoading: loadingAgencies, error: agenciesError } = useAgencies({ page: 1, pageSize: 50 });
  const { data: productsData, isLoading: loadingProducts, error: productsError } = useProducts({ page: 1, pageSize: 100 });
  const { data: shopkeepersData, isLoading: loadingShopkeepers, error: shopkeepersError } = useShopkeepers({
    page: 1,
    pageSize: 500,
    agencyId: selectedAgencyId || undefined,
  });
  const { data: ordersData, isLoading: loadingOrders, error: ordersError } = useOrders({
    page: 1,
    pageSize: 1000,
    agencyId: selectedAgencyId || undefined,
    dateFrom: selectedDate,
    dateTo: selectedDate,
  });

  // Mutations
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const updateOrderStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();

  // Print config + tenant for the print sheet
  const { data: settings } = useSettings();
  const tenantName = useTenantStore((s) => s.tenant?.name ?? "");

  // Extract data arrays
  const agencies = agenciesData?.data || [];
  const products = productsData?.data || [];
  const shopkeepers = shopkeepersData?.data || [];
  const orders = ordersData?.data || [];

  // Set initial agency when agencies load
  useMemo(() => {
    if (agencies.length > 0 && !selectedAgencyId) {
      setSelectedAgencyId(agencies[0].id);
    }
  }, [agencies, selectedAgencyId]);

  // Combined loading state
  const isLoading = !agenciesData || !productsData || !shopkeepersData || !ordersData;

  // --- Calculate Matrix Data ---

  const matrixData = useMemo(() => {
    const shopsByAgency = shopkeepers.filter(
      (shop) => (shop.amAgencyId === selectedAgencyId || shop.pmAgencyId === selectedAgencyId) && shop.isActive
    );

    const activeProducts = products.filter((p) => p.isActive);

    // Build matrix cells
    const cells: MatrixCell[] = shopsByAgency.map((shop) => {
      const productQuantities: Record<string, number> = {};
      let totalAmount = 0;

      // Initialize all products with 0
      activeProducts.forEach((product) => {
        productQuantities[product.id] = 0;
      });

      // Use the latest order for this shop (most recent by placedAt/createdAt)
      const shopOrders = orders.filter((order) => order.shopId === shop.id);
      const latestOrder = shopOrders.length > 0
        ? shopOrders.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())[0]
        : null;

      if (latestOrder) {
        latestOrder.items.forEach((item) => {
          if (productQuantities[item.productId] !== undefined) {
            productQuantities[item.productId] = item.quantity;
          }
        });
      }

      // Calculate total amount: qty (crates) × quantityPerUnit × sellingPricePerUnit
      activeProducts.forEach((product) => {
        const qty = editedQuantities[shop.id]?.[product.id] ?? productQuantities[product.id];
        totalAmount += qty * product.quantityPerUnit * product.sellingPricePerUnit;
      });

      return {
        shopId: shop.id,
        shopName: shop.shopName,
        productQuantities,
        totalAmount,
        orderId: latestOrder?.id ?? null,
        orderStatus: latestOrder?.status ?? null,
      };
    });

    return { cells, products: activeProducts };
  }, [selectedAgencyId, editedQuantities, shopkeepers, products, orders]);

  // --- Filter shops by search ---

  const filteredCells = useMemo(() => {
    if (!searchShop) return matrixData.cells;
    return matrixData.cells.filter((cell) =>
      cell.shopName.toLowerCase().includes(searchShop.toLowerCase())
    );
  }, [matrixData.cells, searchShop]);

  // --- Stats for selected agency ---

  const stats = useMemo(() => {
    const agencyOrders = orders.filter((o) => o.agencyId === selectedAgencyId);
    const total = agencyOrders.length;
    const placedToday = agencyOrders.filter(
      (o) => o.status === "placed" && isTodayIST(o.placedAt)
    ).length;
    const pendingDelivery = agencyOrders.filter(
      (o) => o.status === "confirmed" || o.status === "dispatched"
    ).length;
    const completed = agencyOrders.filter((o) => o.status === "completed" || o.status === "delivered").length;
    const totalAmount = agencyOrders.reduce((sum, o) => sum + o.total, 0);

    return { total, placedToday, pendingDelivery, completed, totalAmount };
  }, [selectedAgencyId, orders]);

  // --- Edit handlers ---

  function handleInputFocus(e: React.FocusEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const cell = input.closest("td") as HTMLElement | null;
    const row = input.closest("tr") as HTMLElement | null;
    const scrollContainer = input.closest(".overflow-x-auto") as HTMLElement | null;
    if (!cell || !row || !scrollContainer) return;

    const rowCells = row.querySelectorAll("td");
    const stickyLeftWidth = (rowCells[0] as HTMLElement | undefined)?.offsetWidth ?? 0;
    const stickyRightWidth =
      (rowCells[rowCells.length - 1] as HTMLElement | undefined)?.offsetWidth ?? 0;

    const PADDING = 8;
    const containerRect = scrollContainer.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    const visibleLeft = containerRect.left + stickyLeftWidth;
    const visibleRight = containerRect.right - stickyRightWidth;

    if (cellRect.left < visibleLeft) {
      scrollContainer.scrollLeft -= visibleLeft - cellRect.left + PADDING;
    } else if (cellRect.right > visibleRight) {
      scrollContainer.scrollLeft += cellRect.right - visibleRight + PADDING;
    }
  }

  function handleQuantityChange(shopId: string, productId: string, value: string) {
    const quantity = parseInt(value) || 0;
    setEditedQuantities((prev) => ({
      ...prev,
      [shopId]: {
        ...prev[shopId],
        [productId]: quantity,
      },
    }));
    setHasChanges(true);
  }

  async function handleSaveChanges() {
    const promises: Promise<unknown>[] = [];

    // Group all edits by shopId, then decide per-shop whether to update or create
    Object.entries(editedQuantities).forEach(([shopId, editedProducts]) => {
      // Find the latest order for this shop
      const shopOrders = orders.filter((o) => o.shopId === shopId);
      const existingOrder = shopOrders.length > 0
        ? shopOrders.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())[0]
        : null;

      if (existingOrder) {
        // Build the full items list: start from existing items, apply edits
        const updatedItemsMap = new Map<string, { productId: string; quantity: number; discount?: number }>();

        // Seed with existing items
        existingOrder.items.forEach((item: any) => {
          updatedItemsMap.set(item.productId, {
            productId: item.productId,
            quantity: item.quantity,
          });
        });

        // Apply all edits for this shop
        Object.entries(editedProducts).forEach(([productId, quantity]) => {
          if (quantity > 0) {
            updatedItemsMap.set(productId, { productId, quantity });
          } else {
            updatedItemsMap.delete(productId);
          }
        });

        const finalItems = Array.from(updatedItemsMap.values());
        if (finalItems.length > 0) {
          promises.push(
            updateOrder.mutateAsync({
              id: existingOrder.id,
              input: { items: finalItems },
            })
          );
        }
      } else {
        // No existing order — create one with all edited products
        const newItems: { productId: string; quantity: number }[] = [];

        Object.entries(editedProducts).forEach(([productId, quantity]) => {
          if (quantity > 0) {
            newItems.push({ productId, quantity });
          }
        });

        if (newItems.length > 0) {
          promises.push(
            createOrder.mutateAsync({
              shopId,
              agencyId: selectedAgencyId,
              items: newItems,
            })
          );
        }
      }
    });

    try {
      await Promise.all(promises);
      setHasChanges(false);
      setIsEditMode(false);
      setEditedQuantities({});
      toast.success("Changes saved successfully");
    } catch (error) {
      toast.error("Failed to save some changes");
    }
  }

  function handleToggleEditMode() {
    if (isEditMode && hasChanges) {
      setDiscardConfirmOpen(true);
      return;
    }
    setIsEditMode(!isEditMode);
  }

  function handleConfirmDiscard() {
    setEditedQuantities({});
    setHasChanges(false);
    setIsEditMode(false);
    setDiscardConfirmOpen(false);
  }

  async function handleConfirmOrder(orderId: string) {
    await updateOrderStatus.mutateAsync({ id: orderId, status: "confirmed" });
  }

  async function handleCancelOrder(orderId: string) {
    if (!window.confirm("Delete this order? This cannot be undone.")) return;
    await deleteOrder.mutateAsync(orderId);
  }

  async function handleConfirmAllPending() {
    const pendingCells = matrixData.cells.filter(
      (c) => c.orderId && (c.orderStatus === "placed" || c.orderStatus === "pending")
    );
    if (pendingCells.length === 0) {
      toast.info("No pending orders to confirm");
      return;
    }
    if (!window.confirm(`Confirm all ${pendingCells.length} pending orders for this agency?`)) return;
    await Promise.all(
      pendingCells.map((c) =>
        updateOrderStatus.mutateAsync({ id: c.orderId!, status: "confirmed" })
      )
    );
  }

  function getCellValue(shopId: string, productId: string): number {
    const cell = matrixData.cells.find((c) => c.shopId === shopId);
    if (!cell) return 0;
    return editedQuantities[shopId]?.[productId] ?? cell.productQuantities[productId] ?? 0;
  }

  function getRowTotal(shopId: string): number {
    const cell = matrixData.cells.find((c) => c.shopId === shopId);
    if (!cell) return 0;
    let total = 0;
    matrixData.products.forEach((product) => {
      const qty = getCellValue(shopId, product.id);
      total += qty * product.quantityPerUnit * product.sellingPricePerUnit;
    });
    return total;
  }

  // --- Print templates ---
  const printTemplates: OrderPrintTemplate[] = settings?.config?.orderPrintTemplates ?? [];

  // The template currently chosen for the print render. Set immediately before
  // window.print() and cleared after so the print block only renders when needed.
  const [activePrintTemplateId, setActivePrintTemplateId] = useState<string | null>(null);

  // Portal target for the print sheet (rendered as a direct child of <body>
  // so it escapes the layout's overflow:hidden ancestors). Only available
  // client-side, so guard with a mounted flag.
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => {
    setPortalReady(true);
  }, []);
  const activeTemplate =
    printTemplates.find((t) => t.id === activePrintTemplateId) ?? null;

  // Derive the actual products + cells + totals to render for the active template.
  const printData = useMemo(() => {
    if (!activeTemplate) {
      return { printProducts: [], printCells: [], productTotals: {} as Record<string, number>, grandTotal: 0 };
    }

    const enabledProductIds = activeTemplate.enabledProductIds ?? [];
    const enabledStoresForAgency =
      activeTemplate.enabledStoresByAgency?.[selectedAgencyId];

    const printProducts =
      enabledProductIds.length > 0
        ? matrixData.products.filter((p) => enabledProductIds.includes(p.id))
        : matrixData.products;

    const printCells =
      enabledStoresForAgency && enabledStoresForAgency.length > 0
        ? matrixData.cells.filter((c) => enabledStoresForAgency.includes(c.shopId))
        : matrixData.cells;

    const productTotals: Record<string, number> = {};
    printProducts.forEach((p) => {
      productTotals[p.id] = printCells.reduce(
        (sum, cell) => sum + getCellValue(cell.shopId, p.id),
        0,
      );
    });
    const grandTotal = printCells.reduce(
      (sum, cell) => sum + getRowTotal(cell.shopId),
      0,
    );

    return { printProducts, printCells, productTotals, grandTotal };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrixData, activeTemplate, selectedAgencyId, editedQuantities]);

  const selectedAgency = agencies.find((a) => a.id === selectedAgencyId);

  // Inject per-template @page + .print-sheet CSS so orientation and margins
  // are dynamic per click. Margins live on the @page rule so the print
  // engine handles them natively across pages; the .print-sheet flows
  // naturally inside that printable area.
  function applyTemplatePrintStyle(template: OrderPrintTemplate) {
    const styleId = "orders-print-template-style";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const { top, right, bottom, left } = template.margins;
    // Font size + cell padding come from the static print CSS in globals.css.
    // The table sizes itself automatically based on column count, so no
    // per-template scaling is needed here.
    styleEl.textContent = `
      @media print {
        @page {
          size: A4 ${template.orientation};
          margin: ${Math.max(0, top)}mm ${Math.max(0, right)}mm ${Math.max(0, bottom)}mm ${Math.max(0, left)}mm;
        }
      }
    `;
  }

  function handlePrintWithTemplate(template: OrderPrintTemplate) {
    applyTemplatePrintStyle(template);
    setActivePrintTemplateId(template.id);
    // Wait one paint so React renders the print block before window.print().
    requestAnimationFrame(() => {
      window.print();
      // Clear the active template so the print block goes back to display:none.
      setTimeout(() => setActivePrintTemplateId(null), 100);
    });
  }

  // --- Loading State ---

  if (isLoading || loadingAgencies || loadingProducts || loadingShopkeepers || loadingOrders) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading orders matrix...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---

  const error = agenciesError || productsError || shopkeepersError || ordersError;
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
            <span>Failed to load orders matrix data. {error.message}</span>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Render ---

  return (
    <>
    <div className="space-y-6 print:hidden">
      {/* Page Header */}
      <PageHeader
        title="Orders Matrix"
        description="View and manage orders across all stores"
        action={
          <div className="flex items-center gap-2">
            {!isEditMode && (
              <Button
                variant="outline"
                onClick={() => setTransferWizardOpen(true)}
              >
                <ArrowRightLeft className="h-4 w-4" />
                Transfer Items
              </Button>
            )}
            {!isEditMode && (
              printTemplates.length === 0 ? (
                <Button
                  variant="outline"
                  onClick={() => toast.info("Create a print template in Settings → Print Templates first.")}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Printer className="h-4 w-4" />
                      Print
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
                    {printTemplates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onSelect={() => handlePrintWithTemplate(template)}
                      >
                        <Printer className="h-4 w-4 mr-2 opacity-60" />
                        <span className="flex-1">{template.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-2 uppercase">
                          {template.orientation === "landscape" ? "L" : "P"}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
            {isEditMode && hasChanges && (
              <Button
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                onClick={handleSaveChanges}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            )}
            {!isEditMode && (
              <Button
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
                onClick={handleConfirmAllPending}
                disabled={updateOrderStatus.isPending}
              >
                {updateOrderStatus.isPending ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckSquare className="h-4 w-4" />
                )}
                Confirm All Pending
              </Button>
            )}
            <Button
              variant={isEditMode ? "destructive" : "default"}
              className={
                !isEditMode
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                  : ""
              }
              onClick={handleToggleEditMode}
            >
              <Edit3 className="h-4 w-4" />
              {isEditMode ? "Disable Edit Mode" : "Enable Edit Mode"}
            </Button>
          </div>
        }
      />
      <TransferWizard
        open={transferWizardOpen}
        onOpenChange={setTransferWizardOpen}
      />
      <ConfirmDialog
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
        title="Discard unsaved changes?"
        description="You have unsaved order quantity changes. Discarding will lose them and exit edit mode."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="destructive"
        onConfirm={handleConfirmDiscard}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Orders"
          value={stats.total}
          description="For selected agency"
          icon={ShoppingCart}
        />
        <StatCard
          title="Placed Today"
          value={stats.placedToday}
          description="New orders today"
          icon={Clock}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Pending Delivery"
          value={stats.pendingDelivery}
          description="Confirmed & dispatched"
          icon={Truck}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          description="Successfully delivered"
          icon={CheckCircle2}
        />
        <StatCard
          title="Total Amount"
          value={`₹${(stats.totalAmount / 1000).toFixed(1)}K`}
          description="Total order value"
          icon={IndianRupee}
        />
      </div>

      {/* Agency Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-xl p-1"
      >
        <Tabs value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
          <TabsList className="w-full bg-muted/30 justify-start p-1">
            {agencies.map((agency) => {
              const shopCount = shopkeepers.filter(
                (s) => (s.amAgencyId === agency.id || s.pmAgencyId === agency.id) && s.isActive
              ).length;
              return (
                <TabsTrigger
                  key={agency.id}
                  value={agency.id}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center gap-2"
                >
                  <span>{agency.name}</span>
                  {agency.id === selectedAgencyId && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-background/20">
                      {shopCount}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Search & Date Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-subtle rounded-xl p-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <SearchInput
              value={searchShop}
              onChange={setSearchShop}
              placeholder="Search stores by name..."
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[150px] h-9 text-sm"
            />
            {selectedDate !== todayIST() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(todayIST())}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Today
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Matrix Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="glass rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-red-500/10 to-orange-500/10 backdrop-blur">
              <tr className="border-b-2 border-primary/20">
                <th className="text-left py-3 px-4 font-semibold text-foreground bg-gradient-to-r from-red-500/10 to-orange-500/10 sticky left-0 z-20 min-w-[200px] border-r border-border">
                  Store Name
                </th>
                {matrixData.products.map((product) => (
                  <th
                    key={product.id}
                    className={`text-center py-3 font-medium border-r border-border/50 ${
                      isEditMode ? "px-0 min-w-[56px]" : "px-1 min-w-0"
                    }`}
                    title={product.category}
                  >
                    <span className="font-semibold text-foreground text-sm">
                      {product.shortName}
                    </span>
                  </th>
                ))}
                <th className="text-center py-3 px-4 font-semibold text-foreground min-w-[130px] border-r border-border/50">
                  Status
                </th>
                <th className="text-right py-3 px-4 font-semibold text-foreground bg-gradient-to-r from-red-500/10 to-orange-500/10 min-w-[140px] sticky right-0 z-10 border-l-2 border-border">
                  <div className="flex items-center justify-end gap-1">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Total Amount
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCells.length === 0 ? (
                <tr>
                  <td
                    colSpan={matrixData.products.length + 3}
                    className="py-12 text-center"
                  >
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground text-lg font-medium">
                      No stores found
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Try adjusting your search or select a different agency.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCells.map((cell, rowIndex) => (
                  <motion.tr
                    key={cell.shopId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: rowIndex * 0.02 }}
                    className={`border-b border-border/30 last:border-0 hover:bg-white/5 transition-colors ${
                      rowIndex % 2 === 0 ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <td className="py-2 px-4 font-medium bg-background/95 sticky left-0 z-10 border-r border-border">
                      {cell.shopName}
                    </td>
                    {matrixData.products.map((product) => {
                      const value = getCellValue(cell.shopId, product.id);
                      return (
                        <td
                          key={product.id}
                          className={`text-center border-r border-border/50 ${
                            isEditMode ? "p-0" : "py-2 px-1"
                          }`}
                        >
                          {isEditMode ? (
                            <Input
                              type="number"
                              min="0"
                              value={value}
                              onChange={(e) =>
                                handleQuantityChange(
                                  cell.shopId,
                                  product.id,
                                  e.target.value
                                )
                              }
                              onFocus={handleInputFocus}
                              className="w-14 h-7 px-1 text-xs text-center bg-white/5 border-white/20 focus:bg-white/10 focus:border-orange-500"
                            />
                          ) : (
                            <span className={value > 0 ? "font-semibold" : "text-muted-foreground"}>
                              {value > 0 ? value : "-"}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-center border-r border-border/50">
                      {cell.orderId ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {cell.orderStatus === "confirmed" || cell.orderStatus === "dispatched" || cell.orderStatus === "delivered" || cell.orderStatus === "completed" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-600 border border-green-500/30">
                              <CheckCircle2 className="h-3 w-3" />
                              {cell.orderStatus === "confirmed" ? "Confirmed" : cell.orderStatus.charAt(0).toUpperCase() + cell.orderStatus.slice(1)}
                            </span>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 border border-amber-500/30">
                                <Clock className="h-3 w-3" />
                                Pending
                              </span>
                              {!isEditMode && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleConfirmOrder(cell.orderId!)}
                                    disabled={updateOrderStatus.isPending}
                                    className="p-1 rounded-full hover:bg-green-500/20 text-green-600 transition-colors disabled:opacity-50"
                                    title="Confirm order"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelOrder(cell.orderId!)}
                                    disabled={deleteOrder.isPending}
                                    className="p-1 rounded-full hover:bg-red-500/20 text-red-500 transition-colors disabled:opacity-50"
                                    title="Delete order"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">No order</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-right font-bold bg-gradient-to-r from-red-500/5 to-orange-500/5 sticky right-0 z-10 border-l-2 border-border bg-background">
                      <div className="flex items-center justify-end gap-1">
                        <IndianRupee className="h-3.5 w-3.5" />
                        <span>
                          {getRowTotal(cell.shopId).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>

    {/* ===================== PRINT-ONLY SHEET (portaled to <body>) ===================== */}
    {portalReady &&
      createPortal(
        <div className="print-sheet">
          {activeTemplate?.showTitle !== false && (
            <div className="print-sheet-header">
              <div>
                <div className="print-sheet-title">
                  {activeTemplate?.titleText?.trim() || tenantName || "Order Sheet"}
                </div>
                <div className="print-sheet-subtitle">
                  {selectedAgency ? `${selectedAgency.name} — ` : ""}Order Sheet
                </div>
              </div>
              <div className="print-sheet-meta">
                <div>Date: {selectedDate}</div>
                <div>
                  Generated:{" "}
                  {new Date().toLocaleString("en-IN", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              </div>
            </div>
          )}

          <table className="print-sheet-table">
            <thead>
              <tr>
                <th className="print-col-store">Dealer</th>
                {printData.printProducts.map((product) => (
                  <th key={product.id} className="print-col-product">
                    {product.shortName}
                  </th>
                ))}
                <th className="print-col-total">Total Price</th>
              </tr>
            </thead>
            <tbody>
              {printData.printCells.map((cell) => (
                <tr key={cell.shopId}>
                  <td className="print-col-store">{cell.shopName}</td>
                  {printData.printProducts.map((product) => {
                    const qty = getCellValue(cell.shopId, product.id);
                    return (
                      <td key={product.id} className="print-col-product">
                        {qty > 0 ? qty : ""}
                      </td>
                    );
                  })}
                  <td className="print-col-total">
                    ₹{getRowTotal(cell.shopId).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="print-totals-row">
                <td className="print-col-store">Total</td>
                {printData.printProducts.map((product) => {
                  const total = printData.productTotals[product.id] ?? 0;
                  return (
                    <td key={product.id} className="print-col-product">
                      {total > 0 ? total : ""}
                    </td>
                  );
                })}
                <td className="print-col-total">
                  ₹{printData.grandTotal.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>,
        document.body
      )}
    </>
  );
}
