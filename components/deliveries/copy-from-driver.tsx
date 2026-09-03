"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees } from "@/lib/hooks/use-employees";

/**
 * "Copy from another driver": makes this driver a standby by copying the
 * chosen driver's agencies and stores. The server switches this driver off
 * duty as part of the copy, so nothing clashes until the office switches
 * them on from the Deliveries board.
 */
export function CopyFromDriver({
  employeeId,
  employeeName,
  isPending,
  onCopy,
}: {
  employeeId: string;
  employeeName: string;
  isPending?: boolean;
  onCopy: (sourceEmployeeId: string) => void;
}) {
  const { data } = useEmployees({ page: 1, pageSize: 200 });
  const [source, setSource] = useState<string>("");
  const drivers = useMemo(
    () => (data?.data ?? []).filter((e) => e.id !== employeeId && (e.employeeRole === "delivery" || e.employeeRole === "both") && e.isActive),
    [data, employeeId],
  );
  if (!drivers.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3">
      <div className="text-xs text-muted-foreground flex-1 min-w-[220px]">
        <span className="font-medium text-foreground">Standby for another driver?</span> Copy their agencies and stores to {employeeName}. {employeeName} goes off duty until you switch them on.
      </div>
      <Select value={source} onValueChange={setSource}>
        <SelectTrigger className="w-[220px]"><SelectValue placeholder="Copy from driver…" /></SelectTrigger>
        <SelectContent>
          {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}{d.deliveryActive === false ? " (off duty)" : ""}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button type="button" size="sm" variant="outline" disabled={!source || isPending} onClick={() => onCopy(source)}>
        <Copy className="h-4 w-4" /> {isPending ? "Copying…" : "Copy"}
      </Button>
    </div>
  );
}
