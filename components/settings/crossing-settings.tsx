"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FeatureLockedCard } from "@/components/billing/feature-locked-card";
import { useAgencies, useProducts, useSettings, useUpdateSettings } from "@/lib/hooks";
import { useFeature } from "@/lib/hooks/use-feature";
import type { CrossingGroup, CrossingTruck } from "@/lib/types";

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function newTruck(name: string): CrossingTruck {
  return { id: makeId(), name, factoryName: "", agencyIds: [], productIds: [] };
}

function newGroup(index: number): CrossingGroup {
  return {
    id: makeId(),
    name: `Crossing group ${index}`,
    agencyIds: [],
    trucks: [newTruck("Truck A"), newTruck("Truck B")],
  };
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export function CrossingSettings() {
  const enabled = useFeature("crossingSheet");
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: agenciesData } = useAgencies({ page: 1, pageSize: 50 });
  const { data: productsData } = useProducts({ page: 1, pageSize: 1000 });

  const agencies = useMemo(
    () => (agenciesData?.data ?? []).filter((a) => a.isActive),
    [agenciesData],
  );
  const products = useMemo(
    () => (productsData?.data ?? []).filter((p) => p.isActive),
    [productsData],
  );

  const saved = settings?.config?.crossingGroups;
  // `draft` holds unsaved edits; null means "show what is saved".
  const [draft, setDraft] = useState<CrossingGroup[] | null>(null);
  const groups = draft ?? saved ?? [];
  const dirty = draft !== null;
  const [productSearch, setProductSearch] = useState<Record<string, string>>({});

  if (!enabled) return <FeatureLockedCard feature="crossingSheet" />;

  function change(next: CrossingGroup[]) {
    setDraft(next);
  }
  const updateGroup = (gid: string, patch: Partial<CrossingGroup>) =>
    change(groups.map((g) => (g.id === gid ? { ...g, ...patch } : g)));
  const updateTruck = (gid: string, tid: string, patch: Partial<CrossingTruck>) =>
    change(
      groups.map((g) =>
        g.id === gid
          ? { ...g, trucks: g.trucks.map((t) => (t.id === tid ? { ...t, ...patch } : t)) }
          : g,
      ),
    );

  /** Toggle an agency in a group; dropping it also removes it from the group's trucks. */
  function toggleGroupAgency(group: CrossingGroup, agencyId: string) {
    const removing = group.agencyIds.includes(agencyId);
    updateGroup(group.id, {
      agencyIds: toggle(group.agencyIds, agencyId),
      trucks: removing
        ? group.trucks.map((t) => ({ ...t, agencyIds: t.agencyIds.filter((a) => a !== agencyId) }))
        : group.trucks,
    });
  }

  function save() {
    updateSettings.mutate(
      { crossingGroups: groups },
      { onSuccess: () => setDraft(null) },
    );
  }

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  const agencyName = (id: string) => agencies.find((a) => a.id === id)?.name ?? "Unknown agency";

  return (
    <div className="glass rounded-xl p-6 mt-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Truck crossing</h3>
          <p className="text-xs text-muted-foreground mt-1">
            When your trucks load from different factories, each truck carries goods that
            the other trucks&apos; agencies ordered. Set up a group of agencies that cross
            with each other, name each truck, say which agencies it delivers to and which
            products it loads. The orders page then prints a &quot;Crossing sheet&quot; showing
            what each truck hands over. The same product can come from a different truck
            in another group.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => change([...groups, newGroup(groups.length + 1)])}
        >
          <Plus className="h-4 w-4" />
          Add group
        </Button>
      </div>

      {groups.length === 0 && (
        <div className="glass-subtle rounded-lg p-8 text-center">
          <Truck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No crossing groups yet. Add one to get started.
          </p>
        </div>
      )}

      {groups.map((group) => {
        // Agencies already claimed by a different group can't be picked here.
        const takenElsewhere = new Set(
          groups.filter((g) => g.id !== group.id).flatMap((g) => g.agencyIds),
        );
        const loadedBy = new Map<string, string>();
        group.trucks.forEach((t) => t.productIds.forEach((p) => loadedBy.set(p, t.id)));

        return (
          <div key={group.id} className="glass-subtle rounded-lg p-4 space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Group name
                </Label>
                <Input
                  className="h-8"
                  value={group.name}
                  maxLength={60}
                  onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => change(groups.filter((g) => g.id !== group.id))}
              >
                <Trash2 className="h-4 w-4" />
                Remove group
              </Button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Agencies that cross together
              </Label>
              <div className="flex flex-wrap gap-2">
                {agencies.map((a) => {
                  const disabled = takenElsewhere.has(a.id);
                  return (
                    <label
                      key={a.id}
                      className={`flex items-center gap-2 glass rounded-md px-2 py-1 text-xs ${
                        disabled ? "opacity-40" : "cursor-pointer"
                      }`}
                      title={disabled ? "Already in another crossing group" : undefined}
                    >
                      <Checkbox
                        checked={group.agencyIds.includes(a.id)}
                        disabled={disabled}
                        onCheckedChange={() => toggleGroupAgency(group, a.id)}
                      />
                      {a.name}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {group.trucks.map((truck) => {
                const search = (productSearch[truck.id] ?? "").toLowerCase();
                const takenAgencies = new Set(
                  group.trucks.filter((t) => t.id !== truck.id).flatMap((t) => t.agencyIds),
                );
                return (
                  <div key={truck.id} className="glass rounded-lg p-3 space-y-3">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          Truck name
                        </Label>
                        <Input
                          className="h-8"
                          value={truck.name}
                          maxLength={40}
                          onChange={(e) => updateTruck(group.id, truck.id, { name: e.target.value })}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          Factory (label)
                        </Label>
                        <Input
                          className="h-8"
                          value={truck.factoryName}
                          maxLength={60}
                          placeholder="e.g. Factory A"
                          onChange={(e) =>
                            updateTruck(group.id, truck.id, { factoryName: e.target.value })
                          }
                        />
                      </div>
                      {group.trucks.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          aria-label={`Remove ${truck.name}`}
                          onClick={() =>
                            updateGroup(group.id, {
                              trucks: group.trucks.filter((t) => t.id !== truck.id),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Delivers to
                      </Label>
                      {group.agencyIds.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Pick the group&apos;s agencies first.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {group.agencyIds.map((id) => {
                            const disabled = takenAgencies.has(id);
                            return (
                              <label
                                key={id}
                                className={`flex items-center gap-2 text-xs ${
                                  disabled ? "opacity-40" : "cursor-pointer"
                                }`}
                                title={disabled ? "Delivered by another truck" : undefined}
                              >
                                <Checkbox
                                  checked={truck.agencyIds.includes(id)}
                                  disabled={disabled}
                                  onCheckedChange={() =>
                                    updateTruck(group.id, truck.id, {
                                      agencyIds: toggle(truck.agencyIds, id),
                                    })
                                  }
                                />
                                {agencyName(id)}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          Products loaded here ({truck.productIds.length})
                        </Label>
                        <Input
                          className="h-7 w-36 text-xs"
                          placeholder="Search…"
                          value={productSearch[truck.id] ?? ""}
                          onChange={(e) =>
                            setProductSearch((s) => ({ ...s, [truck.id]: e.target.value }))
                          }
                        />
                      </div>
                      <div className="glass rounded-md p-2 max-h-[220px] overflow-y-auto space-y-0.5">
                        {products
                          .filter((p) => !search || p.name.toLowerCase().includes(search))
                          .map((p) => {
                            const owner = loadedBy.get(p.id);
                            const elsewhere = owner !== undefined && owner !== truck.id;
                            const ownerName = group.trucks.find((t) => t.id === owner)?.name;
                            return (
                              <label
                                key={p.id}
                                className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                                  elsewhere ? "opacity-40" : "cursor-pointer hover:bg-white/5"
                                }`}
                              >
                                <Checkbox
                                  checked={truck.productIds.includes(p.id)}
                                  disabled={elsewhere}
                                  onCheckedChange={() =>
                                    updateTruck(group.id, truck.id, {
                                      productIds: toggle(truck.productIds, p.id),
                                    })
                                  }
                                />
                                <span className="flex-1 truncate">{p.name}</span>
                                {elsewhere && (
                                  <span className="text-[10px] text-muted-foreground">
                                    on {ownerName}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {group.trucks.length < 8 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateGroup(group.id, {
                    trucks: [
                      ...group.trucks,
                      newTruck(`Truck ${String.fromCharCode(65 + group.trucks.length)}`),
                    ],
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Add truck
              </Button>
            )}
          </div>
        );
      })}

      <div className="flex justify-end gap-2">
        {dirty && (
          <Button variant="ghost" onClick={() => setDraft(null)}>
            Discard changes
          </Button>
        )}
        <Button onClick={save} disabled={!dirty || updateSettings.isPending}>
          {updateSettings.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save crossing setup
        </Button>
      </div>
    </div>
  );
}
