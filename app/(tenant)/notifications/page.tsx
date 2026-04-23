"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellRing,
  Smartphone,
  Monitor,
  Pencil,
  Check,
  CheckCheck,
  ShoppingCart,
  Truck,
  FileText,
  CreditCard,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormModal } from "@/components/shared/form-modal";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  NotificationChannel,
  NotificationEventType,
  Notification,
  NotificationPreference,
} from "@/lib/types";

// --- Event Type Metadata ---

interface EventMeta {
  label: string;
  description: string;
  icon: React.ElementType;
}

const eventTypeMeta: Record<NotificationEventType, EventMeta> = {
  order_placed: {
    label: "Order Placed",
    description: "Triggered when a new order is placed by a shopkeeper",
    icon: ShoppingCart,
  },
  order_confirmed: {
    label: "Order Confirmed",
    description: "Triggered when an order is confirmed by the agency",
    icon: CheckCircle2,
  },
  delivery_dispatched: {
    label: "Delivery Dispatched",
    description: "Triggered when a delivery is dispatched for an order",
    icon: Truck,
  },
  invoice_generated: {
    label: "Invoice Generated",
    description: "Triggered when an invoice is generated for a delivery",
    icon: FileText,
  },
  payment_reminder: {
    label: "Payment Reminder",
    description: "Sent to shopkeepers with overdue payment balances",
    icon: Clock,
  },
  payment_received: {
    label: "Payment Received",
    description: "Triggered when a payment is collected from a shopkeeper",
    icon: CreditCard,
  },
};

// --- Channel Metadata ---

interface ChannelMeta {
  label: string;
  description: string;
  icon: React.ElementType;
}

const channelMeta: Record<NotificationChannel, ChannelMeta> = {
  in_app: {
    label: "In-App",
    description: "Show notifications within the application dashboard and bell icon",
    icon: Monitor,
  },
  push: {
    label: "Push",
    description: "Send browser and mobile push notifications to users",
    icon: Smartphone,
  },
};

// --- Notification Type Color Map ---

const notificationTypeColorMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  info: { label: "Info", variant: "info" },
  success: { label: "Success", variant: "success" },
  warning: { label: "Warning", variant: "warning" },
  error: { label: "Error", variant: "error" },
};

const channelColorMap: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" }
> = {
  in_app: { label: "In-App", variant: "info" },
  push: { label: "Push", variant: "warning" },
};

// --- Mock Notification Preferences ---

const initialPreferences: NotificationPreference[] = [
  {
    id: "pref-1",
    tenantId: "tenant-1",
    eventType: "order_placed",
    channels: ["in_app", "push"],
    templateSubject: "New Order #{orderNumber}",
    templateBody: "A new order #{orderNumber} has been placed by {shopName} for {itemCount} items totaling INR {total}.",
    isActive: true,
  },
  {
    id: "pref-2",
    tenantId: "tenant-1",
    eventType: "order_confirmed",
    channels: ["in_app"],
    templateSubject: "Order #{orderNumber} Confirmed",
    templateBody: "Your order #{orderNumber} has been confirmed and is being prepared for dispatch.",
    isActive: true,
  },
  {
    id: "pref-3",
    tenantId: "tenant-1",
    eventType: "delivery_dispatched",
    channels: ["in_app", "push"],
    templateSubject: "Delivery Dispatched - #{orderNumber}",
    templateBody: "Your order #{orderNumber} has been dispatched. Delivery person: {employeeName}. Expected delivery: {scheduledDate}.",
    isActive: true,
  },
  {
    id: "pref-4",
    tenantId: "tenant-1",
    eventType: "invoice_generated",
    channels: ["in_app"],
    templateSubject: "Invoice #{invoiceNumber} Generated",
    templateBody: "Invoice #{invoiceNumber} has been generated for INR {totalAmount}. Due date: {dueDate}.",
    isActive: true,
  },
  {
    id: "pref-5",
    tenantId: "tenant-1",
    eventType: "payment_reminder",
    channels: ["push"],
    templateSubject: "Payment Reminder - INR {dueAmount}",
    templateBody: "Dear {shopOwner}, you have an outstanding balance of INR {dueAmount}. Please clear your dues at the earliest.",
    isActive: true,
  },
  {
    id: "pref-6",
    tenantId: "tenant-1",
    eventType: "payment_received",
    channels: ["in_app"],
    templateSubject: "Payment Received - INR {amount}",
    templateBody: "Payment of INR {amount} received from {shopName}. Reference: {referenceNumber}. Collected by: {collectedBy}.",
    isActive: false,
  },
];

// --- Mock Channel State ---

interface ChannelState {
  enabled: boolean;
  apiKey?: string;
}

const initialChannelState: Record<NotificationChannel, ChannelState> = {
  in_app: { enabled: true },
  push: { enabled: true },
};

// --- Mock Notification History ---

const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    userId: "user-1",
    type: "info",
    title: "New Order #ORD-2024-0156",
    message: "Annapurna Dairy placed a new order for 12 items totaling INR 4,580.",
    channel: "in_app",
    eventType: "order_placed",
    read: false,
    createdAt: "2025-01-15T09:30:00Z",
  },
  {
    id: "notif-2",
    userId: "user-1",
    type: "success",
    title: "Order #ORD-2024-0155 Confirmed",
    message: "Order has been confirmed and is being prepared for dispatch.",
    channel: "in_app",
    eventType: "order_confirmed",
    read: false,
    createdAt: "2025-01-15T09:15:00Z",
  },
  {
    id: "notif-3",
    userId: "user-1",
    type: "info",
    title: "Delivery Dispatched",
    message: "Order #ORD-2024-0153 dispatched. Driver: Ramesh Kumar. ETA: 2 hours.",
    channel: "push",
    eventType: "delivery_dispatched",
    read: false,
    createdAt: "2025-01-15T08:45:00Z",
  },
  {
    id: "notif-4",
    userId: "user-1",
    type: "success",
    title: "Payment Received - INR 12,500",
    message: "Payment received from Krishna Milk Centre. Ref: PAY-2024-0089.",
    channel: "in_app",
    eventType: "payment_received",
    read: true,
    createdAt: "2025-01-15T08:30:00Z",
  },
  {
    id: "notif-6",
    userId: "user-1",
    type: "info",
    title: "Invoice #INV-2024-0234 Generated",
    message: "Invoice generated for Gupta Store. Amount: INR 3,200. Due: 25 Jan 2025.",
    channel: "in_app",
    eventType: "invoice_generated",
    read: true,
    createdAt: "2025-01-14T17:30:00Z",
  },
  {
    id: "notif-7",
    userId: "user-1",
    type: "info",
    title: "New Order #ORD-2024-0154",
    message: "Patel Milk Distributors placed a new order for 8 items totaling INR 6,320.",
    channel: "push",
    eventType: "order_placed",
    read: false,
    createdAt: "2025-01-14T16:45:00Z",
  },
  {
    id: "notif-8",
    userId: "user-1",
    type: "success",
    title: "Delivery Completed",
    message: "Order #ORD-2024-0150 delivered successfully. Photo proof attached.",
    channel: "in_app",
    eventType: "delivery_dispatched",
    read: true,
    createdAt: "2025-01-14T15:20:00Z",
  },
  {
    id: "notif-9",
    userId: "user-1",
    type: "error",
    title: "Delivery Failed",
    message: "Delivery of order #ORD-2024-0149 failed. Shop was closed. Rescheduled for tomorrow.",
    channel: "push",
    eventType: "delivery_dispatched",
    read: false,
    createdAt: "2025-01-14T14:00:00Z",
  },
  {
    id: "notif-10",
    userId: "user-1",
    type: "warning",
    title: "Payment Overdue - Mehta Dairy",
    message: "Outstanding balance of INR 15,400 is overdue by 7 days. Please follow up.",
    channel: "in_app",
    eventType: "payment_reminder",
    read: true,
    createdAt: "2025-01-14T10:00:00Z",
  },
  {
    id: "notif-12",
    userId: "user-1",
    type: "info",
    title: "Invoice #INV-2024-0233 Generated",
    message: "Invoice generated for Patel Milk Distributors. Amount: INR 6,320.",
    channel: "in_app",
    eventType: "invoice_generated",
    read: false,
    createdAt: "2025-01-13T18:00:00Z",
  },
  {
    id: "notif-14",
    userId: "user-1",
    type: "info",
    title: "New Order #ORD-2024-0151",
    message: "Fresh Milk Corner placed a new order for 5 items totaling INR 2,150.",
    channel: "in_app",
    eventType: "order_placed",
    read: true,
    createdAt: "2025-01-13T14:20:00Z",
  },
  {
    id: "notif-16",
    userId: "user-1",
    type: "info",
    title: "Delivery Dispatched",
    message: "3 deliveries dispatched from City Centre Agency. Driver: Amit Patel.",
    channel: "push",
    eventType: "delivery_dispatched",
    read: true,
    createdAt: "2025-01-13T08:15:00Z",
  },
  {
    id: "notif-17",
    userId: "user-1",
    type: "success",
    title: "Payment Received - INR 9,800",
    message: "Full payment received from Mehta Dairy. Account balance cleared.",
    channel: "in_app",
    eventType: "payment_received",
    read: true,
    createdAt: "2025-01-12T17:45:00Z",
  },
];

// --- Helpers ---

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }
  if (diffHours < 48) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getNotificationTypeIcon(type: string) {
  switch (type) {
    case "info":
      return Info;
    case "success":
      return CheckCircle2;
    case "warning":
      return AlertTriangle;
    case "error":
      return XCircle;
    default:
      return Info;
  }
}

// --- All Channels ---
const allChannels: NotificationChannel[] = ["in_app", "push"];

// --- Main Page ---

export default function NotificationsPage() {
  // --- Templates Tab State ---
  const [preferences, setPreferences] = useState<NotificationPreference[]>(initialPreferences);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingPref, setEditingPref] = useState<NotificationPreference | null>(null);
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");

  // --- Channels Tab State ---
  const [channels, setChannels] = useState<Record<NotificationChannel, ChannelState>>(initialChannelState);

  // --- History Tab State ---
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [historySearch, setHistorySearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  // --- Templates: Toggle channel for a preference ---
  function togglePrefChannel(prefId: string, channel: NotificationChannel) {
    setPreferences((prev) =>
      prev.map((p) => {
        if (p.id !== prefId) return p;
        const hasChannel = p.channels.includes(channel);
        return {
          ...p,
          channels: hasChannel
            ? p.channels.filter((c) => c !== channel)
            : [...p.channels, channel],
        };
      })
    );
    toast.success("Channel updated");
  }

  // --- Templates: Toggle active ---
  function togglePrefActive(prefId: string) {
    setPreferences((prev) =>
      prev.map((p) =>
        p.id === prefId ? { ...p, isActive: !p.isActive } : p
      )
    );
    toast.success("Template status updated");
  }

  // --- Templates: Edit template modal ---
  function openTemplateEditor(pref: NotificationPreference) {
    setEditingPref(pref);
    setTemplateSubject(pref.templateSubject ?? "");
    setTemplateBody(pref.templateBody ?? "");
    setTemplateModalOpen(true);
  }

  function handleTemplateSave() {
    if (!editingPref) return;
    setPreferences((prev) =>
      prev.map((p) =>
        p.id === editingPref.id
          ? { ...p, templateSubject: templateSubject, templateBody: templateBody }
          : p
      )
    );
    toast.success("Template saved successfully");
    setTemplateModalOpen(false);
  }

  // --- Channels: Toggle channel enabled ---
  function toggleChannelEnabled(channel: NotificationChannel) {
    setChannels((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], enabled: !prev[channel].enabled },
    }));
    toast.success(`${channelMeta[channel].label} ${channels[channel].enabled ? "disabled" : "enabled"}`);
  }

  // --- History: Filtered notifications ---
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        historySearch === "" ||
        n.title.toLowerCase().includes(historySearch.toLowerCase()) ||
        n.message.toLowerCase().includes(historySearch.toLowerCase());

      const matchesChannel =
        channelFilter === "all" || n.channel === channelFilter;

      const matchesRead =
        readFilter === "all" ||
        (readFilter === "read" && n.read) ||
        (readFilter === "unread" && !n.read);

      const matchesEvent =
        eventFilter === "all" || n.eventType === eventFilter;

      return matchesSearch && matchesChannel && matchesRead && matchesEvent;
    });
  }, [notifications, historySearch, channelFilter, readFilter, eventFilter]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // --- History: Mark as read ---
  function markAsRead(notifId: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Manage notification templates, channels, and history"
      />

      <Tabs defaultValue="templates">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="channels">
            <Smartphone className="h-4 w-4" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="history">
            <Bell className="h-4 w-4" />
            History
            {unreadCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===================== TEMPLATES TAB ===================== */}
        <TabsContent value="templates">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 mt-4"
          >
            {preferences.map((pref, index) => {
              const meta = eventTypeMeta[pref.eventType];
              const EventIcon = meta.icon;

              return (
                <motion.div
                  key={pref.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="glass rounded-xl overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                    {/* Event Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-2.5 shrink-0">
                        <EventIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{meta.label}</h3>
                          {!pref.isActive && (
                            <Badge variant="secondary" className="text-[10px]">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {meta.description}
                        </p>

                        {/* Channel Badges */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {allChannels.map((ch) => {
                            const isEnabled = pref.channels.includes(ch);
                            return (
                              <button
                                key={ch}
                                onClick={() => togglePrefChannel(pref.id, ch)}
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium border transition-all cursor-pointer ${
                                  isEnabled
                                    ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
                                    : "bg-muted text-muted-foreground border-border opacity-50 hover:opacity-75"
                                }`}
                              >
                                {isEnabled && <Check className="h-2.5 w-2.5" />}
                                {channelMeta[ch].label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTemplateEditor(pref)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Template
                      </Button>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground sr-only">
                          Active
                        </Label>
                        <Switch
                          checked={pref.isActive}
                          onCheckedChange={() => togglePrefActive(pref.id)}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </TabsContent>

        {/* ===================== CHANNELS TAB ===================== */}
        <TabsContent value="channels">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4"
          >
            {(Object.keys(channelMeta) as NotificationChannel[]).map(
              (channel, index) => {
                const meta = channelMeta[channel];
                const ChannelIcon = meta.icon;
                const state = channels[channel];

                return (
                  <motion.div
                    key={channel}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="glass rounded-xl p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-3">
                          <ChannelIcon className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{meta.label}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {state.enabled ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={state.enabled}
                        onCheckedChange={() => toggleChannelEnabled(channel)}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {meta.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          state.enabled ? "bg-[var(--success)]" : "bg-muted-foreground/40"
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {state.enabled
                          ? "Notifications will be delivered via this channel"
                          : "Channel is currently disabled"}
                      </span>
                    </div>
                  </motion.div>
                );
              }
            )}
          </motion.div>
        </TabsContent>

        {/* ===================== HISTORY TAB ===================== */}
        <TabsContent value="history">
          <div className="space-y-4 mt-4">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-subtle rounded-xl p-4"
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <SearchInput
                    value={historySearch}
                    onChange={setHistorySearch}
                    placeholder="Search notifications..."
                    className="flex-1"
                  />
                  <Select value={channelFilter} onValueChange={setChannelFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="All Channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      <SelectItem value="in_app">In-App</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={readFilter} onValueChange={setReadFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={eventFilter} onValueChange={setEventFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {(Object.keys(eventTypeMeta) as NotificationEventType[]).map(
                        (et) => (
                          <SelectItem key={et} value={et}>
                            {eventTypeMeta[et].label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
                    {unreadCount > 0 && ` (${unreadCount} unread)`}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark All as Read
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Notification List */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass rounded-xl p-12 text-center"
                  >
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground text-lg font-medium">
                      No notifications found
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Try adjusting your filters.
                    </p>
                  </motion.div>
                ) : (
                  filteredNotifications.map((notif, index) => {
                    const TypeIcon = getNotificationTypeIcon(notif.type);

                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className={`glass rounded-xl p-4 transition-colors ${
                          !notif.read ? "border-l-2 border-l-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Type Icon */}
                          <div
                            className={`rounded-lg p-2 shrink-0 ${
                              notif.type === "success"
                                ? "bg-[var(--success)]/10"
                                : notif.type === "warning"
                                  ? "bg-[var(--warning)]/10"
                                  : notif.type === "error"
                                    ? "bg-[var(--destructive)]/10"
                                    : "bg-[var(--info)]/10"
                            }`}
                          >
                            <TypeIcon
                              className={`h-4 w-4 ${
                                notif.type === "success"
                                  ? "text-[var(--success)]"
                                  : notif.type === "warning"
                                    ? "text-[var(--warning-dark)]"
                                    : notif.type === "error"
                                      ? "text-[var(--destructive)]"
                                      : "text-[var(--info)]"
                              }`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`text-sm ${
                                  !notif.read ? "font-semibold" : "font-medium"
                                }`}
                              >
                                {notif.title}
                              </h4>
                              <StatusBadge
                                status={notif.type}
                                colorMap={notificationTypeColorMap}
                              />
                              <StatusBadge
                                status={notif.channel}
                                colorMap={channelColorMap}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] text-muted-foreground">
                                {formatDateTime(notif.createdAt)}
                              </span>
                              {!notif.read && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-400 font-medium">
                                  <BellRing className="h-2.5 w-2.5" />
                                  New
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Mark as Read */}
                          {!notif.read && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => markAsRead(notif.id)}
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Template Modal */}
      <FormModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        title="Edit Notification Template"
        description={
          editingPref
            ? `Configure the template for "${eventTypeMeta[editingPref.eventType].label}" notifications`
            : undefined
        }
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="template-subject">Subject</Label>
            <Input
              id="template-subject"
              placeholder="Notification subject line"
              value={templateSubject}
              onChange={(e) => setTemplateSubject(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Use variables like {"{orderNumber}"}, {"{shopName}"}, {"{amount}"}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-body">Body</Label>
            <Textarea
              id="template-body"
              placeholder="Notification message body"
              value={templateBody}
              onChange={(e) => setTemplateBody(e.target.value)}
              rows={5}
            />
            <p className="text-[10px] text-muted-foreground">
              Available variables: {"{orderNumber}"}, {"{shopName}"}, {"{shopOwner}"}, {"{amount}"}, {"{total}"}, {"{itemCount}"}, {"{invoiceNumber}"}, {"{dueDate}"}, {"{dueAmount}"}, {"{employeeName}"}, {"{scheduledDate}"}, {"{referenceNumber}"}, {"{collectedBy}"}
            </p>
          </div>

          {editingPref && (
            <div className="glass-subtle rounded-lg p-3">
              <p className="text-xs font-medium mb-1">Preview</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Subject:</span>{" "}
                {templateSubject || "(empty)"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold">Body:</span>{" "}
                {templateBody || "(empty)"}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setTemplateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
              onClick={handleTemplateSave}
            >
              Save Template
            </Button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
