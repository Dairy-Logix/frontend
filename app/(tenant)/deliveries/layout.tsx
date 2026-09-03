"use client";

import { FeatureGuard } from "@/components/providers/feature-guard";
import { DeliveriesNav } from "@/components/deliveries/deliveries-nav";
import { useDeliveryRealtime } from "@/components/deliveries/use-delivery-realtime";

function DeliveriesShell({ children }: { children: React.ReactNode }) {
  useDeliveryRealtime();
  return (
    <div className="space-y-6">
      <DeliveriesNav />
      {children}
    </div>
  );
}

export default function DeliveriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGuard feature="deliveries">
      <DeliveriesShell>{children}</DeliveriesShell>
    </FeatureGuard>
  );
}
