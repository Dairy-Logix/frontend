"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { UserRole } from "@/lib/types";

interface AuthGuardProps {
  mode: "auth" | "protected";
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

function getDashboardPath(role: UserRole): string {
  return role === "super_admin" ? "/admin/dashboard" : "/dashboard";
}

export function AuthGuard({ mode, allowedRoles, children }: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (mode === "auth") {
      if (isAuthenticated && user) {
        router.replace(getDashboardPath(user.role));
      }
    } else {
      // mode === "protected"
      if (!isAuthenticated || !user) {
        router.replace("/auth/login");
        return;
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace(getDashboardPath(user.role));
      }
    }
  }, [isLoading, isAuthenticated, user, mode, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mode === "auth") {
    if (isAuthenticated && user) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return <>{children}</>;
  }

  // mode === "protected"
  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
