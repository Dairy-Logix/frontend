"use client";

import { Fragment, useState } from "react";
import {
  ArrowRightLeft,
  Loader2,
  Undo2,
  AlertCircle,
  Wallet,
  Receipt,
  ChevronDown,
  ChevronRight,
  Package,
  IndianRupee,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransferWizard } from "@/components/transfers/transfer-wizard";
import {
  useTransfers,
  useReverseTransfer,
} from "@/lib/hooks/use-invoice-transfers";
import { useTranslations } from "@/components/providers/intl-provider";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  completed: "default",
  pending: "outline",
  reversed: "secondary",
  failed: "destructive",
};

export default function TransfersPage() {
  const tPage = useTranslations("pages.transfers");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading, error } = useTransfers({ page: 1, limit: 50 });
  const reverseMutation = useReverseTransfer();

  const transfers = data?.data || [];

  function handleReverse(id: string, transferNumber: string) {
    if (
      !confirm(
        `Reverse transfer ${transferNumber}? This will undo the giver/receiver invoice changes and refund any wallet credit.`,
      )
    )
      return;
    reverseMutation.mutate({ id, input: {} });
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Transfers"
        description="Internal record of items moved between stores. Each transfer adjusts the giver and receiver invoices."
        action={
          <Button onClick={() => setWizardOpen(true)}>
            <ArrowRightLeft className="h-4 w-4" />
            New Transfer
          </Button>
        }
      />

      <TransferWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{(error as any).message}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border bg-background overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No transfers yet. Click &quot;New Transfer&quot; to move items
            between stores.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Transfer #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Giver</TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Settlement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((t) => {
                const settlement = t.giverSettlement;
                const isExpanded = expandedId === t.id;
                return (
                  <Fragment key={t.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleExpand(t.id)}
                    >
                      <TableCell className="w-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(t.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {t.transferNumber}
                      </TableCell>
                      <TableCell>{formatDate(t.transferDate)}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {t.giver.shopkeeperName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t.giver.invoiceNumber
                            ? `Inv ${t.giver.invoiceNumber}`
                            : "Wallet credit"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {t.receiver.shopkeeperName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Inv {t.receiver.invoiceNumber}
                          {t.receiver.invoiceCreated && (
                            <Badge
                              variant="outline"
                              className="ml-1 text-[10px] py-0 px-1"
                            >
                              new
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatINR(t.total)}
                      </TableCell>
                      <TableCell>
                        {settlement ? (
                          <div className="text-xs space-y-0.5">
                            {settlement.invoiceReductionAmount > 0 && (
                              <div className="flex items-center gap-1">
                                <Receipt className="h-3 w-3" />
                                {formatINR(settlement.invoiceReductionAmount)}
                              </div>
                            )}
                            {settlement.walletCreditAmount > 0 && (
                              <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                <Wallet className="h-3 w-3" />
                                {formatINR(settlement.walletCreditAmount)}
                              </div>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[t.status] || "outline"}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {t.status === "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReverse(t.id, t.transferNumber);
                            }}
                            disabled={reverseMutation.isPending}
                          >
                            <Undo2 className="h-4 w-4" />
                            Reverse
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={9} className="p-0">
                          <ExpandedDetail transfer={t} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function ExpandedDetail({ transfer }: { transfer: any }) {
  const items = transfer.items || [];
  return (
    <div className="px-6 py-4 space-y-4">
      <div className="flex items-center gap-3 flex-wrap text-xs">
        {transfer.notes && (
          <span className="text-muted-foreground">
            <span className="font-medium">Notes:</span> {transfer.notes}
          </span>
        )}
        {transfer.createdByName && (
          <span className="text-muted-foreground">
            <span className="font-medium">By:</span> {transfer.createdByName}
            {transfer.createdByRole ? ` (${transfer.createdByRole})` : ""}
          </span>
        )}
        {transfer.reversedAt && (
          <span className="text-muted-foreground">
            <span className="font-medium">Reversed:</span>{" "}
            {formatDate(transfer.reversedAt)}
            {transfer.reversalNotes ? ` — ${transfer.reversalNotes}` : ""}
          </span>
        )}
      </div>

      <div className="rounded-lg border bg-background overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                Product
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                Code
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                Qty
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                Unit price
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                Price / crate
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-xs text-muted-foreground"
                >
                  No items recorded.
                </td>
              </tr>
            )}
            {items.map((it: any, idx: number) => (
              <tr key={idx} className="border-t border-border/40">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{it.productName}</span>
                  </div>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {it.productCode}
                </td>
                <td className="px-3 py-2 text-right">
                  {it.quantity}
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="inline-flex items-center gap-0.5">
                    <IndianRupee className="h-3 w-3 text-muted-foreground" />
                    {(it.unitPrice ?? 0).toLocaleString("en-IN")}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="inline-flex items-center gap-0.5">
                    <IndianRupee className="h-3 w-3 text-muted-foreground" />
                    {(it.price ?? 0).toLocaleString("en-IN")}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  <span className="inline-flex items-center gap-0.5">
                    <IndianRupee className="h-3 w-3 text-muted-foreground" />
                    {(it.subtotal ?? 0).toLocaleString("en-IN")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 font-semibold">
              <td colSpan={5} className="px-3 py-2 text-right">
                Total
              </td>
              <td className="px-3 py-2 text-right">
                <span className="inline-flex items-center gap-0.5">
                  <IndianRupee className="h-3 w-3 text-muted-foreground" />
                  {(transfer.total ?? 0).toLocaleString("en-IN")}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
