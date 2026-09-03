"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, CheckCircle2, Trash2, Pencil, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DeliveryMap } from "@/components/deliveries/delivery-map";
import { useClearStorePin, usePinStore, useVerifyStorePin } from "@/lib/hooks/use-deliveries";
import { useDeliveryModuleEnabled } from "@/lib/hooks/use-feature";
import type { Shop } from "@/lib/types";

/** "Location" card on the store page: shows the pin, lets the office set, move, confirm or remove it. */
export function StoreLocationCard({ shop, wide = false }: { shop: Shop; wide?: boolean }) {
  const { enabled } = useDeliveryModuleEnabled();
  const pin = usePinStore();
  const verify = useVerifyStorePin();
  const clear = useClearStorePin();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  if (!enabled) return null;

  // Drop the pin where this browser/device is right now (useful when the
  // office is standing at the store, e.g. on a phone). Needs HTTPS or localhost.
  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("This browser can't provide a location.");
      return;
    }
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      toast.error("Browsers only share location on https:// or http://localhost. Open the admin panel at http://localhost:3002 (or the https address) and try again.", { duration: 10000 });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setEditing(true);
        setDraft({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.info(`Pin placed at your location (±${Math.round(pos.coords.accuracy)} m). Drag to adjust, then save.`);
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location is blocked for this site. Click the lock icon in the address bar → Location → Allow, then reload."
            : "Could not get your location. Try again outdoors or check your device settings.",
          { duration: 10000 },
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const current = draft ?? shop.location ?? null;
  const verified = !!shop.locationVerifiedAt;
  const save = () => {
    if (!draft) return;
    pin.mutate({ shopkeeperId: shop.id, lat: draft.lat, lng: draft.lng }, { onSuccess: () => { setDraft(null); setEditing(false); } });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="glass rounded-xl p-6 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> Location</h3>
        {shop.location && !editing ? (
          verified ? <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Confirmed</span>
                   : <span className="text-xs text-amber-600 font-medium">Captured by agent · not confirmed</span>
        ) : null}
      </div>

      {current || editing ? (
        <DeliveryMap pin={current} onPinChange={editing ? setDraft : undefined} fitKey={`${shop.id}:${editing}`} className={wide ? "h-[460px] w-full rounded-lg overflow-hidden" : "h-[220px] w-full rounded-lg overflow-hidden"} />
      ) : (
        <p className="text-sm text-muted-foreground">No pin yet. The first delivery here will record one, or set it now.</p>
      )}
      {editing ? <p className="text-xs text-muted-foreground">Click the map or drag the pin to the store entrance, then save.</p> : null}

      <div className="flex flex-wrap gap-2">
        {editing ? (
          <>
            <Button size="sm" onClick={save} disabled={!draft || pin.isPending}>Save location</Button>
            <Button size="sm" variant="outline" onClick={useMyLocation} disabled={locating}><LocateFixed className="h-4 w-4" /> {locating ? "Locating…" : "Use my current location"}</Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(null); }}>Cancel</Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => { setEditing(true); setDraft(null); }}><Pencil className="h-4 w-4" /> {shop.location ? "Move pin" : "Set location"}</Button>
            <Button size="sm" variant="outline" onClick={useMyLocation} disabled={locating}><LocateFixed className="h-4 w-4" /> {locating ? "Locating…" : "Use my current location"}</Button>
            {shop.location && !verified ? <Button size="sm" onClick={() => verify.mutate({ shopkeeperId: shop.id })} disabled={verify.isPending}><CheckCircle2 className="h-4 w-4" /> Confirm</Button> : null}
            {shop.location ? <Button size="sm" variant="ghost" onClick={() => clear.mutate({ shopkeeperId: shop.id })} disabled={clear.isPending}><Trash2 className="h-4 w-4" /> Remove</Button> : null}
          </>
        )}
      </div>
    </motion.div>
  );
}
