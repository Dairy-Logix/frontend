"use client";

import { FeatureGuard } from "@/components/providers/feature-guard";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FeatureGuard feature="appNotifications">{children}</FeatureGuard>;
}
