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
 *
 * Two distinct concepts are edited here, kept in separate cards so they don't
 * read as the same thing:
 *
 *  1. Business day — the rollover time that defines the 24-hour bucket orders
 *     are grouped into, and which calendar date that bucket is booked under
 *     (same day / next day / day after).
 *  2. Ordering hours — the auto open/close toggle and the clock times inside
 *     that 24-hour bucket during which orders are actually accepted.
 *
 * A live preview shows the current 24-hour bucket, the business day an order
 * placed right now would be booked under, and whether ordering is open.
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
    <div className="space-y-4">
      {/* ── 1. Business day ──────────────────────────────────────────── */}
      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <h4 className="text-sm font-medium">Business day</h4>
          <p className="text-muted-foreground text-xs">
            Orders are grouped into 24-hour days for reports, delivery lists and
            invoices. Choose when that day rolls over and which calendar date it
            is booked under. This does not control when shopkeepers can order.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dayStartTime">Day rollover time</Label>
          <Input
            id="dayStartTime"
            type="time"
            value={value.dayStartTime || ""}
            onChange={(e) => set({ dayStartTime: e.target.value })}
          />
          <p className="text-muted-foreground text-[11px]">
            Leave at 12:00 AM for a normal midnight-to-midnight day. e.g. 5:00 PM
            → the day runs from yesterday 5:00 PM to today 5:00 PM.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessDayOffsetDays">Book orders under</Label>
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
            Same day = orders are filed under the date the day ends on. Next day =
            an AM agency taking orders on the 6th for morning delivery books them
            under the 7th.
          </p>
        </div>
      </div>

      {/* ── 2. Ordering hours ────────────────────────────────────────── */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium">Ordering hours</h4>
            <p className="text-muted-foreground text-xs">
              When shopkeepers can actually place orders within each business
              day. Outside these hours the app shows ordering as closed.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <Switch
              id="autoToggle"
              checked={!!value.autoToggle}
              onCheckedChange={(checked) => set({ autoToggle: checked })}
            />
            <Label htmlFor="autoToggle" className="text-muted-foreground text-xs font-normal">
              {value.autoToggle ? "Scheduled" : "Manual"}
            </Label>
          </div>
        </div>

        {value.autoToggle ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderOpenTime">Opens at</Label>
              <Input
                id="orderOpenTime"
                type="time"
                value={value.orderOpenTime || ""}
                onChange={(e) => set({ orderOpenTime: e.target.value })}
              />
              <p className="text-muted-foreground text-[11px]">
                Empty = opens at the day rollover.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderCutoff">Closes at</Label>
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
        ) : (
          <p className="text-muted-foreground text-xs">
            Ordering is opened and closed by hand using the &quot;Accepting
            Orders&quot; switch on the agencies list. Turn on the switch above to
            schedule it automatically.
          </p>
        )}
      </div>

      {cycleError && (
        <p className="text-destructive flex items-center gap-1 text-xs font-medium">
          ⚠ {cycleError}
        </p>
      )}

      {/* Live preview */}
      <div className="bg-muted/50 rounded-md p-3 text-xs">
        <p className="font-medium">Preview (now)</p>
        <p className="text-muted-foreground mt-1">
          Current business day: <span className="font-medium">{fmtIST(window.start)}</span>{" "}
          → <span className="font-medium">{fmtIST(window.end)}</span>
        </p>
        {businessDay && (
          <p className="text-muted-foreground mt-1">
            An order placed now is booked under:{" "}
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
