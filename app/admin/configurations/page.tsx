"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Save,
  Power,
  Megaphone,
  Plug,
  CheckCircle2,
  XCircle,
  Package,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  usePlatformSettings,
  useIntegrationsStatus,
  useUpdatePlatformSettings,
} from "@/lib/hooks/use-platform";

export default function ConfigurationsPage() {
  const { data: settings, isLoading } = usePlatformSettings();
  const { data: integrations } = useIntegrationsStatus();
  const updateSettings = useUpdatePlatformSettings();

  // Local editable copy of the server settings.
  const [allowNewSignups, setAllowNewSignups] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [announcementActive, setAnnouncementActive] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setAllowNewSignups(settings.allowNewSignups);
    setMaintenanceMode(settings.maintenanceMode);
    setAnnouncement(settings.announcement);
    setAnnouncementActive(settings.announcementActive);
  }, [settings]);

  const dirty =
    !!settings &&
    (allowNewSignups !== settings.allowNewSignups ||
      maintenanceMode !== settings.maintenanceMode ||
      announcement !== settings.announcement ||
      announcementActive !== settings.announcementActive);

  const handleSave = () => {
    updateSettings.mutate({
      allowNewSignups,
      maintenanceMode,
      announcement,
      announcementActive,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Configuration"
        description="Global operational switches and integration status. Pricing, features, and tenant limits live under Plans."
        action={
          <Button onClick={handleSave} disabled={!dirty || updateSettings.isPending}>
            {updateSettings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operational toggles */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Power className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Platform Switches</CardTitle>
                    <CardDescription>Global controls enforced across the platform</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-signups">Allow new signups</Label>
                    <p className="text-xs text-muted-foreground">
                      When off, the public trial-signup flow is blocked server-side.
                    </p>
                  </div>
                  <Switch id="allow-signups" checked={allowNewSignups} onCheckedChange={setAllowNewSignups} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance">Maintenance mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Surfaced to the app so it can show a maintenance notice.
                    </p>
                  </div>
                  <Switch id="maintenance" checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Announcement */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Megaphone className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Announcement Banner</CardTitle>
                    <CardDescription>Optional platform-wide message</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="announce-active">Show announcement</Label>
                  <Switch id="announce-active" checked={announcementActive} onCheckedChange={setAnnouncementActive} />
                </div>
                <Textarea
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. Scheduled maintenance on Sunday 2–4 AM IST."
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  disabled={!announcementActive}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Integration status (read-only) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Plug className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Integrations</CardTitle>
                    <CardDescription>Configured via environment secrets — read-only here</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {(integrations ?? []).map((it) => (
                  <div key={it.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{it.label}</p>
                      {it.detail && <p className="text-xs text-muted-foreground">{it.detail}</p>}
                    </div>
                    {it.configured ? (
                      <Badge className="gap-1 border-green-500/20 bg-green-500/15 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" /> Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <XCircle className="h-3 w-3" /> Not set
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pointer to Plans (where limits/features actually live) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Plans & Limits</CardTitle>
                    <CardDescription>Pricing, features, and per-tenant limits</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Feature flags and tenant limits are defined per subscription plan, not platform-wide.
                  Manage them in the plan catalog.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/plans">
                    Go to Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
