"use client";

import { TenantLayout } from "@/components/layout/tenant-layout";
import { AuthGuard } from "@/components/providers/auth-guard";
import { RealtimeNotifications } from "@/components/providers/realtime-notifications";
import { AnimatedBg } from "@/components/shared/animated-bg";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard mode="protected" allowedRoles={["tenant_admin", "employee", "shopkeeper"]}>
      <AnimatedBg />
      <RealtimeNotifications />
      <TenantLayout>{children}</TenantLayout>
    </AuthGuard>
  );
}
