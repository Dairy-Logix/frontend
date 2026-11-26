"use client";

import { FeatureGuard } from "@/components/providers/feature-guard";

export default function MyStoreLayout({ children }: { children: React.ReactNode }) {
  return <FeatureGuard feature="myStore">{children}</FeatureGuard>;
}
