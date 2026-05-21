"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar, Building2 } from "lucide-react";
import type { AnalyticsRange, AnalyticsAgencyOption } from "@/lib/types";

const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom" },
];

interface Props {
  range: AnalyticsRange;
  from?: string;
  to?: string;
  agencyId?: string;
  agencies: AnalyticsAgencyOption[];
  onChange: (next: {
    range: AnalyticsRange;
    from?: string;
    to?: string;
    agencyId?: string;
  }) => void;
}

const AGENCY_ALL = "__all__";

export function AnalyticsFilter({
  range,
  from,
  to,
  agencyId,
  agencies,
  onChange,
}: Props) {
  const [draftFrom, setDraftFrom] = useState(from ?? "");
  const [draftTo, setDraftTo] = useState(to ?? "");

  const handleRange = (next: AnalyticsRange) => {
    if (next === "custom") {
      onChange({ range: "custom", from: draftFrom || undefined, to: draftTo || undefined, agencyId });
    } else {
      onChange({ range: next, agencyId });
    }
  };

  const handleApplyCustom = () => {
    if (!draftFrom || !draftTo) return;
    onChange({ range: "custom", from: draftFrom, to: draftTo, agencyId });
  };

  const handleAgencyChange = (next: string) => {
    onChange({
      range,
      from,
      to,
      agencyId: next === AGENCY_ALL ? undefined : next,
    });
  };

  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleRange(opt.value)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                range === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {range === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="h-9 w-[150px]"
              />
            </div>
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              className="h-9 w-[150px]"
            />
            <Button
              size="sm"
              onClick={handleApplyCustom}
              disabled={!draftFrom || !draftTo}
            >
              Apply
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Select value={agencyId ?? AGENCY_ALL} onValueChange={handleAgencyChange}>
          <SelectTrigger className="h-9 min-w-[180px]">
            <SelectValue placeholder="All agencies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AGENCY_ALL}>All agencies</SelectItem>
            {agencies.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
