"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  children,
  className,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-xl p-6 flex flex-col gap-4",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold leading-none tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="w-full min-h-0">{children}</div>
    </div>
  );
}
