"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TENANT_ROUTES } from "@/lib/constants";
import { useUnverifiedStorePins } from "@/lib/hooks/use-deliveries";

const TABS = [
  { href: TENANT_ROUTES.DELIVERIES, label: "Today", exact: true },
  { href: TENANT_ROUTES.DELIVERY_EXCEPTIONS, label: "Needs attention" },
  { href: TENANT_ROUTES.DELIVERY_STORE_PINS, label: "Store locations" },
  { href: TENANT_ROUTES.DELIVERY_SETTINGS, label: "Settings" },
];

/** Section tabs under Deliveries. Store locations carries the unverified-pin count. */
export function DeliveriesNav() {
  const pathname = usePathname();
  const { data: unverified } = useUnverifiedStorePins();
  const badge = unverified?.length ?? 0;
  return (
    <nav className="flex flex-wrap gap-1 glass-subtle rounded-xl p-1 w-fit">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            {t.label}
            {t.href === TENANT_ROUTES.DELIVERY_STORE_PINS && badge > 0 ? (
              <span className={cn("text-[11px] rounded-full px-1.5 py-0.5 leading-none font-semibold", active ? "bg-white/25" : "bg-amber-100 text-amber-800")}>
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
