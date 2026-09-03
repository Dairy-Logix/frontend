"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Flag, Loader2, Camera } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormModal } from "@/components/shared/form-modal";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeliveryMap, type MapStore } from "@/components/deliveries/delivery-map";
import { useDeliveryTrip, useDeliveryTripPath, useForceEndTrip } from "@/lib/hooks/use-deliveries";
import { useFeature } from "@/lib/hooks/use-feature";
import { TENANT_ROUTES } from "@/lib/constants";
import { dateOf, distance, endedByLabel, inr, stopStatusMap, timeOf, tripStatusMap } from "@/components/deliveries/format";
import type { DeliveryTripStop } from "@/lib/types";

export default function DeliveryTripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const gps = useFeature("gpsTracking");
  const { data: trip, isLoading, error } = useDeliveryTrip(tripId);
  const { data: path } = useDeliveryTripPath(gps ? tripId : undefined);
  const forceEnd = useForceEndTrip();
  const [endOpen, setEndOpen] = useState(false);
  const [photo, setPhoto] = useState<{ url: string; title: string } | null>(null);

  const stores = useMemo<MapStore[]>(
    () =>
      (trip?.stops ?? [])
        .filter((s) => s.location)
        .map((s) => ({ id: s.shopkeeperId, name: s.shopName, lat: s.location!.lat, lng: s.location!.lng, status: s.status, subtitle: stopStatusMap[s.status].label })),
    [trip],
  );

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (error || !trip) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(TENANT_ROUTES.DELIVERIES)}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Alert variant="destructive"><AlertDescription>Could not load this trip.</AlertDescription></Alert>
      </div>
    );
  }

  const c = trip.counts;
  const live = trip.status === "in_progress";
  const columns: ColumnDef<DeliveryTripStop>[] = [
    { key: "shopName", header: "Store", cell: (s) => (
      <div>
        <p className="font-medium">{s.shopName}</p>
        <p className="text-xs text-muted-foreground">{[s.area, s.city].filter(Boolean).join(", ") || s.address}{trip.agencyNames.length > 1 && s.agencyName ? ` · ${s.agencyName}` : ""}</p>
      </div>
    ) },
    { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.status} colorMap={stopStatusMap} /> },
    { key: "amount", header: "Amount", cell: (s) => <span className="font-mono">{inr(s.amount)}</span> },
    { key: "orders", header: "Orders", cell: (s) => s.orders.map((o) => o.orderNumber).join(", ") },
    { key: "evidence", header: "Details", cell: (s) => (
      <div className="text-xs text-muted-foreground space-y-0.5">
        {s.status === "delivered" ? (
          <>
            <p>At {timeOf(s.deliveredAt)}{s.verification === "verified" && s.distanceMeters != null ? ` · ${distance(s.distanceMeters)} from pin` : s.verification === "unverified" ? " · location not verified" : s.verification === "out_of_range_override" ? " · confirmed by office" : ""}</p>
            {s.notes ? <p className="italic">“{s.notes}”</p> : null}
          </>
        ) : s.status === "failed" && s.attempt ? (
          <p>{s.attempt.reason} · {timeOf(s.attempt.at)}</p>
        ) : s.status === "skipped" ? (
          <p>Skipped by the agent</p>
        ) : !s.location ? (
          <p>Store has no location pin</p>
        ) : null}
      </div>
    ) },
    { key: "photo", header: "", cell: (s) => s.proofPhotoUrl ? (
      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setPhoto({ url: s.proofPhotoUrl!, title: s.shopName }); }}>
        <Camera className="h-4 w-4" />
      </Button>
    ) : null },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push(TENANT_ROUTES.DELIVERIES)}><ArrowLeft className="h-4 w-4" /> Back to Deliveries</Button>
      <PageHeader
        title={`${trip.employeeName ?? "Delivery agent"} · ${trip.agencyNames.join(" + ") || trip.shift}${trip.vehicle ? ` · ${trip.vehicle}` : ""}`}
        description={`${dateOf(trip.businessDate)} · ${trip.shift === "AM" ? "Morning" : "Evening"} · started ${timeOf(trip.startedAt)}${trip.endedAt ? ` · ended ${timeOf(trip.endedAt)} (${endedByLabel(trip)})` : ""}${trip.endReason ? ` · ${trip.endReason}` : ""}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={trip.status} colorMap={tripStatusMap} />
            {live ? <Button variant="outline" size="sm" onClick={() => setEndOpen(true)}><Flag className="h-4 w-4" /> End trip</Button> : null}
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ["Stops", c.total, ""],
          ["Delivered", c.delivered, "text-emerald-600"],
          ["Pending", c.pending, ""],
          ["Not delivered", c.failed, "text-red-600"],
          ["Skipped", c.skipped, "text-amber-600"],
        ].map(([label, value, cls]) => (
          <div key={label as string} className="glass-subtle rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {gps && (stores.length || trip.lastLocation || (path?.length ?? 0) > 0) ? (
        <div className="glass rounded-xl p-3">
          <DeliveryMap
            stores={stores}
            path={path ?? []}
            agents={trip.lastLocation ? [{ id: trip.id, name: trip.employeeName ?? "Agent", lat: trip.lastLocation.lat, lng: trip.lastLocation.lng, at: trip.lastLocation.at, live }] : []}
            fitKey={trip.id}
            className="h-[380px] w-full rounded-lg overflow-hidden"
          />
        </div>
      ) : null}

      <div className="glass rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4">Stops</h3>
        <DataTable columns={columns as unknown as ColumnDef<Record<string, unknown>>[]} data={trip.stops as unknown as Record<string, unknown>[]} />
      </div>

      <ConfirmDialog
        open={endOpen}
        onOpenChange={setEndOpen}
        title="End this trip from the office?"
        description={`${c.delivered} of ${c.total} delivered. Remaining stops will be marked "Trip ended by the office" and listed under Needs attention.`}
        confirmLabel="End trip"
        variant="destructive"
        isLoading={forceEnd.isPending}
        onConfirm={() => forceEnd.mutate({ tripId: trip.id }, { onSuccess: () => setEndOpen(false) })}
      />

      {photo ? (
        <FormModal open onOpenChange={(o) => !o && setPhoto(null)} title={`Delivery photo · ${photo.title}`} className="max-w-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={`Delivery proof for ${photo.title}`} className="w-full rounded-lg" />
        </FormModal>
      ) : null}
    </div>
  );
}
