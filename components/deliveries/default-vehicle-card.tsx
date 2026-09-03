"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/lib/hooks/use-settings";
import { useUpdateEmployee } from "@/lib/hooks/use-employees";
import { useDeliveryModuleEnabled } from "@/lib/hooks/use-feature";
import type { Employee } from "@/lib/types";

const NONE = "__none__";

/** "Usual vehicle" card on a delivery driver's page: preselected for them at Start. */
export function DefaultVehicleCard({ employee }: { employee: Employee }) {
  const { enabled } = useDeliveryModuleEnabled();
  const { data: settings } = useSettings();
  const update = useUpdateEmployee();
  const [value, setValue] = useState<string>(employee.defaultVehicleId ?? NONE);
  const fleet = (settings?.config?.delivery?.vehicles ?? []).filter((v) => v.active);
  if (!enabled || (employee.employeeRole !== "delivery" && employee.employeeRole !== "both")) return null;

  const dirty = (value === NONE ? null : value) !== (employee.defaultVehicleId ?? null);
  const save = () => update.mutate({ id: employee.id, input: { defaultVehicleId: value === NONE ? null : value } });

  return (
    <div className="glass rounded-xl p-6 space-y-3">
      <h3 className="text-base font-semibold flex items-center gap-2"><Truck className="h-4 w-4 text-muted-foreground" /> Usual vehicle</h3>
      {fleet.length ? (
        <>
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger><SelectValue placeholder="Pick a vehicle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No default — driver picks each day</SelectItem>
              {fleet.map((v) => <SelectItem key={v.id} value={v.id}>{v.registration}{v.name ? ` · ${v.name}` : ""}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Preselected in the Field app when this driver starts a trip. They can still change it that day.</p>
          <Button size="sm" onClick={save} disabled={!dirty || update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No vehicles yet. Add your vans under Deliveries → Settings, then pick one here.</p>
      )}
    </div>
  );
}
