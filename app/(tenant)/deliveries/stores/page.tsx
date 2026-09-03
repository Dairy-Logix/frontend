"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, CheckCircle2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeliveryMap, type MapStore } from "@/components/deliveries/delivery-map";
import { useClearStorePin, usePinStore, useUnverifiedStorePins, useVerifyStorePin } from "@/lib/hooks/use-deliveries";
import { TENANT_ROUTES } from "@/lib/constants";
import type { UnverifiedStorePin } from "@/lib/types";

/**
 * Store pins captured in the field (first delivery at an unpinned store) wait
 * here for the office to confirm or adjust. Select a row, drag the pin on the
 * map if it's off, then Confirm.
 */
export default function StorePinsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useUnverifiedStorePins();
  const verify = useVerifyStorePin();
  const pin = usePinStore();
  const clear = useClearStorePin();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);

  const selected: UnverifiedStorePin | undefined = data?.find((s) => s.shopkeeperId === selectedId) ?? data?.[0];
  const effectiveId = selected?.shopkeeperId ?? null;
  const currentPin = draft ?? selected?.location ?? null;

  const others = useMemo<MapStore[]>(
    () => (data ?? []).filter((s) => s.location && s.shopkeeperId !== effectiveId).map((s) => ({ id: s.shopkeeperId, name: s.shopName, lat: s.location!.lat, lng: s.location!.lng, status: "unverified" as const })),
    [data, effectiveId],
  );

  const select = (id: string) => { setSelectedId(id); setDraft(null); };
  const confirm = () => {
    if (!selected) return;
    if (draft) pin.mutate({ shopkeeperId: selected.shopkeeperId, lat: draft.lat, lng: draft.lng }, { onSuccess: () => setDraft(null) });
    else verify.mutate({ shopkeeperId: selected.shopkeeperId });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Store locations" description="Pins recorded by delivery agents at the store. Confirm each one, or drag it to the right spot first." />
      {error ? <Alert variant="destructive"><AlertDescription>Could not load store pins.</AlertDescription></Alert> : null}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : !data?.length ? (
        <div className="glass rounded-xl p-10 text-center text-muted-foreground text-sm">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
          No store locations waiting for confirmation. New pins appear here after an agent&apos;s first delivery to an unmapped store.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-2 max-h-[520px] overflow-y-auto">
            {data.map((s) => (
              <button
                key={s.shopkeeperId}
                onClick={() => select(s.shopkeeperId)}
                className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${s.shopkeeperId === effectiveId ? "bg-primary/10" : "hover:bg-muted/50"}`}
              >
                <p className="font-medium text-sm">{s.shopName}</p>
                <p className="text-xs text-muted-foreground truncate">{[s.area, s.city].filter(Boolean).join(", ") || s.address}</p>
                <p className="text-[11px] text-muted-foreground">{s.locationSource === "field_capture" ? "Captured by agent" : s.locationSource} · {s.locationCapturedAt ? new Date(s.locationCapturedAt).toLocaleDateString("en-IN") : ""}</p>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2 glass rounded-xl p-3 space-y-3">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div>
                    <p className="font-semibold">{selected.shopName}</p>
                    <p className="text-xs text-muted-foreground">{draft ? "Pin moved — confirm to save the new spot" : "Drag the pin or click the map to adjust"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => router.push(TENANT_ROUTES.SHOPKEEPER_DETAIL(selected.shopkeeperId))}>Open store</Button>
                    <Button size="sm" variant="ghost" onClick={() => clear.mutate({ shopkeeperId: selected.shopkeeperId })} disabled={clear.isPending}><Trash2 className="h-4 w-4" /> Remove</Button>
                    <Button size="sm" onClick={confirm} disabled={verify.isPending || pin.isPending}><CheckCircle2 className="h-4 w-4" /> {draft ? "Save & confirm" : "Confirm"}</Button>
                  </div>
                </div>
                <DeliveryMap pin={currentPin} onPinChange={setDraft} stores={others} fitKey={selected.shopkeeperId} className="h-[440px] w-full rounded-lg overflow-hidden" />
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm"><MapPin className="h-5 w-5 mr-2" /> Select a store</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
