"use client";

import { Bell, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { AgencySwitcher } from "@/components/shared/agency-switcher";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { useFeature } from "@/lib/hooks/use-feature";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/components/providers/intl-provider";

export function Navbar() {
  const { toggleSidebar, toggleSidebarCollapsed, notifications } = useUIStore();
  const { user, logout, impersonation } = useAuthStore();
  const { context } = useTenantStore();
  const router = useRouter();
  const t = useTranslations("navbar");
  const tNav = useTranslations("nav");

  const appNotificationsEnabled = useFeature("appNotifications");
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    } else {
      toggleSidebarCollapsed();
    }
  };

  const { tenant } = useTenantStore();
  // While impersonating, always show the target tenant's name (the tenant-store
  // context can still read super_admin underneath the impersonation overlay).
  const panelLabel = impersonation
    ? impersonation.tenant.name
    : context === "super_admin"
      ? tNav("superAdmin")
      : (tenant?.name || tNav("dashboard"));

  return (
    <nav className="sticky top-0 z-50 glass border-b">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xl font-semibold">{panelLabel}</span>
          </div>
          {/* Agency Switcher - only for tenant context */}
          {context === "tenant" && (
            <div className="hidden md:block ml-2">
              <AgencySwitcher />
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />

          {/* Notifications — only shown when App Notifications feature is enabled */}
          {appNotificationsEnabled && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>{t("notifications")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {t("noNotifications")}
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem key={notification.id} className="p-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{notification.title}</span>
                          {!notification.read && (
                            <Badge variant="secondary" className="h-2 w-2 p-0" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {notification.message}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={user?.avatar} alt={user?.firstName} />
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(context === "super_admin" ? "/admin/settings" : "/settings")}>
                <User className="mr-2 h-4 w-4" />
                {t("profileSettings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
