"use client";

import { useState } from "react";
import { Loader2, RotateCcw, CheckCircle2, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormModal } from "@/components/shared/form-modal";
import { useDeliveryExceptions, useResolveException } from "@/lib/hooks/use-deliveries";
import { dateOf, inr, timeOf, todayYmd } from "@/components/deliveries/format";
import type { DeliveryException, DeliveryExceptionAction } from "@/lib/types";

const daysAgo = (n: number) => {
  const d = new Date(Date.now() - n * 86400e3);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};
const tomorrow = () => new Date(Date.now() + 86400e3).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export default function DeliveryExceptionsPage() {
  const [from, setFrom] = useState(daysAgo(7));
  const { data, isLoading, error } = useDeliveryExceptions(from, todayYmd());
  const resolve = useResolveException();
  const [modal, setModal] = useState<{ item: DeliveryException; action: DeliveryExceptionAction } | null>(null);
  const [reason, setReason] = useState("");
  const [redeliverOn, setRedeliverOn] = useState(tomorrow());

  const open = (item: DeliveryException, action: DeliveryExceptionAction) => {
    setReason("");
    setRedeliverOn(tomorrow());
    setModal({ item, action });
  };
  const submit = () => {
    if (!modal) return;
    resolve.mutate(
      { tripId: modal.item.tripId, shopkeeperId: modal.item.shopkeeperId, action: modal.action, reason: reason || undefined, redeliverOn: modal.action === "reschedule" ? redeliverOn : undefined },
      { onSuccess: () => setModal(null) },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Needs attention"
        description="Stops that were not delivered on trips that have ended. Decide what happens to each: deliver again, confirm it was delivered, or take the goods back."
        action={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Since</span>
            <Input type="date" value={from} max={todayYmd()} onChange={(e) => setFrom(e.target.value)} className="w-[170px]" />
          </div>
        }
      />
      {error ? <Alert variant="destructive"><AlertDescription>Could not load the list.</AlertDescription></Alert> : null}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : !data?.length ? (
        <div className="glass rounded-xl p-10 text-center text-muted-foreground text-sm">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
          Nothing needs attention. Every stop on ended trips has been resolved.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((e) => (
            <div key={`${e.tripId}-${e.shopkeeperId}`} className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{e.shopName}</p>
                  <span className="text-xs text-muted-foreground">{[e.area, e.city].filter(Boolean).join(", ")}</span>
                </div>
                <p className="text-sm mt-1"><span className="text-red-600 font-medium">{e.reason}</span>{e.attemptAt ? <span className="text-muted-foreground"> · {timeOf(e.attemptAt)}</span> : null}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dateOf(e.businessDate)} · {e.shift === "AM" ? "Morning" : "Evening"} · {e.employeeName ?? "Agent"}{e.vehicle ? ` (${e.vehicle})` : ""} · {e.agencyName ?? ""} · {e.orders.map((o) => o.orderNumber).join(", ")} · {inr(e.amount)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => open(e, "reschedule")}><RotateCcw className="h-4 w-4" /> Deliver again</Button>
                <Button size="sm" variant="outline" onClick={() => open(e, "mark_delivered")}><CheckCircle2 className="h-4 w-4" /> Was delivered</Button>
                <Button size="sm" variant="ghost" onClick={() => open(e, "return")}><Undo2 className="h-4 w-4" /> Returned</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal ? (
        <FormModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          title={modal.action === "reschedule" ? "Deliver again" : modal.action === "mark_delivered" ? "Confirm it was delivered" : "Mark as returned"}
          description={`${modal.item.shopName} · ${modal.item.orders.map((o) => o.orderNumber).join(", ")}`}
        >
          <div className="space-y-4">
            {modal.action === "reschedule" ? (
              <div className="space-y-2">
                <Label>Deliver on</Label>
                <Input type="date" value={redeliverOn} min={todayYmd()} onChange={(e) => setRedeliverOn(e.target.value)} />
                <p className="text-xs text-muted-foreground">The orders go back to Confirmed and join the agent&apos;s trip on that day.</p>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>{modal.action === "mark_delivered" ? "Reason (required)" : "Note (optional)"}</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={modal.action === "mark_delivered" ? "e.g. Store owner confirmed receipt by phone" : ""} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={submit} disabled={resolve.isPending || (modal.action === "mark_delivered" && !reason.trim())}>
                {resolve.isPending ? "Saving…" : "Confirm"}
              </Button>
            </div>
          </div>
        </FormModal>
      ) : null}
    </div>
  );
}
