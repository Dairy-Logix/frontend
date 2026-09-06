"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderCycle } from "@/lib/types";
import {
  BUSINESS_DAY_OFFSET_OPTIONS,
  businessDayWindow,
  businessDateLabel,
  isOrderWindowOpen,
  validateOrderCycle,
  fmtIST,
  fmtDateLabel,
} from "@/lib/order-cycle";

interface OrderCycleFieldsProps {
  value: OrderCycle;
  onChange: (next: OrderCycle) => void;
}

/**
 * Order-cycle / business-day editor shared by the add & edit agency forms.
 * Renders the rollover time, which business day the ordering window belongs
 * to (same day / next day / day after), the auto open/close toggle and its
 * times, plus a live preview of the current ordering window and the business
 * day an order placed right now would be booked under.
 */
export function OrderCycleFields({ value, onChange }: OrderCycleFieldsProps) {
  const set = (patch: Partial<OrderCycle>) => onChange({ ...value, ...patch });

  const window = businessDayWindow(value.dayStartTime || "00:00");
  const cycleError = validateOrderCycle(value);
  const open = value.autoToggle && !cycleError ? isOrderWindowOpen(value) : undefined;
  const dayOffset = value.businessDayOffsetDays ?? 0;
  const businessDay = cycleError ? null : businessDateLabel(value);
  const offsetOption = BUSINESS_DAY_OFFSET_OPTIONS.find((o) => o.value === dayOffset);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h4 className="text-sm font-medium">Order cycle (business day)</h4>
        <p className="text-muted-foreground text-xs">
          Defines the 24-hour ordering window and which business day the orders
          taken in it belong to. Leave the rollover at 00:00 for a normal
          midnight-to-midnight window.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dayStartTime">Ordering window starts at</Label>
          <Input
            id="dayStartTime"
            type="time"
            value={value.dayStartTime || ""}
            onChange={(e) => set({ dayStartTime: e.target.value })}
          />
          <p className="text-muted-foreground text-[11px]">
            e.g. 17:00 → the window runs from yesterday 5:00 PM to today 5:00 PM.
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

      <div className="space-y-2">
        <Label htmlFor="businessDayOffsetDays">This window is the business day of</Label>
        <Select
          value={String(dayOffset)}
          onValueChange={(v) => set({ businessDayOffsetDays: Number(v) })}
        >
          <SelectTrigger id="businessDayOffsetDays" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_DAY_OFFSET_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>
                {o.label} <span className="text-muted-foreground">— {o.hint}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-[11px]">
          Same day = orders belong to the day the window ends on. Next day = an AM
          agency taking orders 12:00 AM – 2:00 PM on the 6th books them under
          business day the 7th.
        </p>
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

      {cycleError && (
        <p className="text-destructive flex items-center gap-1 text-xs font-medium">
          ⚠ {cycleError}
        </p>
      )}

      {/* Live preview */}
      <div className="bg-muted/50 rounded-md p-3 text-xs">
        <p className="font-medium">Preview (now)</p>
        <p className="text-muted-foreground mt-1">
          Ordering window: <span className="font-medium">{fmtIST(window.start)}</span>{" "}
          → <span className="font-medium">{fmtIST(window.end)}</span>
        </p>
        {businessDay && (
          <p className="text-muted-foreground mt-1">
            Business day for orders placed now:{" "}
            <span className="text-foreground font-semibold">{fmtDateLabel(businessDay)}</span>
            {offsetOption && dayOffset > 0 ? ` (${offsetOption.label.toLowerCase()})` : ""}
          </p>
        )}
        {value.autoToggle && !cycleError && (
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
