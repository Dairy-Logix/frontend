"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, CheckCircle2, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeliveryMap } from "@/components/deliveries/delivery-map";
import { useClearStorePin, usePinStore, useVerifyStorePin } from "@/lib/hooks/use-deliveries";
import { useFeature } from "@/lib/hooks/use-feature";
import type { Shop } from "@/lib/types";

/** "Location" card on the store page: shows the pin, lets the office set, move, confirm or remove it. */
export function StoreLocationCard({ shop }: { shop: Shop }) {
  const enabled = useFeature("deliveries");
  const pin = usePinStore();
  const verify = useVerifyStorePin();
  const clear = useClearStorePin();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  if (!enabled) return null;

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
        <DeliveryMap pin={current} onPinChange={editing ? setDraft : undefined} fitKey={`${shop.id}:${editing}`} className="h-[220px] w-full rounded-lg overflow-hidden" />
      ) : (
        <p className="text-sm text-muted-foreground">No pin yet. The first delivery here will record one, or set it now.</p>
      )}
      {editing ? <p className="text-xs text-muted-foreground">Click the map or drag the pin to the store entrance, then save.</p> : null}

      <div className="flex flex-wrap gap-2">
        {editing ? (
          <>
            <Button size="sm" onClick={save} disabled={!draft || pin.isPending}>Save location</Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(null); }}>Cancel</Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => { setEditing(true); setDraft(null); }}><Pencil className="h-4 w-4" /> {shop.location ? "Move pin" : "Set location"}</Button>
            {shop.location && !verified ? <Button size="sm" onClick={() => verify.mutate({ shopkeeperId: shop.id })} disabled={verify.isPending}><CheckCircle2 className="h-4 w-4" /> Confirm</Button> : null}
            {shop.location ? <Button size="sm" variant="ghost" onClick={() => clear.mutate({ shopkeeperId: shop.id })} disabled={clear.isPending}><Trash2 className="h-4 w-4" /> Remove</Button> : null}
          </>
        )}
      </div>
    </motion.div>
  );
}
