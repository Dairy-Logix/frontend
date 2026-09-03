"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Truck, CheckCircle2, AlertTriangle, Route, MapPin, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeliveryMap, type MapAgent } from "@/components/deliveries/delivery-map";
import { DutyPanel } from "@/components/deliveries/duty-panel";
import { useDeliveryBoard } from "@/lib/hooks/use-deliveries";
import { useFeature } from "@/lib/hooks/use-feature";
import { TENANT_ROUTES } from "@/lib/constants";
import { agoLabel, dateOf, endedByLabel, timeOf, todayYmd, tripStatusMap } from "@/components/deliveries/format";
import type { DeliveryTripRow } from "@/lib/types";

export default function DeliveriesBoardPage() {
  const router = useRouter();
  const [date, setDate] = useState(todayYmd());
  const [vehicleFilter, setVehicleFilter] = useState<string | null>(null);
  const gps = useFeature("gpsTracking");
  const { data, isLoading, error, isFetching } = useDeliveryBoard(date);

  const agents = useMemo<MapAgent[]>(
    () =>
      (data?.trips ?? [])
        .filter((t) => t.lastLocation)
        .map((t) => ({
          id: t.id,
          name: `${t.employeeName ?? "Agent"}${t.vehicle ? ` · ${t.vehicle}` : ""} · ${t.agencyNames.join(" + ") || t.shift}`,
          lat: t.lastLocation!.lat,
          lng: t.lastLocation!.lng,
          at: t.lastLocation!.at,
          live: t.status === "in_progress",
        })),
    [data],
  );

  const isToday = date === todayYmd();
  const s = data?.summary;
  const vehicles = useMemo(() => {
    const m = new Map<string, string>();
    (data?.trips ?? []).forEach((t) => { if (t.vehicle) m.set(t.vehicleId ?? t.vehicle, t.vehicle); });
    return [...m.entries()].map(([id, label]) => ({ id, label }));
  }, [data]);
  const visibleTrips = (data?.trips ?? []).filter((t) => !vehicleFilter || (t.vehicleId ?? t.vehicle) === vehicleFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliveries"
        description={isToday ? "Who is out, where they are, and how far through the route they are." : `Trips on ${dateOf(date)}`}
        action={
          <div className="flex items-center gap-2">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            <Input type="date" value={date} max={todayYmd()} onChange={(e) => setDate(e.target.value)} className="w-[170px]" />
            {!isToday ? <Button variant="outline" size="sm" onClick={() => setDate(todayYmd())}>Today</Button> : null}
          </div>
        }
      />

      {error ? (
        <Alert variant="destructive"><AlertDescription>Could not load trips. Please try again.</AlertDescription></Alert>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Trips" value={s?.trips ?? 0} description={`${s?.inProgress ?? 0} in progress`} icon={Route} tone="primary" />
        <StatCard title="Delivered" value={`${s?.delivered ?? 0} / ${s?.stops ?? 0}`} description="stops delivered" icon={CheckCircle2} tone="emerald" />
        <StatCard title="Still out" value={s?.pending ?? 0} description={`${s?.skipped ?? 0} skipped`} icon={Truck} tone="cyan" />
        <StatCard title="Need attention" value={(s?.failed ?? 0) + (s?.exceptions ?? 0)} description={`${s?.failed ?? 0} could not be delivered`} icon={AlertTriangle} tone="amber" />
      </div>

      {gps ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-3">
          {agents.length ? (
            <DeliveryMap agents={agents} fitKey={`${date}:${agents.length}`} className="h-[380px] w-full rounded-lg overflow-hidden" />
          ) : (
            <div className="h-[160px] flex flex-col items-center justify-center text-muted-foreground gap-2">
              <MapPin className="h-6 w-6" />
              <p className="text-sm">No agent positions yet. Markers appear once a trip starts sending location.</p>
            </div>
          )}
        </motion.div>
      ) : null}

      {isToday ? <DutyPanel trips={data?.trips ?? []} /> : null}

      <div className="glass rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-semibold">Trips</h3>
          {vehicles.length > 1 ? (
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant={vehicleFilter ? "ghost" : "secondary"} onClick={() => setVehicleFilter(null)}>All vehicles</Button>
              {vehicles.map((v) => (
                <Button key={v.id} size="sm" variant={vehicleFilter === v.id ? "secondary" : "ghost"} onClick={() => setVehicleFilter(v.id)}>{v.label}</Button>
              ))}
            </div>
          ) : null}
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !data?.trips.length ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            No trips {isToday ? "started yet today" : "on this day"}. A trip appears here when a delivery agent taps Start in the Field app.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleTrips.map((t) => <TripCard key={t.id} trip={t} onOpen={() => router.push(TENANT_ROUTES.DELIVERY_TRIP(t.id))} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function TripCard({ trip, onOpen }: { trip: DeliveryTripRow; onOpen: () => void }) {
  const c = trip.counts;
  const pct = c.total ? Math.round((c.delivered / c.total) * 100) : 0;
  const live = trip.status === "in_progress";
  return (
    <button onClick={onOpen} className="text-left glass-subtle rounded-xl p-4 hover:bg-muted/40 transition-colors space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{trip.employeeName ?? "Delivery agent"}</p>
          <p className="text-xs text-muted-foreground truncate">{trip.agencyNames.join(" + ") || "Beat"} · {trip.shift === "AM" ? "Morning" : "Evening"}{trip.vehicle ? ` · ${trip.vehicle}` : ""}</p>
        </div>
        <StatusBadge status={trip.status} colorMap={tripStatusMap} />
      </div>
      <div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold">{c.delivered} / {c.total} delivered</span>
          <span className="text-muted-foreground text-xs">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted mt-1 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Started {timeOf(trip.startedAt)}</span>
        {trip.endedAt ? <span>Ended {timeOf(trip.endedAt)}</span> : null}
        {live ? <span className="text-primary">Location {agoLabel(trip.lastLocation?.at)}</span> : <span>{endedByLabel(trip)}</span>}
      </div>
      <div className="flex flex-wrap gap-2 text-[11px]">
        {c.pending ? <span className="px-2 py-0.5 rounded-full bg-muted">{c.pending} pending</span> : null}
        {c.failed ? <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800">{c.failed} not delivered</span> : null}
        {c.skipped ? <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{c.skipped} skipped</span> : null}
        {trip.hasExceptions ? <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">needs attention</span> : null}
      </div>
    </button>
  );
}
