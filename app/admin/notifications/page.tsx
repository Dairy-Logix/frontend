"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Bell, Send, Settings, Clock, MessageSquare, Info, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSuperAdminDashboard } from "@/lib/hooks";
import { useTranslations } from "@/components/providers/intl-provider";

const notificationEvents = [
  { key: "new_order", label: "New Order Placed", channels: { push: true } },
  { key: "order_confirmed", label: "Order Confirmed", channels: { push: true } },
  { key: "delivery_dispatched", label: "Delivery Dispatched", channels: { push: true } },
  { key: "invoice_generated", label: "Invoice Generated", channels: { push: true } },
  { key: "payment_reminder", label: "Payment Reminder", channels: { push: true } },
  { key: "payment_received", label: "Payment Received", channels: { push: true } },
  { key: "invoice_transfer_in", label: "Items Added (Transfer In)", channels: { push: true } },
  { key: "invoice_transfer_out", label: "Items Removed (Transfer Out)", channels: { push: true } },
  { key: "wallet_credit", label: "Wallet Credited", channels: { push: true } },
];

const typeColorMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  tenant_signup: { label: "Signup", variant: "info" },
  order_placed: { label: "Order", variant: "success" },
  payment_collected: { label: "Payment", variant: "success" },
  delivery_completed: { label: "Delivery", variant: "info" },
  plan_upgrade: { label: "Upgrade", variant: "warning" },
  tenant_suspended: { label: "Suspended", variant: "error" },
  employee_added: { label: "Employee", variant: "default" },
  invoice_generated: { label: "Invoice", variant: "default" },
};

export default function NotificationsPage() {
  const tPage = useTranslations("pages.adminNotifications");
  const { data: dashboardData, isLoading: isLoadingActivity } = useSuperAdminDashboard();
  const recentActivity = dashboardData?.recentActivity || [];
  const [events, setEvents] = useState(notificationEvents);

  const toggleChannel = (eventKey: string, channel: "push") => {
    setEvents((prev) =>
      prev.map((e) =>
        e.key === eventKey
          ? { ...e, channels: { ...e.channels, [channel]: !e.channels[channel] } }
          : e
      )
    );
  };

  const handleSave = () => {
    toast.success("Notification settings saved");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Management"
        description="Configure notification templates, channels, and view history"
        action={
          <Button onClick={handleSave} className="bg-gradient-to-r from-red-500 to-orange-500">
            <Settings className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        }
      />

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="channels">Channel Settings</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Send History</TabsTrigger>
        </TabsList>

        {/* Channel Settings Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
              Channel settings are stored locally. Backend persistence for notification preferences will be available in a future update.
            </AlertDescription>
          </Alert>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Event Notification Channels</CardTitle>
              <CardDescription>Configure which channels are used for each notification event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-2 gap-4 pb-3 border-b text-sm text-muted-foreground font-medium">
                  <span>Event</span>
                  <span className="text-center">Push</span>
                </div>
                {/* Rows */}
                {events.map((event) => (
                  <motion.div
                    key={event.key}
                    whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
                    className="grid grid-cols-2 gap-4 py-3 border-b last:border-0 items-center rounded"
                  >
                    <span className="text-sm font-medium">{event.label}</span>
                    <div className="flex justify-center">
                      <Switch
                        checked={event.channels.push}
                        onCheckedChange={() => toggleChannel(event.key, "push")}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Notification Templates</CardTitle>
              <CardDescription>Customize message templates for each event type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select defaultValue="new_order">
                    <SelectTrigger className="glass-subtle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationEvents.map((e) => (
                        <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    defaultValue="New Order #{orderId} from {shopName}"
                    className="glass-subtle"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message Body</Label>
                  <Textarea
                    rows={4}
                    defaultValue="A new order has been placed by {shopName} for {itemCount} items totaling INR {totalAmount}. Please review and confirm the order."
                    className="glass-subtle"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {"{shopName}"}, {"{orderId}"}, {"{itemCount}"}, {"{totalAmount}"}, {"{date}"}
                  </p>
                </div>
                <Button className="bg-gradient-to-r from-red-500 to-orange-500">
                  Save Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Sent Notifications Log</CardTitle>
              <CardDescription>Recent platform notifications sent to tenants</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No recent activity to display.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50"
                    >
                      <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                        {item.type.includes("message") ? (
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        ) : item.type.includes("notification") ? (
                          <Bell className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Send className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.tenantName || "Platform"}</span>
                          <StatusBadge status={item.type} colorMap={typeColorMap} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.message || item.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {new Date(item.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
