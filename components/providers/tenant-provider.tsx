"use client";

import { useEffect, type ReactNode } from "react";
import { useTenantStore } from "@/lib/stores/tenant-store";

interface TenantProviderProps {
  children: ReactNode;
  context?: "super_admin" | "tenant" | "marketing";
  slug?: string | null;
}

export function TenantProvider({ children, context, slug }: TenantProviderProps) {
  const { setContext, setSlug, setLoading } = useTenantStore();

  useEffect(() => {
    if (context) {
      setContext(context);
    }
    if (slug !== undefined) {
      setSlug(slug ?? null);
    }
    setLoading(false);
  }, [context, slug, setContext, setSlug, setLoading]);

  return <>{children}</>;
}
