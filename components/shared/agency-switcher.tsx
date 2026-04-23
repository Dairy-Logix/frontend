"use client";

import { Building2, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgencyStore } from "@/lib/stores/agency-store";

export function AgencySwitcher() {
  const { agencies, selectedAgencyId, setSelectedAgencyId } = useAgencyStore();

  if (agencies.length <= 1) return null;

  const selected = agencies.find((a) => a.id === selectedAgencyId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {selected ? selected.name : "All Agencies"}
          </span>
          <ChevronsUpDown className="h-3 w-3 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Switch Agency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setSelectedAgencyId(null)}
          className={!selectedAgencyId ? "bg-accent" : ""}
        >
          All Agencies
        </DropdownMenuItem>
        {agencies.map((agency) => (
          <DropdownMenuItem
            key={agency.id}
            onClick={() => setSelectedAgencyId(agency.id)}
            className={selectedAgencyId === agency.id ? "bg-accent" : ""}
          >
            {agency.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
