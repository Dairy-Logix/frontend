"use client";

import { useState } from "react";
import { MapPin, LocateFixed, Trash2, Pencil, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DeliveryMap } from "@/components/deliveries/delivery-map";
import { useUpdateTenant } from "@/lib/hooks";
import type { Tenant } from "@/lib/types";

/**
 * Office / warehouse pin on the tenant profile — where delivery runs start.
 * Set by clicking the map, dragging the pin, or using the browser's location.
 */
export function OfficeLocationCard({ tenant, addressLine }: { tenant: Tenant; addressLine?: string }) {
  const update = useUpdateTenant();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const current = draft ?? tenant.officeLocation ?? null;

  const save = (loc: { lat: number; lng: number } | null) =>
    update.mutate({ id: tenant.id, input: { officeLocation: loc } }, { onSuccess: () => { setEditing(false); setDraft(null); } });

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return toast.error("This browser can't provide a location.");
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      return toast.error("Browsers only share location on https:// or http://localhost. Open the admin panel at http://localhost:3002 and try again.", { duration: 10000 });
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); setEditing(true); setDraft({ lat: pos.coords.latitude, lng: pos.coords.longitude }); toast.info(`Pin placed at your location (±${Math.round(pos.coords.accuracy)} m). Drag to adjust, then save.`); },
      (err) => { setLocating(false); toast.error(err.code === err.PERMISSION_DENIED ? "Location is blocked for this site. Click the lock icon in the address bar → Location → Allow, then reload." : "Could not get your location.", { duration: 10000 }); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return (
    <div className="glass rounded-xl p-6 mt-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> Office location</h3>
          <p className="text-xs text-muted-foreground">{addressLine || "Add the office address above, then pin it on the map."} {tenant.officeLocation ? "" : "· No pin yet"}</p>
        </div>
        {tenant.officeLocation && !editing ? <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Pinned</span> : null}
      </div>
      {current || editing ? (
        <DeliveryMap pin={current} onPinChange={editing ? setDraft : undefined} fitKey={`office:${editing}`} className="h-[320px] w-full rounded-lg overflow-hidden" />
      ) : null}
      {editing ? <p className="text-xs text-muted-foreground">Click the map or drag the pin to the office entrance, then save.</p> : null}
      <div className="flex flex-wrap gap-2">
        {editing ? (
          <>
            <Button size="sm" onClick={() => draft && save(draft)} disabled={!draft || update.isPending}>Save location</Button>
            <Button size="sm" variant="outline" onClick={useMyLocation} disabled={locating}><LocateFixed className="h-4 w-4" /> {locating ? "Locating…" : "Use my current location"}</Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(null); }}>Cancel</Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => { setEditing(true); setDraft(null); }}><Pencil className="h-4 w-4" /> {tenant.officeLocation ? "Move pin" : "Set on map"}</Button>
            <Button size="sm" variant="outline" onClick={useMyLocation} disabled={locating}><LocateFixed className="h-4 w-4" /> {locating ? "Locating…" : "Use my current location"}</Button>
            {tenant.officeLocation ? <Button size="sm" variant="ghost" onClick={() => save(null)} disabled={update.isPending}><Trash2 className="h-4 w-4" /> Remove</Button> : null}
          </>
        )}
      </div>
    </div>
  );
}
