"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  Bell,
  BarChart3,
  Cog,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/lib/stores/ui-store";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "@/components/providers/intl-provider";

const navigation = [
  { key: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { key: "tenants", href: "/admin/tenants", icon: Building2 },
  { key: "users", href: "/admin/users", icon: Users },
  { key: "configurations", href: "/admin/configurations", icon: Cog },
  { key: "notifications", href: "/admin/notifications", icon: Bell },
  { key: "reports", href: "/admin/reports", icon: BarChart3 },
  { key: "settings", href: "/admin/settings", icon: Settings },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUIStore();
  const tNav = useTranslations("nav");

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
            <div className="flex h-16 items-center justify-center px-4 border-b">
              <Link href="/admin/dashboard" className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <AnimatePresence mode="wait">
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto", transition: { duration: 0.3 } }}
                      exit={{ opacity: 0, width: 0, transition: { duration: 0.2 } }}
                      className="font-bold text-lg whitespace-nowrap overflow-hidden"
                    >
                      {tNav("superAdmin")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>

            <nav className={cn("flex-1 overflow-y-auto", sidebarCollapsed ? "px-4 py-6" : "p-6")}>
              <div className="space-y-3">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  const label = tNav(item.key);

                  const NavItem = (
                    <Link key={item.key} href={item.href}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex rounded-lg text-sm font-medium transition-colors overflow-hidden",
                          sidebarCollapsed ? "items-center justify-center w-11 h-11" : "items-center gap-3 px-3 py-3",
                          isActive
                            ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md"
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
                              {label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </Link>
                  );

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.key}>
                        <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                        <TooltipContent side="right"><p>{label}</p></TooltipContent>
                      </Tooltip>
                    );
                  }
                  return NavItem;
                })}
              </div>
            </nav>

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
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">BeatMitra</p>
                        <p className="text-xs text-muted-foreground truncate">{tNav("platformAdmin")}</p>
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
