"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, CircleAlert, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { paymentService, type PaymentCorrectionRequest } from "@/lib/api/services/payment.service";
import { handleApiError } from "@/lib/api/client";
import { paymentKeys } from "@/lib/hooks/use-payments";
import { invoiceKeys } from "@/lib/hooks/use-invoices";
import { useAuthStore } from "@/lib/stores/auth-store";

function inr(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function date(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tenant-admin review queue. Approval/rejection is deliberately explicit. */
export function PaymentCorrectionReview() {
  const role = useAuthStore((state) => state.user?.role);
  const queryClient = useQueryClient();
  const [reviewTarget, setReviewTarget] = useState<{
    request: PaymentCorrectionRequest;
    action: "approve" | "reject";
  } | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: [...paymentKeys.all, "corrections", "pending"],
    queryFn: async () => {
      const response = await paymentService.getCorrectionRequests("pending");
      if (!response.success) throw new Error(response.message || "Could not load correction requests");
      return response.data || [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    enabled: role === "tenant_admin",
  });

  async function executeReview() {
    if (!reviewTarget) return;
    const { request, action } = reviewTarget;
    setIsReviewing(true);
    try {
      const response = action === "approve"
        ? await paymentService.approveCorrection(request._id)
        : await paymentService.rejectCorrection(request._id);
      if (!response.success) throw new Error(response.message || "Correction review failed");
      toast.success(action === "approve" ? "Correction approved and applied" : "Correction rejected");
      await queryClient.invalidateQueries({ queryKey: [...paymentKeys.all, "corrections"] });
      await queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      await queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      setReviewTarget(null);
    } catch (err) {
      // Approval failures are important finance feedback, so keep them visible
      // in the same themed, blocking UI as the confirmation dialog.
      setReviewError(handleApiError(err) || "Correction review failed");
    } finally {
      setIsReviewing(false);
    }
  }

  if (role !== "tenant_admin") return null;
  if (isLoading) {
    return <div className="glass-subtle rounded-xl p-5 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading correction requests…</div>;
  }
  if (error) {
    return <div className="glass-subtle rounded-xl p-5 text-sm text-destructive">Could not load payment correction requests.</div>;
  }
  if (!data?.length) return null;

  return (
    <div className="glass rounded-xl overflow-hidden border border-amber-500/30">
      <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <div>
          <h2 className="font-semibold">Payment correction requests</h2>
          <p className="text-xs text-muted-foreground">Review same-day field corrections before they change invoices and wallet balances.</p>
        </div>
        <span className="ml-auto rounded-full bg-amber-500/15 text-amber-600 text-xs font-semibold px-2 py-1">{data.length} pending</span>
      </div>
      <div className="divide-y divide-border/30">
        {data.map((request) => (
          <div key={request._id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{request.shopkeeperName}</span>
                <span className="text-xs text-muted-foreground">{date(request.requestedAt)}</span>
              </div>
              <p className="text-sm">
                <span className="text-muted-foreground">{request.requestedByName} entered </span>
                <span className="font-semibold">{inr(request.originalAmount)}</span>
                <span className="text-muted-foreground"> → requested </span>
                <span className="font-semibold text-amber-600">{inr(request.requestedAmount)}</span>
              </p>
              <p className="text-xs text-muted-foreground break-words">Reason: {request.reason}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={() => setReviewTarget({ request, action: "reject" })}>
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setReviewTarget({ request, action: "approve" })}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </Button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!reviewTarget}
        onOpenChange={(open) => !open && !isReviewing && setReviewTarget(null)}
        title={reviewTarget?.action === "approve" ? "Approve payment correction?" : "Reject payment correction?"}
        description={reviewTarget?.action === "approve"
          ? `The original ${inr(reviewTarget.request.originalAmount)} collection for ${reviewTarget.request.shopkeeperName} will be voided and replaced with ${inr(reviewTarget.request.requestedAmount)}. This updates invoice and wallet balances.`
          : `The correction request for ${reviewTarget?.request.shopkeeperName ?? "this store"} will be rejected. The original payment will remain unchanged.`}
        confirmLabel={reviewTarget?.action === "approve" ? "Approve correction" : "Reject request"}
        variant={reviewTarget?.action === "reject" ? "destructive" : "default"}
        onConfirm={executeReview}
        isLoading={isReviewing}
      />
      <AlertDialog
        open={!!reviewError}
        onOpenChange={(open) => !open && setReviewError(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-1 flex items-center gap-2 text-destructive">
              <CircleAlert className="h-5 w-5" />
              <AlertDialogTitle>
                Payment correction could not be {reviewTarget?.action === "reject" ? "rejected" : "approved"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>{reviewError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setReviewError(null)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
