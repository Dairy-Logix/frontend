"use client";

import { Eye, X } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useExitImpersonation } from "@/lib/hooks/use-impersonation";

/**
 * Always-visible bar shown while a super-admin is impersonating a tenant, so it
 * can never be confused with normal use. One click exits. Read-only is also
 * enforced server-side, regardless of what the UI shows.
 */
export function ImpersonationBanner() {
  const impersonation = useAuthStore((s) => s.impersonation);
  const exit = useExitImpersonation();

  if (!impersonation) return null;

  return (
    <div className="relative z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      <Eye className="h-4 w-4 shrink-0" />
      <span>
        Viewing <strong>{impersonation.tenant.name}</strong> as admin — read-only
      </span>
      <button
        onClick={exit}
        className="ml-2 inline-flex items-center gap-1 rounded-md bg-amber-950/10 px-2 py-0.5 text-xs font-semibold hover:bg-amber-950/20"
      >
        <X className="h-3 w-3" /> Exit
      </button>
    </div>
  );
}
