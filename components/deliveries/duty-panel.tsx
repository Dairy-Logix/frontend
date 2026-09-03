"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEmployees, useSetDeliveryActive } from "@/lib/hooks/use-employees";
import { TENANT_ROUTES } from "@/lib/constants";
import type { DeliveryTripRow } from "@/lib/types";

/**
 * Drivers on duty — the substitution switch, on the board where the office
 * already is. Switch an absent driver off, then their standby on; the server
 * refuses ON while an on-duty driver holds any of the same stores.
 */
export function DutyPanel({ trips }: { trips: DeliveryTripRow[] }) {
  const { data } = useEmployees({ page: 1, pageSize: 200 });
  const setDuty = useSetDeliveryActive();
  const drivers = useMemo(
    () => (data?.data ?? []).filter((e) => (e.employeeRole === "delivery" || e.employeeRole === "both") && e.isActive),
    [data],
  );
  if (!drivers.length) return null;
  const liveByEmployee = new Map(trips.filter((t) => t.status === "in_progress").map((t) => [t.employeeId, t]));
  const onDuty = drivers.filter((d) => d.deliveryActive !== false).length;

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Drivers on duty</h3>
        <span className="text-xs text-muted-foreground">{onDuty} of {drivers.length} on duty</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Driver absent? Switch them off, then switch their standby on. A driver can&apos;t be switched on while another on-duty driver holds any of the same stores.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {drivers.map((d) => {
          const on = d.deliveryActive !== false;
          const live = liveByEmployee.get(d.id);
          return (
            <div key={d.id} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${on ? "" : "opacity-70 bg-muted/30"}`}>
              <div className="min-w-0">
                <Link href={TENANT_ROUTES.EMPLOYEE_DETAIL(d.id)} className="font-medium text-sm hover:underline truncate block">{d.name}</Link>
                <p className="text-[11px] text-muted-foreground truncate">
                  {live ? `On the road · ${live.counts.delivered}/${live.counts.total} delivered` : on ? `${d.assignedDeliveryShopCount ?? 0} stores` : "Off duty (standby)"}
                </p>
              </div>
              <Switch
                checked={on}
                disabled={setDuty.isPending || !!live}
                onCheckedChange={(next) => setDuty.mutate({ employeeId: d.id, active: next })}
                aria-label={`${d.name} delivery duty`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
