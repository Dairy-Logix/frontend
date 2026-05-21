"use client";

import { FeatureGuard } from "@/components/providers/feature-guard";

export default function EmployeesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FeatureGuard feature="employees">{children}</FeatureGuard>;
}
