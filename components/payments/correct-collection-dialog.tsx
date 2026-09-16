"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { paymentService } from "@/lib/api/services/payment.service";
import { handleApiError } from "@/lib/api/client";
import { paymentKeys } from "@/lib/hooks/use-payments";
import { invoiceKeys } from "@/lib/hooks/use-invoices";
import type { GroupedCollection } from "@/lib/types";

function inr(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

/** Cash/UPI/cheque actually handed over (invoice total minus wallet used, plus overflow credited). */
export function collectionReceived(col: GroupedCollection): number {
  const walletUsed = col.walletUsed ?? 0;
  const walletCredited = col.walletCredited ?? 0;
  return Math.max(0, col.invoiceTotal - walletUsed + walletCredited);
}

interface Props {
  collection: GroupedCollection | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Tenant-admin "edit collection" dialog. Submits a direct correction: the
 * backend voids the original session and re-collects the new amount with the
 * same FIFO invoice / wallet / outstanding logic as a fresh collection.
 */
export function CorrectCollectionDialog({ collection, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("offline");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const original = collection ? collectionReceived(collection) : 0;
  const walletUsed = collection?.walletUsed ?? 0;
  const parsed = Number(amount);
  const amountValid = amount.trim() !== "" && Number.isFinite(parsed) && parsed >= 0;
  const typeChanged = !!collection && paymentType !== collection.paymentType;
  const unchanged = amountValid && parsed === original && !typeChanged;
  const canSubmit = amountValid && !unchanged && !submitting;

  useEffect(() => {
    if (!collection) return;
    setAmount(String(collectionReceived(collection)));
    setPaymentType(collection.paymentType || "offline");
    setReason("");
    setConfirming(false);
  }, [collection]);

  async function submit() {
    if (!collection?.collectionId || !canSubmit) return;
    setSubmitting(true);
    try {
      const response = await paymentService.correctCollection(collection.collectionId, {
        correctedAmount: parsed,
        reason: reason.trim() || undefined,
        paymentType: typeChanged ? paymentType : undefined,
      });
      if (!response.success || !response.data) throw new Error(response.message);
      const rep = response.data.replacement;
      const parts = [`${rep.invoicesCleared} invoice${rep.invoicesCleared !== 1 ? "s" : ""} updated`];
      if ((rep.walletCredited ?? 0) > 0) parts.push(`${inr(rep.walletCredited)} added to wallet`);
      toast.success(`Collection corrected to ${inr(parsed)} — ${parts.join(" · ")}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentKeys.all }),
        queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["shopkeepers"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setConfirming(false);
      onOpenChange(false);
    } catch (err) {
      toast.error(handleApiError(err) || "Could not correct this collection");
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <FormModal
        open={!!collection && !confirming}
        onOpenChange={(open) => !submitting && onOpenChange(open)}
        title="Correct collection amount"
        description="The original entry is voided and the corrected amount is re-applied to the oldest invoices first."
        className="sm:max-w-md"
      >
        {collection && (
          <div className="space-y-4 py-2">
            <div className="glass-subtle rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Store</span>
                <span className="font-medium">{collection.shopkeeperName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Collected by</span>
                <span>{collection.collectedByName || "—"}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/30 pt-1.5">
                <span className="text-xs font-semibold">Recorded amount</span>
                <span className="font-bold">{inr(original)}</span>
              </div>
              {walletUsed > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> Wallet applied (kept as-is)</span>
                  <span>{inr(walletUsed)}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="correct-amount">Correct amount received (INR)</Label>
              <Input
                id="correct-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={submitting}
              />
              {unchanged && (
                <p className="text-xs text-muted-foreground">Enter a different amount or payment method to correct this collection.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="correct-type">Payment method</Label>
              <Select value={paymentType} onValueChange={setPaymentType} disabled={submitting}>
                <SelectTrigger id="correct-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">Cash (Offline)</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online (UPI / Bank Transfer)</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="correct-reason">Reason (optional)</Label>
              <Textarea
                id="correct-reason"
                placeholder="Why is this collection being corrected? (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                disabled={submitting}
              />
            </div>

            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-3 text-xs">
              <div>
                <p className="font-semibold text-foreground mb-1">What happens when you save</p>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  <li>The original entry is cancelled and kept in records as voided.</li>
                  <li>
                    {inr(amountValid ? parsed : 0)} is collected again on the oldest invoices first, the same way
                    the collector app does it.
                  </li>
                  <li>Invoice balances, the store&apos;s outstanding amount and wallet are recalculated automatically.</li>
                  <li>The collector stays the same. The corrected amount shows in their history.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> When editing is not possible
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  <li>
                    The store has paid again after this collection. Correct the newer payment first, then this one.
                  </li>
                  <li>This collection was already corrected once. Edit the newer, corrected entry instead.</li>
                  <li>An invoice from this collection was changed afterwards.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={() => setConfirming(true)} disabled={!canSubmit}>
                Review correction
              </Button>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={!!collection && confirming}
        onOpenChange={(open) => !open && !submitting && setConfirming(false)}
        title="Apply this correction?"
        description={
          collection
            ? `The ${inr(original)} collection for ${collection.shopkeeperName} will be voided and replaced with ${inr(parsed)}${typeChanged ? ` (${paymentType})` : ""}. Invoices, outstanding balance and wallet are updated immediately.`
            : ""
        }
        confirmLabel="Apply correction"
        onConfirm={submit}
        isLoading={submitting}
      />
    </>
  );
}
