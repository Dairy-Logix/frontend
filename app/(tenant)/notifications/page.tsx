"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Smartphone,
  Pencil,
  Check,
  ShoppingCart,
  Truck,
  FileText,
  CreditCard,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  User as UserIcon,
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

import { useSentNotifications } from "@/lib/hooks/use-notifications";
import { useSettings, useUpdateSettings } from "@/lib/hooks/use-settings";
import type {
  NotificationChannel,
  NotificationEventType,
  NotificationPreference,
  SentNotification,
  SentNotificationType,
} from "@/lib/types";
import { useTranslations } from "@/components/providers/intl-provider";

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
  invoice_transfer_in: {
    label: "Items Added (Transfer In)",
    description: "Sent to a shopkeeper when items are added to their invoice via a transfer",
    icon: ArrowDownToLine,
  },
  invoice_transfer_out: {
    label: "Items Removed (Transfer Out)",
    description: "Sent to a shopkeeper when items are removed from their invoice via a transfer",
    icon: ArrowUpFromLine,
  },
  wallet_credit: {
    label: "Wallet Credited",
    description: "Sent to a shopkeeper when their wallet receives a credit (e.g. transfer with no open invoice)",
    icon: Wallet,
  },
};

// --- Channel Metadata ---

interface ChannelMeta {
  label: string;
  description: string;
  icon: React.ElementType;
}

// Push is the only customer-facing channel — the mobile app shows push
// notifications directly. The legacy in_app channel is kept in the type for
// historical Notification records but is no longer surfaced in this UI.
const channelMeta: Partial<Record<NotificationChannel, ChannelMeta>> = {
  push: {
    label: "Push",
    description: "Send mobile push notifications via FCM",
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
  push: { label: "Push", variant: "warning" },
};

// --- Mock Notification Preferences ---

const initialPreferences: NotificationPreference[] = [
  {
    id: "pref-1",
    tenantId: "tenant-1",
    eventType: "order_placed",
    channels: ["push"],
    templateSubject: "New Order #{orderNumber}",
    templateBody: "A new order #{orderNumber} has been placed by {shopName} for {itemCount} items totaling INR {total}.",
    isActive: true,
  },
  {
    id: "pref-2",
    tenantId: "tenant-1",
    eventType: "order_confirmed",
    channels: ["push"],
    templateSubject: "Order #{orderNumber} Confirmed",
    templateBody: "Your order #{orderNumber} has been confirmed and is being prepared for dispatch.",
    isActive: true,
  },
  {
    id: "pref-3",
    tenantId: "tenant-1",
    eventType: "delivery_dispatched",
    channels: ["push"],
    templateSubject: "Delivery Dispatched - #{orderNumber}",
    templateBody: "Your order #{orderNumber} has been dispatched. Delivery person: {employeeName}. Expected delivery: {scheduledDate}.",
    isActive: true,
  },
  {
    id: "pref-4",
    tenantId: "tenant-1",
    eventType: "invoice_generated",
    channels: ["push"],
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
    channels: ["push"],
    templateSubject: "Payment Received - INR {amount}",
    templateBody: "Payment of INR {amount} received from {shopName}. Reference: {referenceNumber}. Collected by: {collectedBy}.",
    isActive: false,
  },
  {
    id: "pref-7",
    tenantId: "tenant-1",
    eventType: "invoice_transfer_in",
    channels: ["push"],
    templateSubject: "Items added to invoice",
    templateBody: "INR {amount} of additional items added to your invoice {invoiceNumber} (transfer {transferNumber}).",
    isActive: true,
  },
  {
    id: "pref-8",
    tenantId: "tenant-1",
    eventType: "invoice_transfer_out",
    channels: ["push"],
    templateSubject: "Invoice updated",
    templateBody: "INR {amount} reduced from your invoice {invoiceNumber} (transfer {transferNumber}).",
    isActive: true,
  },
  {
    id: "pref-9",
    tenantId: "tenant-1",
    eventType: "wallet_credit",
    channels: ["push"],
    templateSubject: "Wallet credited",
    templateBody: "INR {amount} added to your wallet (transfer {transferNumber}). New wallet balance: INR {walletBalanceAfter}.",
    isActive: true,
  },
];

// --- Backend → UI mapping for the History tab ---

interface DisplayNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  eventType?: NotificationEventType;
  read: boolean;
  createdAt: string;
  recipient?: string;
}

// Maps backend NotificationType (snake_case) → UI NotificationEventType used
// by the filter dropdown and badge metadata. Some backend values fall back to
// 'system' (no row in eventTypeMeta) and render with the generic Info icon.
const backendTypeToEventType: Partial<Record<SentNotificationType, NotificationEventType>> = {
  order_created: "order_placed",
  order_confirmed: "order_confirmed",
  order_delivered: "delivery_dispatched",
  delivery_scheduled: "delivery_dispatched",
  delivery_completed: "delivery_dispatched",
  payment_received: "payment_received",
  invoice_generated: "invoice_generated",
  invoice_overdue: "payment_reminder",
  invoice_transfer_in: "invoice_transfer_in",
  invoice_transfer_out: "invoice_transfer_out",
  wallet_credit: "wallet_credit",
};

function mapBackendType(type: SentNotificationType): {
  uiType: DisplayNotification["type"];
  eventType?: NotificationEventType;
} {
  let uiType: DisplayNotification["type"] = "info";
  switch (type) {
    case "order_confirmed":
    case "order_delivered":
    case "delivery_completed":
    case "payment_received":
    case "production_completed":
    case "wallet_credit":
    case "invoice_transfer_in":
      uiType = "success";
      break;
    case "invoice_overdue":
    case "stock_low":
      uiType = "warning";
      break;
    case "stock_out":
    case "quality_check_failed":
    case "invoice_transfer_out":
      uiType = "error";
      break;
    default:
      uiType = "info";
  }
  return { uiType, eventType: backendTypeToEventType[type] };
}

function getRecipientName(notif: SentNotification): string | undefined {
  if (notif.userName) return notif.userName;
  const u = notif.userId;
  if (u && typeof u === "object") {
    const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    return full || u.email;
  }
  return undefined;
}

function toDisplayNotification(n: SentNotification): DisplayNotification {
  const { uiType, eventType } = mapBackendType(n.type);
  return {
    id: n._id,
    type: uiType,
    title: n.title,
    message: n.message,
    eventType,
    read: n.isRead,
    createdAt: n.createdAt,
    recipient: getRecipientName(n),
  };
}

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
// Only push is exposed in the UI; in_app remains in the type for legacy
// Notification records but is no longer surfaced as a togglable channel.
const allChannels: NotificationChannel[] = ["push"];

// --- Main Page ---

export default function NotificationsPage() {
  const tPage = useTranslations("pages.tenantNotifications");
  // --- Templates Tab State ---
  const [preferences, setPreferences] = useState<NotificationPreference[]>(initialPreferences);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingPref, setEditingPref] = useState<NotificationPreference | null>(null);
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");

  // --- Channels Tab State ---
  // The Push channel is gated by the tenant's `pushNotifications` feature
  // flag in settings. The toggle below mutates that flag, which the backend's
  // NotificationsService checks before creating/dispatching push records.
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const updateSettings = useUpdateSettings();
  const pushEnabled = settings?.config?.features?.pushNotifications ?? false;

  // --- History Tab State ---
  const [historySearch, setHistorySearch] = useState("");
  const [readFilter, setReadFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  const {
    data: sentNotificationsPage,
    isLoading: isLoadingHistory,
    isError: isHistoryError,
    error: historyError,
  } = useSentNotifications({ page: 1, pageSize: 100 });

  const notifications = useMemo<DisplayNotification[]>(
    () => (sentNotificationsPage?.data ?? []).map(toDisplayNotification),
    [sentNotificationsPage]
  );

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

  // --- Channels: Toggle Push channel ---
  function togglePushChannel(next: boolean) {
    updateSettings.mutate(
      { features: { pushNotifications: next } },
      {
        onSuccess: () => {
          toast.success(`Push notifications ${next ? "enabled" : "disabled"}`);
        },
      }
    );
  }

  // --- History: Filtered notifications ---
  const filteredNotifications = useMemo(() => {
    const search = historySearch.trim().toLowerCase();
    return notifications.filter((n) => {
      const matchesSearch =
        search === "" ||
        n.title.toLowerCase().includes(search) ||
        n.message.toLowerCase().includes(search) ||
        (n.recipient ?? "").toLowerCase().includes(search);

      const matchesRead =
        readFilter === "all" ||
        (readFilter === "read" && n.read) ||
        (readFilter === "unread" && !n.read);

      const matchesEvent =
        eventFilter === "all" || n.eventType === eventFilter;

      return matchesSearch && matchesRead && matchesEvent;
    });
  }, [notifications, historySearch, readFilter, eventFilter]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // --- Render ---

  return (
    <div className="space-y-6">
      <PageHeader
        title={tPage("title")}
        description={tPage("description")}
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
                            const meta = channelMeta[ch];
                            if (!meta) return null;
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
                                {meta.label}
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
            {(() => {
              const meta = channelMeta.push;
              if (!meta) return null;
              const ChannelIcon = meta.icon;
              const isPending = updateSettings.isPending;
              const isLoading = isLoadingSettings;

              return (
                <motion.div
                  key="push"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
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
                          {isLoading
                            ? "Loading…"
                            : pushEnabled
                              ? "Active"
                              : "Inactive"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={pushEnabled}
                      disabled={isLoading || isPending}
                      onCheckedChange={togglePushChannel}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {meta.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : (
                      <div
                        className={`h-2 w-2 rounded-full ${
                          pushEnabled
                            ? "bg-[var(--success)]"
                            : "bg-muted-foreground/40"
                        }`}
                      />
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {isPending
                        ? "Saving…"
                        : pushEnabled
                          ? "Push notifications will be sent to mobile users"
                          : "Push channel is disabled — no notifications will be sent"}
                    </span>
                  </div>
                </motion.div>
              );
            })()}
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

                {/* Counts */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
                    {unreadCount > 0 && ` (${unreadCount} unread by recipients)`}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Notification List */}
            <div className="space-y-2">
              {isLoadingHistory ? (
                <div className="glass rounded-xl p-12 text-center">
                  <Loader2 className="h-8 w-8 mx-auto text-muted-foreground/70 mb-3 animate-spin" />
                  <p className="text-muted-foreground text-sm">
                    Loading notifications…
                  </p>
                </div>
              ) : isHistoryError ? (
                <div className="glass rounded-xl p-12 text-center">
                  <XCircle className="h-10 w-10 mx-auto text-[var(--destructive)] mb-3" />
                  <p className="text-muted-foreground text-sm font-medium">
                    Failed to load notifications
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {(historyError as Error)?.message ?? "Please try again later."}
                  </p>
                </div>
              ) : (
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
                        {notifications.length === 0
                          ? "No notifications sent yet"
                          : "No notifications match your filters"}
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {notifications.length === 0
                          ? "Push notifications sent to the mobile app will appear here."
                          : "Try adjusting your filters."}
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
                          className="glass rounded-xl p-4 transition-colors"
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
                                <h4 className="text-sm font-medium">
                                  {notif.title}
                                </h4>
                                <StatusBadge
                                  status={notif.type}
                                  colorMap={notificationTypeColorMap}
                                />
                                <StatusBadge status="push" colorMap={channelColorMap} />
                                {notif.read ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--success)] font-medium">
                                    <Check className="h-2.5 w-2.5" />
                                    Read
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium">
                                    Unread
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notif.message}
                              </p>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDateTime(notif.createdAt)}
                                </span>
                                {notif.recipient && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <UserIcon className="h-2.5 w-2.5" />
                                    {notif.recipient}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              )}
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
