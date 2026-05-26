"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FeatureKey } from "@/lib/hooks/use-feature";

// Mirrors the seeded plan catalog in backend/src/plans/seeds/default-plans.ts.
// Lists the cheapest plan that includes each gated feature, so the upsell CTA
// can name the right tier instead of just saying "upgrade your plan".
const FEATURE_REQUIRED_PLAN: Record<FeatureKey, "standard" | "premium" | null> = {
  appNotifications: null, // included on every plan
  storeMobileApp: null,
  employees: "standard",
  pushNotifications: "standard",
  deliveries: "premium",
  gpsTracking: "premium",
  photoProofDelivery: "premium",
  bulkImport: "premium",
  advancedAnalytics: "premium",
  printTemplates: "premium",
};

const FEATURE_LABELS: Record<FeatureKey, string> = {
  employees: "Employee management",
  deliveries: "Deliveries",
  gpsTracking: "GPS tracking",
  photoProofDelivery: "Photo proof of delivery",
  bulkImport: "Bulk import",
  advancedAnalytics: "Advanced analytics",
  pushNotifications: "Push notifications",
  appNotifications: "In-app notifications",
  storeMobileApp: "Store mobile app",
  printTemplates: "Print templates",
};

interface FeatureLockedCardProps {
  feature: FeatureKey;
}

export function FeatureLockedCard({ feature }: FeatureLockedCardProps) {
  const label = FEATURE_LABELS[feature] ?? feature;
  const planRequired = FEATURE_REQUIRED_PLAN[feature];

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="glass max-w-md w-full rounded-2xl p-8 text-center space-y-5">
        <div className="mx-auto inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4">
          <Lock className="h-7 w-7 text-blue-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{label} is locked</h2>
          <p className="text-sm text-muted-foreground">
            {planRequired
              ? `Your current plan doesn't include ${label.toLowerCase()}. Upgrade to the ${capitalize(planRequired)} plan to unlock it.`
              : `Your current plan doesn't include ${label.toLowerCase()}. Upgrade to unlock it.`}
          </p>
        </div>
        {planRequired && (
          <Badge variant="secondary" className="mx-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            {capitalize(planRequired)} plan
          </Badge>
        )}
        <div className="pt-2">
          <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <Link href="/billing">View plans &amp; upgrade</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
