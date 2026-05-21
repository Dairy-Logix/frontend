"use client";

import { useEffect, type ReactNode } from "react";
import { useTenantStore } from "@/lib/stores/tenant-store";

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const setLoading = useTenantStore((s) => s.setLoading);

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  return <>{children}</>;
}
