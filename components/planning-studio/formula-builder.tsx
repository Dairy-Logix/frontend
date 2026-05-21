"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Agency } from "@/lib/types";
import type { AgencyFormulaToken } from "@/lib/api/services/planning-studio.service";

interface FormulaBuilderProps {
  agencies: Agency[];
  initialTokens: AgencyFormulaToken[];
  onSave: (tokens: AgencyFormulaToken[]) => void;
  saving: boolean;
}

function tokensToSlots(
  tokens: AgencyFormulaToken[],
): [string | null, string | null] {
  const agencyTokens = tokens.filter(
    (t): t is Extract<AgencyFormulaToken, { type: "agency" }> =>
      t.type === "agency",
  );
  return [agencyTokens[0]?.agencyId ?? null, agencyTokens[1]?.agencyId ?? null];
}

export function FormulaBuilder({
  agencies,
  initialTokens,
  onSave,
  saving,
}: FormulaBuilderProps) {
  const [slot1, setSlot1] = useState<string | null>(null);
  const [slot2, setSlot2] = useState<string | null>(null);

  useEffect(() => {
    const [a, b] = tokensToSlots(initialTokens);
    setSlot1(a);
    setSlot2(b);
  }, [initialTokens]);

  const isValid =
    !!slot1 && !!slot2 && slot1 !== slot2;
  const isDirty = (() => {
    const [a, b] = tokensToSlots(initialTokens);
    return slot1 !== a || slot2 !== b;
  })();

  function handleSave() {
    if (!isValid || !slot1 || !slot2) return;
    const a1 = agencies.find((x) => x.id === slot1);
    const a2 = agencies.find((x) => x.id === slot2);
    if (!a1 || !a2) return;

    const tokens: AgencyFormulaToken[] = [
      { type: "agency", agencyId: a1.id, agencyName: a1.name },
      { type: "operator", value: "+" },
      { type: "agency", agencyId: a2.id, agencyName: a2.name },
    ];
    onSave(tokens);
  }

  function renderSlot(
    label: string,
    value: string | null,
    setValue: (v: string) => void,
    excludeId: string | null,
  ) {
    return (
      <div className="space-y-1.5 w-[240px]">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Select value={value ?? undefined} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select agency" />
          </SelectTrigger>
          <SelectContent>
            {agencies
              .filter((a) => a.id !== excludeId)
              .map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <div className="flex items-center gap-2">
                    <span>{a.name}</span>
                    {a.location && (
                      <span className="text-xs text-muted-foreground">
                        · {a.location}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div>
          <h3 className="font-semibold text-base">Formula</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pick the two agencies whose orders combine into the row total.
          </p>
        </div>

        <div className="flex items-end gap-2 flex-wrap">
          {renderSlot("Agency 1", slot1, setSlot1, slot2)}
          <span className="pb-2.5 text-xl font-semibold text-muted-foreground px-1">
            +
          </span>
          {renderSlot("Agency 2", slot2, setSlot2, slot1)}
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!isValid || !isDirty || saving}
            className="gap-2 ml-auto"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>

        <p
          className={cn(
            "text-xs",
            isValid ? "text-muted-foreground" : "text-amber-600",
          )}
        >
          {!slot1 || !slot2
            ? "Choose two agencies."
            : slot1 === slot2
              ? "The two agencies must be different."
              : isDirty
                ? "Unsaved formula"
                : "Formula saved"}
        </p>
      </CardContent>
    </Card>
  );
}
