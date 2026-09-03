"use client";

import Link from "next/link";
import { Truck } from "lucide-react";
import { FeatureGuard } from "@/components/providers/feature-guard";
import { DeliveriesNav } from "@/components/deliveries/deliveries-nav";
import { useDeliveryRealtime } from "@/components/deliveries/use-delivery-realtime";
import { useDeliveryModuleEnabled } from "@/lib/hooks/use-feature";
import { Button } from "@/components/ui/button";

function DeliveriesShell({ children }: { children: React.ReactNode }) {
  useDeliveryRealtime();
  const { switchedOn, isLoading } = useDeliveryModuleEnabled();
  if (!isLoading && !switchedOn) {
    return (
      <div className="glass rounded-xl p-10 text-center space-y-3 max-w-xl mx-auto">
        <Truck className="h-8 w-8 mx-auto text-muted-foreground" />
        <h2 className="text-lg font-semibold">Delivery management is switched off</h2>
        <p className="text-sm text-muted-foreground">Your plan includes it. Turn it on under Settings → Optional modules to see trips, drivers and store locations here.</p>
        <Button asChild variant="outline" size="sm"><Link href="/settings">Open Settings</Link></Button>
      </div>
    );
  }
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
