"use client";

import { Loader2 } from "lucide-react";
import { useFeature, type FeatureKey } from "@/lib/hooks/use-feature";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTenant } from "@/lib/hooks/use-tenants";
import { FeatureLockedCard } from "@/components/billing/feature-locked-card";

interface FeatureGuardProps {
  feature: FeatureKey;
  children: React.ReactNode;
}

/**
 * Wraps a route's children and renders an in-place "feature locked" upgrade
 * card when the tenant's plan doesn't include the feature. The sidebar
 * already hides items for missing features, so this guard primarily covers
 * deep-links and direct URL navigation.
 */
export function FeatureGuard({ feature, children }: FeatureGuardProps) {
  const enabled = useFeature(feature);
  const user = useAuthStore((s) => s.user);
  const { isLoading } = useTenant(user?.tenantId || "");

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enabled && user?.role !== "super_admin") {
    return <FeatureLockedCard feature={feature} />;
  }

  return <>{children}</>;
}
