"use client";

import { FeatureGuard } from "@/components/providers/feature-guard";

export default function DeliveriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FeatureGuard feature="deliveries">{children}</FeatureGuard>;
}
