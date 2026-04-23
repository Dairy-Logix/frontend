"use client";

import { SuperAdminLayout } from "@/components/layout/super-admin-layout";
import { AuthGuard } from "@/components/providers/auth-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard mode="protected" allowedRoles={["super_admin"]}>
      <SuperAdminLayout>{children}</SuperAdminLayout>
    </AuthGuard>
  );
}
