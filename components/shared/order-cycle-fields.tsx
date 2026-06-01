"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { OrderCycle } from "@/lib/types";
import {
  businessDayWindow,
  isOrderWindowOpen,
  fmtIST,
} from "@/lib/order-cycle";

interface OrderCycleFieldsProps {
  value: OrderCycle;
  onChange: (next: OrderCycle) => void;
}

/**
 * Order-cycle / business-day editor shared by the add & edit agency forms.
 * Renders the rollover time, the auto open/close toggle and its times, plus a
 * live preview of how the current business day and ordering window resolve.
 */
export function OrderCycleFields({ value, onChange }: OrderCycleFieldsProps) {
  const set = (patch: Partial<OrderCycle>) => onChange({ ...value, ...patch });

  const window = businessDayWindow(value.dayStartTime || "00:00");
  const open = value.autoToggle ? isOrderWindowOpen(value) : undefined;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h4 className="text-sm font-medium">Order cycle (business day)</h4>
        <p className="text-muted-foreground text-xs">
          Defines when this agency&apos;s day rolls over. Leave the rollover at
          00:00 for a normal midnight-to-midnight day.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dayStartTime">Day starts at</Label>
          <Input
            id="dayStartTime"
            type="time"
            value={value.dayStartTime || ""}
            onChange={(e) => set({ dayStartTime: e.target.value })}
          />
          <p className="text-muted-foreground text-[11px]">
            e.g. 17:00 → the day runs from yesterday 5:00 PM to today 5:00 PM.
          </p>
        </div>

        <div className="flex flex-col justify-start space-y-2">
          <Label htmlFor="autoToggle">Auto open/close ordering</Label>
          <div className="flex items-center gap-2 pt-1">
            <Switch
              id="autoToggle"
              checked={!!value.autoToggle}
              onCheckedChange={(checked) => set({ autoToggle: checked })}
            />
            <span className="text-muted-foreground text-xs">
              {value.autoToggle ? "Scheduled" : "Manual toggle"}
            </span>
          </div>
        </div>
      </div>

      {value.autoToggle && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="orderOpenTime">Ordering opens at</Label>
            <Input
              id="orderOpenTime"
              type="time"
              value={value.orderOpenTime || ""}
              onChange={(e) => set({ orderOpenTime: e.target.value })}
            />
            <p className="text-muted-foreground text-[11px]">
              Defaults to the rollover time when empty.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orderCutoff">Ordering closes at</Label>
            <Input
              id="orderCutoff"
              type="time"
              value={value.orderCutoff || ""}
              onChange={(e) => set({ orderCutoff: e.target.value })}
            />
            <p className="text-muted-foreground text-[11px]">
              Empty = stays open until the next rollover.
            </p>
          </div>
        </div>
      )}

      {/* Live preview */}
      <div className="bg-muted/50 rounded-md p-3 text-xs">
        <p className="font-medium">Preview (now)</p>
        <p className="text-muted-foreground mt-1">
          Business day: <span className="font-medium">{fmtIST(window.start)}</span>{" "}
          → <span className="font-medium">{fmtIST(window.end)}</span>
        </p>
        {value.autoToggle && (
          <p className="mt-1">
            Ordering is currently{" "}
            <span className={open ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
              {open ? "OPEN" : "CLOSED"}
            </span>
            {value.orderOpenTime ? ` · opens ${value.orderOpenTime}` : ""}
            {value.orderCutoff ? ` · closes ${value.orderCutoff}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
