"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  FileText,
  FolderOpen,
  Settings,
  Palette,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/lib/stores/ui-store";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard/overview",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    name: "Products",
    href: "/dashboard/products",
    icon: ShoppingBag,
  },
  {
    name: "Articles",
    href: "/dashboard/articles",
    icon: FileText,
  },
  {
    name: "Files",
    href: "/dashboard/files",
    icon: FolderOpen,
  },
  {
    name: "UI Showcase",
    href: "/dashboard/ui-showcase",
    icon: Palette,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUIStore();

  const sidebarWidth = sidebarCollapsed ? 80 : 280;

  return (
    <>
      {/* Mobile Overlay */}
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

      {/* Sidebar */}
      <TooltipProvider delayDuration={0}>
        <motion.aside
          initial={false}
          animate={{
            x: sidebarOpen ? 0 : -sidebarWidth,
            width: sidebarWidth,
            transition: {
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1], // Custom cubic-bezier for smooth easing
            },
          }}
          className={cn(
            "fixed left-0 top-0 z-40 h-screen border-r glass overflow-hidden",
            "md:relative md:translate-x-0"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo Section */}
            <div className="flex h-16 items-center justify-center px-4 border-b">
              <Link href="/dashboard/overview" className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <AnimatePresence mode="wait">
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{
                        opacity: 1,
                        width: "auto",
                        transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }
                      }}
                      exit={{
                        opacity: 0,
                        width: 0,
                        transition: { duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }
                      }}
                      className="font-bold text-lg whitespace-nowrap overflow-hidden"
                    >
                      Base Template
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>

            {/* Navigation */}
            <nav className={cn(
              "flex-1 overflow-y-auto",
              sidebarCollapsed ? "px-4 py-6" : "p-6"
            )}>
              <div className="space-y-3">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  const NavItem = (
                    <Link key={item.name} href={item.href}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex rounded-lg text-sm font-medium transition-colors overflow-hidden",
                          sidebarCollapsed ? "items-center justify-center w-11 h-11" : "items-center gap-3 px-3 py-3",
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
                              animate={{
                                opacity: 1,
                                width: "auto",
                                transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }
                              }}
                              exit={{
                                opacity: 0,
                                width: 0,
                                transition: { duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }
                              }}
                              className="whitespace-nowrap"
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </Link>
                  );

                  // Wrap with tooltip when collapsed
                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          {NavItem}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return NavItem;
                })}
              </div>
            </nav>

            {/* Footer Section */}
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                    transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    transition: { duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }
                  }}
                  className="p-4 border-t overflow-hidden"
                >
                  <div className="glass-subtle rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-secondary flex items-center justify-center flex-shrink-0">
                        <Home className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Production Ready
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Base Template v1.0
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed Footer Icon */}
            <AnimatePresence mode="wait">
              {sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                    transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1], delay: 0.1 }
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    transition: { duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }
                  }}
                  className="p-4 border-t flex justify-center overflow-hidden"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-10 w-10 rounded-full bg-gradient-secondary flex items-center justify-center cursor-pointer">
                        <Home className="h-5 w-5 text-white" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium">Production Ready</p>
                      <p className="text-xs text-muted-foreground">Base Template v1.0</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      </TooltipProvider>
    </>
  );
}
