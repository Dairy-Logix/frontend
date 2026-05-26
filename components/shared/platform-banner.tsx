"use client";

import { AlertTriangle, Megaphone } from "lucide-react";
import { usePlatformStatus } from "@/lib/hooks/use-platform";

/**
 * Global, app-wide banner driven by the super-admin Platform Configuration.
 * Renders a maintenance notice and/or an announcement when enabled; otherwise
 * nothing. Mounted once at the root so it covers public, tenant, and admin areas.
 */
export function PlatformBanner() {
  const { data } = usePlatformStatus();

  if (!data) return null;
  const showMaintenance = data.maintenanceMode;
  const showAnnouncement = !!data.announcement?.trim();
  if (!showMaintenance && !showAnnouncement) return null;

  return (
    <div className="relative z-50">
      {showMaintenance && (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Maintenance in progress — some features may be temporarily unavailable.</span>
        </div>
      )}
      {showAnnouncement && (
        <div className="flex items-center justify-center gap-2 bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
          <Megaphone className="h-4 w-4 shrink-0" />
          <span>{data.announcement}</span>
        </div>
      )}
    </div>
  );
}
