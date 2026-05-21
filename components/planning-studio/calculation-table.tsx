"use client";

import { useEffect, useState } from "react";
import { Calculator, Save, Loader2, Circle, CircleDot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  PreviewAgency,
  PreviewRow,
  FormulaQuantityEntry,
} from "@/lib/api/services/planning-studio.service";

interface CalculationTableProps {
  agencies: PreviewAgency[];
  rows: PreviewRow[];
  onSave: (quantities: FormulaQuantityEntry[]) => void;
  saving: boolean;
}

type InputState = Record<string, Record<string, string>>;
type RadioState = Record<string, string | null>;

function buildInitial(rows: PreviewRow[]): {
  inputs: InputState;
  radio: RadioState;
} {
  const inputs: InputState = {};
  const radio: RadioState = {};
  for (const row of rows) {
    inputs[row.productId] = {};
    const saved = row.savedQuantities;
    const nonZero = Object.entries(saved).filter(([, q]) => q > 0);
    if (nonZero.length === 1 && nonZero[0][1] === row.total) {
      radio[row.productId] = nonZero[0][0];
    } else {
      radio[row.productId] = null;
      for (const [agencyId, qty] of Object.entries(saved)) {
        if (qty > 0) inputs[row.productId][agencyId] = String(qty);
      }
    }
  }
  return { inputs, radio };
}

function rowHasInput(inputs: InputState, productId: string): boolean {
  const row = inputs[productId] ?? {};
  for (const v of Object.values(row)) {
    if (v === "" || v === undefined) continue;
    const n = Number(v);
    if (!Number.isNaN(n) && n > 0) return true;
  }
  return false;
}

export function CalculationTable({
  agencies,
  rows,
  onSave,
  saving,
}: CalculationTableProps) {
  const [{ inputs, radio }, setState] = useState(() => buildInitial(rows));
  const [activeSavingAgencyId, setActiveSavingAgencyId] = useState<
    string | null
  >(null);

  useEffect(() => {
    setState(buildInitial(rows));
  }, [rows]);

  useEffect(() => {
    if (!saving) setActiveSavingAgencyId(null);
  }, [saving]);

  function setCell(
    productId: string,
    agencyId: string,
    value: string,
    total: number,
  ) {
    let next = value;
    if (next !== "") {
      const num = Number(next);
      if (Number.isNaN(num) || num < 0) {
        next = "";
      } else if (num > total) {
        next = String(total);
      }
    }
    setState((prev) => {
      const currentRow = prev.inputs[productId] ?? {};
      let newRow: Record<string, string>;
      if (next !== "") {
        newRow = {};
        for (const a of agencies) {
          newRow[a.id] = a.id === agencyId ? next : "0";
        }
      } else {
        newRow = { ...currentRow, [agencyId]: "" };
      }
      return {
        inputs: { ...prev.inputs, [productId]: newRow },
        radio: { ...prev.radio, [productId]: null },
      };
    });
  }

  function selectAgency(productId: string, agencyId: string, total: number) {
    if (total <= 0) return;
    if (radio[productId] === agencyId) return;
    const row = rows.find((r) => r.productId === productId);
    if (!row) return;

    setState((prev) => ({
      inputs: { ...prev.inputs, [productId]: {} },
      radio: { ...prev.radio, [productId]: agencyId },
    }));

    const payload: FormulaQuantityEntry[] = [];
    for (const a of agencies) {
      const saved = row.savedQuantities[a.id];
      const hasSaved = a.id in row.savedQuantities;
      const desired = a.id === agencyId ? total : null;

      if (desired === null) {
        if (hasSaved) {
          payload.push({
            productId,
            agencyId: a.id,
            quantity: null as unknown as number,
          });
        }
      } else if (saved !== desired) {
        payload.push({ productId, agencyId: a.id, quantity: desired });
      }
    }

    if (payload.length > 0) {
      setActiveSavingAgencyId(null);
      onSave(payload);
    }
  }

  function getDesiredQty(
    productId: string,
    agencyId: string,
    total: number,
  ): number | null {
    if (rowHasInput(inputs, productId)) {
      let typedAgencyId: string | null = null;
      let typedValue = 0;
      for (const a of agencies) {
        const v = inputs[productId]?.[a.id];
        if (v === "" || v === undefined) continue;
        const n = Number(v);
        if (!Number.isNaN(n) && n > 0) {
          typedAgencyId = a.id;
          typedValue = n;
          break;
        }
      }
      if (typedAgencyId === null) return 0;
      if (agencyId === typedAgencyId) return typedValue;
      return Math.max(0, total - typedValue);
    }
    if (radio[productId] === agencyId) return total;
    return null;
  }

  function isColumnDirty(agencyId: string): boolean {
    for (const row of rows) {
      const desired = getDesiredQty(row.productId, agencyId, row.total);
      const saved = row.savedQuantities[agencyId];
      const hasSaved = agencyId in row.savedQuantities;
      if (desired === null) {
        if (hasSaved) return true;
      } else if (saved !== desired) {
        return true;
      }
    }
    return false;
  }

  function handleSaveColumn(agencyId: string) {
    const payload: FormulaQuantityEntry[] = [];
    for (const row of rows) {
      const desired = getDesiredQty(row.productId, agencyId, row.total);
      const saved = row.savedQuantities[agencyId];
      const hasSaved = agencyId in row.savedQuantities;

      if (desired === null) {
        if (hasSaved) {
          payload.push({
            productId: row.productId,
            agencyId,
            quantity: null as unknown as number,
          });
        }
      } else if (saved !== desired) {
        payload.push({
          productId: row.productId,
          agencyId,
          quantity: desired,
        });
      }
    }
    if (payload.length === 0) return;
    setActiveSavingAgencyId(agencyId);
    onSave(payload);
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          No orders today from the agencies in this formula. The table will
          populate as orders come in.
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-muted/40 z-10 min-w-[180px]">
                    Product
                  </th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">
                    Formula Result
                  </th>
                  {agencies.map((a) => {
                    const dirty = isColumnDirty(a.id);
                    const isSaving =
                      saving && activeSavingAgencyId === a.id;
                    const disabled = !dirty || saving;
                    return (
                      <th
                        key={`qf-${a.id}`}
                        className="text-right px-3 py-3 font-semibold whitespace-nowrap"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Calculator className="h-3.5 w-3.5 text-primary" />
                          <span>{a.name}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleSaveColumn(a.id)}
                                disabled={disabled}
                                className={cn(
                                  "ml-1 rounded-md p-1 transition-colors",
                                  disabled
                                    ? "text-muted-foreground/40 cursor-not-allowed"
                                    : "text-primary hover:bg-primary/10",
                                )}
                                aria-label={`Save Fixed Quantity for ${a.name}`}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {dirty
                                ? `Save ${a.name} column`
                                : "No changes"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-[11px] font-normal text-muted-foreground">
                          Fixed Quantity
                        </div>
                      </th>
                    );
                  })}
                  {agencies.map((a) => (
                    <th
                      key={`fo-${a.id}`}
                      className="text-right px-4 py-3 font-semibold whitespace-nowrap"
                    >
                      <div>{a.name}</div>
                      <div className="text-[11px] font-normal text-muted-foreground">
                        Final Order
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const total = row.total;
                  const showRadios = !rowHasInput(inputs, row.productId);
                  return (
                    <tr
                      key={row.productId}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-4 py-3 sticky left-0 bg-background z-10">
                        <div className="font-medium">{row.productName}</div>
                        {row.productCode && (
                          <div className="text-xs text-muted-foreground">
                            {row.productCode} · {row.unit}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                        {total}
                      </td>
                      {agencies.map((a) => {
                        const cellValue = inputs[row.productId]?.[a.id] ?? "";
                        const checked = radio[row.productId] === a.id;
                        return (
                          <td
                            key={`qf-${row.productId}-${a.id}`}
                            className="px-1 py-1"
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              {showRadios && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        selectAgency(row.productId, a.id, total)
                                      }
                                      disabled={
                                        total <= 0 || saving || checked
                                      }
                                      className={cn(
                                        "inline-flex items-center justify-center h-5 w-5 rounded-full transition-colors flex-shrink-0",
                                        total <= 0 || saving
                                          ? "opacity-30 cursor-not-allowed text-muted-foreground"
                                          : checked
                                            ? "text-emerald-600 dark:text-emerald-400 cursor-default"
                                            : "text-muted-foreground hover:text-primary",
                                      )}
                                      aria-label={`Assign full ${total} to ${a.name}`}
                                    >
                                      {checked ? (
                                        <CircleDot className="h-4 w-4" />
                                      ) : (
                                        <Circle className="h-4 w-4" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {total <= 0
                                      ? "No orders today"
                                      : checked
                                        ? `${a.name} is fully assigned. Pick another to switch.`
                                        : `Assign full ${total} to ${a.name} (saves immediately)`}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <input
                                type="number"
                                min={0}
                                max={total}
                                step={1}
                                value={cellValue}
                                onChange={(e) =>
                                  setCell(
                                    row.productId,
                                    a.id,
                                    e.target.value,
                                    total,
                                  )
                                }
                                placeholder="0"
                                className="w-14 px-1.5 py-1 text-right text-sm tabular-nums rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-emerald-600 dark:text-emerald-400 font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
                              />
                            </div>
                          </td>
                        );
                      })}
                      {agencies.map((a) => {
                        const desired = getDesiredQty(
                          row.productId,
                          a.id,
                          total,
                        );
                        const display = desired === null ? 0 : desired;
                        return (
                          <td
                            key={`fo-${row.productId}-${a.id}`}
                            className="px-4 py-3 text-right font-medium tabular-nums"
                          >
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
