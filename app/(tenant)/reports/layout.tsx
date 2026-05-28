"use client";

import { FeatureGuard } from "@/components/providers/feature-guard";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FeatureGuard feature="advancedAnalytics">{children}</FeatureGuard>;
}
