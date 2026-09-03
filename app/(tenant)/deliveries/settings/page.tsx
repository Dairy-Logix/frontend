"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSettings, useUpdateSettings } from "@/lib/hooks/use-settings";
import { useFeature } from "@/lib/hooks/use-feature";
import type { DeliverySettings, DeliveryVehicle } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

const DEFAULTS: DeliverySettings = {
  vehicles: [],
  proximityRadiusMeters: 150,
  strictProximity: false,
  requireProofPhoto: false,
  locationIntervalSec: 30,
  autoEndTripAfterHours: 12,
  retentionDays: 90,
  failureReasons: ["Store closed", "Owner not available", "Refused delivery", "Wrong or damaged items", "Could not reach location", "Other"],
  tripEndReasons: ["Ran out of time", "Vehicle problem", "Stock finished", "Weather or road closed", "Other"],
};

export default function DeliverySettingsPage() {
  const { data, isLoading } = useSettings();
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  // Keyed on the saved revision so a fresh load re-seeds the form without an effect.
  return <DeliverySettingsForm key={data?.updatedAt ?? "new"} initial={{ ...DEFAULTS, ...(data?.config?.delivery ?? {}) }} />;
}

function DeliverySettingsForm({ initial }: { initial: DeliverySettings }) {
  const update = useUpdateSettings();
  const gps = useFeature("gpsTracking");
  const photos = useFeature("photoProofDelivery");
  const [form, setForm] = useState<DeliverySettings>(initial);

  const set = <K extends keyof DeliverySettings>(k: K, v: DeliverySettings[K]) => setForm((f) => ({ ...f, [k]: v }));
  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  const setVehicle = (i: number, patch: Partial<DeliveryVehicle>) =>
    setForm((f) => ({ ...f, vehicles: f.vehicles.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));
  const addVehicle = () => setForm((f) => ({ ...f, vehicles: [...f.vehicles, { id: "", registration: "", name: "", active: true }] }));
  const removeVehicle = (i: number) => setForm((f) => ({ ...f, vehicles: f.vehicles.filter((_, j) => j !== i) }));
  const save = () =>
    update.mutate({
      delivery: { ...form, vehicles: form.vehicles.filter((v) => v.registration.trim()).map((v) => ({ ...v, id: v.id || undefined as unknown as string })) },
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Delivery settings" description="How strict deliveries are, what the agent must record, and how long evidence is kept." />

      <div className="glass rounded-xl p-6 space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold">At the store</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Distance allowed from the store pin (metres)</Label>
              <Input type="number" min={20} max={5000} value={form.proximityRadiusMeters} onChange={(e) => set("proximityRadiusMeters", Number(e.target.value))} disabled={!gps} />
              <p className="text-xs text-muted-foreground">{gps ? "Deliver is accepted only within this distance. 150 m suits dense market streets; raise it for rural beats." : "Needs the GPS tracking feature on your plan."}</p>
            </div>
            <div className="space-y-1.5">
              <Label>How often the agent&apos;s position is sent (seconds)</Label>
              <Input type="number" min={10} max={600} value={form.locationIntervalSec} onChange={(e) => set("locationIntervalSec", Number(e.target.value))} disabled={!gps} />
            </div>
          </div>
          <ToggleRow label="Block delivery at stores with no location pin" hint="Off: the first delivery records the store's location for you to confirm. On: the office must pin every store first." checked={form.strictProximity} onChange={(v) => set("strictProximity", v)} disabled={!gps} />
          <ToggleRow label="Require a delivery photo" hint={photos ? "The agent must take a photo before marking a stop delivered." : "Needs the photo proof feature on your plan."} checked={form.requireProofPhoto} onChange={(v) => set("requireProofPhoto", v)} disabled={!photos} />
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Vehicles</h3>
            <p className="text-xs text-muted-foreground">Your vans. Drivers pick one of these at Start; with an empty list they type a label instead. Inactive vans stay in old trips but can&apos;t be picked.</p>
          </div>
          <div className="space-y-2">
            {form.vehicles.map((v, i) => (
              <div key={v.id || i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                <Input
                  placeholder="Registration, e.g. GJ05 AB 1234"
                  value={v.registration}
                  onChange={(e) => setVehicle(i, { registration: e.target.value.toUpperCase() })}
                />
                <Input placeholder="Name (optional), e.g. Tata Ace 2" value={v.name ?? ""} onChange={(e) => setVehicle(i, { name: e.target.value })} />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={v.active} onCheckedChange={(on) => setVehicle(i, { active: on })} /> Active
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeVehicle(i)} aria-label="Remove vehicle"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addVehicle}><Plus className="h-4 w-4" /> Add vehicle</Button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold">Trips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Close a forgotten trip after (hours)</Label>
              <Input type="number" min={1} max={48} value={form.autoEndTripAfterHours} onChange={(e) => set("autoEndTripAfterHours", Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">The agent gets a reminder an hour before.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Keep delivery evidence for (days)</Label>
              <Input type="number" min={7} max={730} value={form.retentionDays} onChange={(e) => set("retentionDays", Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Location, distance, photo and reason are cleared after this. Who delivered and when is kept forever.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold">Reasons the agent can pick</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Could not deliver a stop</Label>
              <Textarea rows={6} value={form.failureReasons.join("\n")} onChange={(e) => set("failureReasons", lines(e.target.value))} />
              <p className="text-xs text-muted-foreground">One per line.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Ended the trip with stops not attempted</Label>
              <Textarea rows={6} value={form.tripEndReasons.join("\n")} onChange={(e) => set("tripEndReasons", lines(e.target.value))} />
              <p className="text-xs text-muted-foreground">One per line.</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={save} disabled={update.isPending} className="bg-gradient-primary">{update.isPending ? "Saving…" : "Save delivery settings"}</Button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange, disabled }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
