"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFeature, type FeatureKey } from "@/lib/hooks/use-feature";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTenant } from "@/lib/hooks/use-tenants";
import { toast } from "sonner";

interface FeatureGuardProps {
  feature: FeatureKey;
  children: React.ReactNode;
  redirectTo?: string;
}

export function FeatureGuard({
  feature,
  children,
  redirectTo = "/dashboard",
}: FeatureGuardProps) {
  const router = useRouter();
  const enabled = useFeature(feature);
  const user = useAuthStore((s) => s.user);
  const { isLoading } = useTenant(user?.tenantId || "");

  useEffect(() => {
    if (isLoading) return;
    if (user?.role === "super_admin") return;
    if (!enabled) {
      toast.error("This feature is not available on your subscription plan.");
      router.replace(redirectTo);
    }
  }, [isLoading, enabled, user?.role, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enabled && user?.role !== "super_admin") {
    return null;
  }

  return <>{children}</>;
}
