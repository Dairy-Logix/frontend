"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Save, Bell, Globe, CreditCard, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "@/components/providers/intl-provider";

const STORAGE_KEY = "beatmitra-platform-config";

const defaultConfig = {
  pushEnabled: true,
  pushProvider: "firebase",
  defaultLanguage: "en",
  defaultFeatures: {
    gpsTracking: true,
    pushNotifications: true,
    inAppNotifications: true,
  },
  paymentModes: {
    online: true,
    offline: true,
  },
  newTenantDefaults: {
    maxAgencies: 3,
    maxEmployees: 25,
    maxShopkeepers: 200,
  },
};

function loadConfig() {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
  } catch {
    return defaultConfig;
  }
}

export default function ConfigurationsPage() {
  const tPage = useTranslations("pages.adminConfigurations");
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState(defaultConfig);

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setTimeout(() => {
        setIsSaving(false);
        toast.success("Configuration saved to local storage");
      }, 400);
    } catch {
      setIsSaving(false);
      toast.error("Failed to save configuration");
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
          Configuration changes are saved locally in demo mode. Backend persistence will be available in a future update.
        </AlertDescription>
      </Alert>

      <PageHeader
        title="Configurations"
        description="Platform-wide settings and configurations"
        action={
          <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-red-500 to-orange-500">
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Push Notification Configuration */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Push Notifications</CardTitle>
                  <CardDescription>Configure push notification service</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-toggle">Enable Push Notifications</Label>
                <Switch
                  id="push-toggle"
                  checked={config.pushEnabled}
                  onCheckedChange={(v) => setConfig({ ...config, pushEnabled: v })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="push-provider">Provider</Label>
                <Select
                  value={config.pushProvider}
                  onValueChange={(v) => setConfig({ ...config, pushProvider: v })}
                  disabled={!config.pushEnabled}
                >
                  <SelectTrigger id="push-provider" className="glass-subtle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="firebase">Firebase Cloud Messaging</SelectItem>
                    <SelectItem value="onesignal">OneSignal</SelectItem>
                    <SelectItem value="pusher">Pusher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform Defaults */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Platform Defaults</CardTitle>
                  <CardDescription>Default settings for new tenants</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-lang">Default Language</Label>
                <Select
                  value={config.defaultLanguage}
                  onValueChange={(v) => setConfig({ ...config, defaultLanguage: v })}
                >
                  <SelectTrigger id="default-lang" className="glass-subtle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="gu">Gujarati</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Default Feature Flags</Label>
                <div className="space-y-2">
                  {Object.entries(config.defaultFeatures).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={`feature-${key}`} className="text-sm font-normal">
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                      </Label>
                      <Switch
                        id={`feature-${key}`}
                        checked={value}
                        onCheckedChange={(v) =>
                          setConfig({
                            ...config,
                            defaultFeatures: { ...config.defaultFeatures, [key]: v },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment & Limits */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Payment & Limits</CardTitle>
                  <CardDescription>Payment modes and tenant limits</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Payment Modes</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payment-online" className="text-sm font-normal">Online Payments</Label>
                    <Switch
                      id="payment-online"
                      checked={config.paymentModes.online}
                      onCheckedChange={(v) =>
                        setConfig({ ...config, paymentModes: { ...config.paymentModes, online: v } })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payment-offline" className="text-sm font-normal">Offline/Cash Payments</Label>
                    <Switch
                      id="payment-offline"
                      checked={config.paymentModes.offline}
                      onCheckedChange={(v) =>
                        setConfig({ ...config, paymentModes: { ...config.paymentModes, offline: v } })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <Label>New Tenant Default Limits</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="limit-agencies" className="text-xs text-muted-foreground">Agencies</Label>
                    <Input
                      id="limit-agencies"
                      type="number"
                      value={config.newTenantDefaults.maxAgencies}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          newTenantDefaults: { ...config.newTenantDefaults, maxAgencies: parseInt(e.target.value) || 0 },
                        })
                      }
                      className="glass-subtle"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="limit-employees" className="text-xs text-muted-foreground">Employees</Label>
                    <Input
                      id="limit-employees"
                      type="number"
                      value={config.newTenantDefaults.maxEmployees}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          newTenantDefaults: { ...config.newTenantDefaults, maxEmployees: parseInt(e.target.value) || 0 },
                        })
                      }
                      className="glass-subtle"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="limit-shops" className="text-xs text-muted-foreground">Stores</Label>
                    <Input
                      id="limit-shops"
                      type="number"
                      value={config.newTenantDefaults.maxShopkeepers}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          newTenantDefaults: { ...config.newTenantDefaults, maxShopkeepers: parseInt(e.target.value) || 0 },
                        })
                      }
                      className="glass-subtle"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
