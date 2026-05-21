"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Loader2,
  ArrowRightLeft,
  AlertTriangle,
  Wallet,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useShopkeepers } from "@/lib/hooks/use-shopkeepers";
import { invoiceService } from "@/lib/api/services/invoice.service";
import {
  useCreateTransfer,
  useGiverItems,
  usePreviewTransfer,
} from "@/lib/hooks/use-invoice-transfers";
import type { TransferPreview } from "@/lib/api/services/invoice-transfer.service";

type Step = "parties" | "items" | "review";

interface ResolvedReceiverInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  amountDue: number;
}

interface TransferWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function isToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export function TransferWizard({ open, onOpenChange }: TransferWizardProps) {
  const [step, setStep] = useState<Step>("parties");

  const [giverShopkeeperId, setGiverShopkeeperId] = useState("");
  const [receiverShopkeeperId, setReceiverShopkeeperId] = useState("");
  const [receiverInvoice, setReceiverInvoice] =
    useState<ResolvedReceiverInvoice | null>(null);
  const [loadingReceiverInvoice, setLoadingReceiverInvoice] = useState(false);

  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<TransferPreview | null>(null);

  const { data: shopkeepersData, isLoading: loadingShops } = useShopkeepers({
    page: 1,
    pageSize: 500,
  });
  const shopkeepers = shopkeepersData?.data || [];

  const giverItemsQuery = useGiverItems(giverShopkeeperId);
  const giverItemsData = giverItemsQuery.data;
  const giverItemsError = giverItemsQuery.error as
    | { message?: string }
    | undefined;

  const previewMutation = usePreviewTransfer();
  const createMutation = useCreateTransfer();

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setStep("parties");
      setGiverShopkeeperId("");
      setReceiverShopkeeperId("");
      setReceiverInvoice(null);
      setQtyByProduct({});
      setNotes("");
      setPreview(null);
    }
  }, [open]);

  // Reset qty when giver changes (different items)
  useEffect(() => {
    setQtyByProduct({});
  }, [giverShopkeeperId]);

  // Resolve receiver's today open invoice (client-side via invoices service)
  useEffect(() => {
    if (!receiverShopkeeperId) {
      setReceiverInvoice(null);
      return;
    }
    let cancelled = false;
    setLoadingReceiverInvoice(true);
    invoiceService
      .getInvoices({
        page: 1,
        pageSize: 20,
        shopId: receiverShopkeeperId,
      } as any)
      .then((res) => {
        if (cancelled) return;
        const list: any[] = (res.data?.data || []) as any[];
        const todayOpen = list.find(
          (inv) =>
            isToday(inv.invoiceDate || inv.issuedAt) &&
            inv.status !== "paid",
        );
        if (!todayOpen) {
          setReceiverInvoice(null);
          return;
        }
        setReceiverInvoice({
          id: todayOpen.id,
          invoiceNumber: todayOpen.invoiceNumber,
          status: todayOpen.status,
          amountDue: todayOpen.dueAmount ?? todayOpen.amountDue ?? 0,
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingReceiverInvoice(false);
      });
    return () => {
      cancelled = true;
    };
  }, [receiverShopkeeperId]);

  const giverShop = shopkeepers.find(
    (s: any) => s.id === giverShopkeeperId,
  ) as any;
  const receiverShop = shopkeepers.find(
    (s: any) => s.id === receiverShopkeeperId,
  ) as any;

  const transferTotal = useMemo(() => {
    const items = giverItemsData?.items || [];
    return items.reduce((sum, it) => {
      const q = qtyByProduct[it.productCode] || 0;
      return sum + q * (it.pricePerUnit || 0);
    }, 0);
  }, [giverItemsData, qtyByProduct]);

  const hasAnyQty = Object.values(qtyByProduct).some((q) => q > 0);

  function canProceedFromParties() {
    if (
      !giverShopkeeperId ||
      !receiverShopkeeperId ||
      giverShopkeeperId === receiverShopkeeperId
    )
      return false;
    if (giverItemsQuery.isLoading || loadingReceiverInvoice) return false;
    // Block when giver-items lookup errored (typically: no today order)
    if (giverItemsQuery.isError) return false;
    // Must have today's order resolved on the giver side
    if (!giverItemsData) return false;
    // Order must have at least one transferable item
    if (!giverItemsData.items?.length) return false;
    return true;
  }

  async function handleReview() {
    const items = Object.entries(qtyByProduct)
      .filter(([, q]) => q > 0)
      .map(([productCode, quantity]) => ({ productCode, quantity }));
    try {
      const data = await previewMutation.mutateAsync({
        giverShopkeeperId,
        giverInvoiceId: giverItemsData?.todayInvoice?.id,
        receiverShopkeeperId,
        receiverInvoiceId: receiverInvoice?.id,
        items,
        notes,
      });
      setPreview(data);
      setStep("review");
    } catch (e) {
      console.error(e);
    }
  }

  async function handleConfirm() {
    const items = Object.entries(qtyByProduct)
      .filter(([, q]) => q > 0)
      .map(([productCode, quantity]) => ({ productCode, quantity }));
    try {
      await createMutation.mutateAsync({
        giverShopkeeperId,
        giverInvoiceId: giverItemsData?.todayInvoice?.id,
        receiverShopkeeperId,
        receiverInvoiceId: receiverInvoice?.id,
        items,
        notes,
      });
      onOpenChange(false);
    } catch {
      // toast handled
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          (step === "items" ? "sm:max-w-5xl " : "sm:max-w-3xl ") +
          "w-[95vw] max-h-[90vh] overflow-y-auto"
        }
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer items between stores
          </DialogTitle>
          <DialogDescription>
            Items can only be transferred from a store that has an order placed
            for today. The giver&apos;s today invoice is reduced if it exists,
            otherwise the value is credited to their wallet. Both sides receive
            a push notification.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <StepDot label="1. Parties" active={step === "parties"} done={step !== "parties"} />
          <ArrowRight className="h-3 w-3" />
          <StepDot label="2. Items" active={step === "items"} done={step === "review"} />
          <ArrowRight className="h-3 w-3" />
          <StepDot label="3. Review" active={step === "review"} done={false} />
        </div>

        <Separator />

        {step === "parties" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Giver store (has today&apos;s order)</Label>
                <Select
                  value={giverShopkeeperId}
                  onValueChange={setGiverShopkeeperId}
                  disabled={loadingShops}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select giver store" />
                  </SelectTrigger>
                  <SelectContent>
                    {shopkeepers.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.shopName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <GiverCallout
                  shopName={giverShop?.shopName}
                  loading={giverItemsQuery.isLoading}
                  data={giverItemsData}
                  errorMessage={
                    giverItemsQuery.isError
                      ? giverItemsError?.message ||
                        "No order for today"
                      : null
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Receiver store (needs items)</Label>
                <Select
                  value={receiverShopkeeperId}
                  onValueChange={setReceiverShopkeeperId}
                  disabled={loadingShops}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select receiver store" />
                  </SelectTrigger>
                  <SelectContent>
                    {shopkeepers
                      .filter((s: any) => s.id !== giverShopkeeperId)
                      .map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.shopName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <ReceiverCallout
                  shopName={receiverShop?.shopName}
                  loading={loadingReceiverInvoice}
                  invoice={receiverInvoice}
                  selected={!!receiverShopkeeperId}
                />
              </div>
            </div>
          </div>
        )}

        {step === "items" && giverItemsData && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm flex items-center gap-2 flex-wrap">
              <span>
                From <span className="font-medium">{giverShop?.shopName}</span>
              </span>
              <ArrowRight className="h-4 w-4" />
              <span>
                To <span className="font-medium">{receiverShop?.shopName}</span>
              </span>
              <span className="ml-auto text-xs text-muted-foreground font-mono">
                Order {giverItemsData.orderNumber}
              </span>
              {giverItemsData.todayInvoice ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Receipt className="h-3 w-3" />
                  Invoice mode
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                  <Wallet className="h-3 w-3" />
                  Wallet credit mode
                </span>
              )}
            </div>

            {giverItemsData.items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Today&apos;s order has no line items.
              </p>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-right px-3 py-2">Order qty</th>
                      <th className="text-right px-3 py-2">Already transferred</th>
                      <th className="text-right px-3 py-2">Available</th>
                      <th className="text-right px-3 py-2">Price</th>
                      <th className="text-right px-3 py-2">Transfer qty</th>
                      <th className="text-right px-3 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {giverItemsData.items.map((it) => {
                      const q = qtyByProduct[it.productCode] || 0;
                      const sub = q * (it.pricePerUnit || 0);
                      return (
                        <tr
                          key={it.productCode}
                          className="border-t border-border/50"
                        >
                          <td className="px-3 py-2">
                            <div className="font-medium">{it.productName}</div>
                            <div className="text-xs text-muted-foreground">
                              {it.productCode}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {it.orderQty}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {it.alreadyTransferredQty || 0}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {it.availableQty}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatINR(it.pricePerUnit)}
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              max={it.availableQty}
                              step={1}
                              value={q || ""}
                              disabled={it.availableQty <= 0}
                              onChange={(e) => {
                                const next = Number(e.target.value || 0);
                                const clamped = Math.max(
                                  0,
                                  Math.min(next, it.availableQty),
                                );
                                setQtyByProduct((prev) => ({
                                  ...prev,
                                  [it.productCode]: clamped,
                                }));
                              }}
                              className="w-24 ml-auto text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatINR(sub)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30 font-semibold">
                      <td colSpan={6} className="px-3 py-2 text-right">
                        Total
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatINR(transferTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any internal notes about this transfer..."
              />
            </div>
          </div>
        )}

        {step === "review" && preview && (
          <div className="space-y-4 text-sm">
            <ImpactCard
              title={`Giver — ${giverShop?.shopName}`}
              before={preview.giverInvoiceBefore}
              after={preview.giverInvoiceAfter}
            />
            <ImpactCard
              title={`Receiver — ${receiverShop?.shopName}${
                preview.receiverInvoiceWillBeCreated ? " (new invoice)" : ""
              }`}
              before={preview.receiverInvoiceBefore}
              after={preview.receiverInvoiceAfter}
            />
            <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
              <div className="flex justify-between">
                <span>Settlement mode</span>
                <Badge variant="outline">
                  {preview.giverSettlement.mode.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Invoice reduction (giver)</span>
                <span className="font-medium">
                  {formatINR(preview.giverSettlement.invoiceReductionAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Wallet credit (giver)</span>
                <span className="font-medium">
                  {formatINR(preview.giverSettlement.walletCreditAmount)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Giver wallet after</span>
                <span>{formatINR(preview.giverWalletBalanceAfter)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="text-xs text-muted-foreground">
            {step === "items" && transferTotal > 0
              ? `Transferring ${formatINR(transferTotal)}`
              : null}
          </div>
          <div className="flex gap-2 ml-auto">
            {step !== "parties" && (
              <Button
                variant="ghost"
                onClick={() =>
                  setStep(step === "review" ? "items" : "parties")
                }
              >
                Back
              </Button>
            )}
            {step === "parties" && (
              <Button
                onClick={() => setStep("items")}
                disabled={!canProceedFromParties()}
              >
                Next: pick items
              </Button>
            )}
            {step === "items" && (
              <Button
                onClick={handleReview}
                disabled={!hasAnyQty || previewMutation.isPending}
              >
                {previewMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Review impact
              </Button>
            )}
            {step === "review" && (
              <Button
                onClick={handleConfirm}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm transfer
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StepDot({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <span
      className={
        "px-2 py-1 rounded-md " +
        (active
          ? "bg-primary text-primary-foreground"
          : done
          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
          : "bg-muted")
      }
    >
      {label}
    </span>
  );
}

function GiverCallout({
  shopName,
  loading,
  data,
  errorMessage,
}: {
  shopName?: string;
  loading: boolean;
  data:
    | {
        orderNumber: string;
        todayInvoice:
          | { invoiceNumber: string; status: string; amountDue: number }
          | null;
        items: any[];
      }
    | undefined;
  errorMessage: string | null;
}) {
  if (!shopName) {
    return (
      <p className="text-xs text-muted-foreground">
        Pick a giver store to load today&apos;s order.
      </p>
    );
  }
  if (loading) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Looking up today&apos;s order...
      </p>
    );
  }
  if (errorMessage) {
    return (
      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1">
        <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>{errorMessage}</span>
      </p>
    );
  }
  if (!data) {
    return (
      <p className="text-xs text-muted-foreground">No data.</p>
    );
  }
  return (
    <div className="text-xs space-y-0.5">
      <p className="text-muted-foreground">
        Today&apos;s order:{" "}
        <span className="font-mono">{data.orderNumber}</span> · {data.items.length} items
      </p>
      {data.todayInvoice ? (
        <p className="text-muted-foreground">
          Invoice:{" "}
          <span className="font-mono">{data.todayInvoice.invoiceNumber}</span>{" "}
          ({data.todayInvoice.status}, due {formatINR(data.todayInvoice.amountDue)})
        </p>
      ) : (
        <p className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
          <Wallet className="h-3 w-3" />
          No invoice yet — transfer value will be credited to wallet.
        </p>
      )}
    </div>
  );
}

function ReceiverCallout({
  shopName,
  loading,
  invoice,
  selected,
}: {
  shopName?: string;
  loading: boolean;
  invoice: ResolvedReceiverInvoice | null;
  selected: boolean;
}) {
  if (!selected) {
    return (
      <p className="text-xs text-muted-foreground">
        Pick a receiver store to load today&apos;s invoice.
      </p>
    );
  }
  if (loading) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Looking up today&apos;s invoice...
      </p>
    );
  }
  if (invoice) {
    return (
      <p className="text-xs text-muted-foreground">
        Today&apos;s open invoice:{" "}
        <span className="font-mono">{invoice.invoiceNumber}</span> ({invoice.status},
        due {formatINR(invoice.amountDue)})
      </p>
    );
  }
  return (
    <p className="text-xs text-emerald-700 dark:text-emerald-400">
      {shopName} has no open invoice for today — a new one will be created.
    </p>
  );
}

function ImpactCard({
  title,
  before,
  after,
}: {
  title: string;
  before: any | null;
  after: any | null;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="font-medium mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        <InvoiceSnapshot label="Before" inv={before} />
        <InvoiceSnapshot label="After" inv={after} />
      </div>
    </div>
  );
}

function InvoiceSnapshot({ label, inv }: { label: string; inv: any | null }) {
  if (!inv) {
    return (
      <div className="rounded border bg-muted/20 p-2 text-xs text-muted-foreground">
        <p className="font-medium mb-1">{label}</p>
        <p>No invoice</p>
      </div>
    );
  }
  return (
    <div className="rounded border bg-muted/10 p-2 text-xs space-y-0.5">
      <p className="font-medium mb-1">{label}</p>
      <p className="text-muted-foreground">{inv.invoiceNumber || "(new)"}</p>
      <p>Total: {formatINR(inv.total ?? 0)}</p>
      <p>Paid: {formatINR(inv.amountPaid ?? 0)}</p>
      <p>Due: {formatINR(inv.amountDue ?? 0)}</p>
      <p>
        Status: <Badge variant="outline">{inv.status || "—"}</Badge>
      </p>
    </div>
  );
}
