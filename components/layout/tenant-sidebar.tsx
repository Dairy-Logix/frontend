"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  Store,
  Users,
  ShoppingCart,
  FileText,
  CreditCard,
  Truck,
  Factory,
  BarChart3,
  Bell,
  Settings,
  Milk,
} from "lucide-react";
import { cn, getLogoUrl } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/lib/stores/ui-store";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantStore } from "@/lib/stores/tenant-store";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agencies", href: "/agencies", icon: Building2 },
  { name: "Products", href: "/products", icon: Package },
  { name: "Stores", href: "/shopkeepers", icon: Store },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Deliveries", href: "/deliveries", icon: Truck },
  { name: "Factory", href: "/factory/orders", icon: Factory },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

function BrandLogo({ logo, name, size = "sm" }: { logo?: string; name: string; size?: "sm" | "md" }) {
  const dim = size === "md" ? "h-10 w-10" : "h-8 w-8";
  const initial = name?.[0]?.toUpperCase() || "D";
  const logoUrl = getLogoUrl(logo);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={cn(dim, "rounded-lg object-cover flex-shrink-0")}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          (e.currentTarget.nextSibling as HTMLElement | null)?.removeAttribute("style");
        }}
      />
    );
  }

  return (
    <div className={cn(dim, "rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0")}>
      <span className={cn("text-white font-bold", size === "md" ? "text-base" : "text-sm")}>{initial}</span>
    </div>
  );
}

export function TenantSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUIStore();
  const { tenant } = useTenantStore();

  const businessName = tenant?.name || "Dairy Logix";
  const logo = tenant?.logo;

  const sidebarWidth = sidebarCollapsed ? 80 : 280;

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <TooltipProvider delayDuration={0}>
        <motion.aside
          initial={false}
          animate={{
            x: sidebarOpen ? 0 : -sidebarWidth,
            width: sidebarWidth,
            transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] },
          }}
          className={cn(
            "fixed left-0 top-0 z-40 h-screen border-r glass overflow-hidden",
            "md:relative md:translate-x-0"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header / Brand */}
            <div className="flex h-16 items-center justify-center px-4 border-b">
              <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
                <BrandLogo logo={logo} name={businessName} size="sm" />
                <AnimatePresence mode="wait">
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto", transition: { duration: 0.3 } }}
                      exit={{ opacity: 0, width: 0, transition: { duration: 0.2 } }}
                      className="font-bold text-lg whitespace-nowrap overflow-hidden"
                    >
                      {businessName}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>

            <nav className={cn("flex-1 overflow-y-auto", sidebarCollapsed ? "px-4 py-6" : "p-6")}>
              <div className="space-y-1.5">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  const NavItem = (
                    <Link key={item.name} href={item.href}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex rounded-lg text-sm font-medium transition-colors overflow-hidden",
                          sidebarCollapsed ? "items-center justify-center w-11 h-11" : "items-center gap-3 px-3 py-2.5",
                          isActive
                            ? "bg-gradient-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <AnimatePresence mode="wait">
                          {!sidebarCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto", transition: { duration: 0.3 } }}
                              exit={{ opacity: 0, width: 0, transition: { duration: 0.2 } }}
                              className="whitespace-nowrap"
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </Link>
                  );

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                        <TooltipContent side="right"><p>{item.name}</p></TooltipContent>
                      </Tooltip>
                    );
                  }
                  return NavItem;
                })}
              </div>
            </nav>

            {/* Bottom tenant card */}
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto", transition: { duration: 0.3 } }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                  className="p-4 border-t overflow-hidden"
                >
                  <div className="glass-subtle rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <BrandLogo logo={logo} name={businessName} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{businessName}</p>
                        <p className="text-xs text-muted-foreground truncate">Tenant Admin Panel</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      </TooltipProvider>
    </>
  );
}
