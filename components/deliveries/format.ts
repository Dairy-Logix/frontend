import type { DeliveryStopStatus, DeliveryTripRow } from "@/lib/types";

export const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
export const timeOf = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
export const dateOf = (ymd: string) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
export const distance = (m?: number) => (m == null ? "" : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);
export const todayYmd = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
export const agoLabel = (iso?: string) => {
  if (!iso) return "no location yet";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
};

export const stopStatusMap: Record<DeliveryStopStatus, { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  pending: { label: "Pending", variant: "default" },
  delivered: { label: "Delivered", variant: "success" },
  failed: { label: "Not delivered", variant: "error" },
  skipped: { label: "Skipped", variant: "warning" },
};

export const tripStatusMap: Record<DeliveryTripRow["status"], { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  in_progress: { label: "In progress", variant: "info" },
  completed: { label: "Ended", variant: "success" },
  cancelled: { label: "Cancelled", variant: "error" },
};

export const endedByLabel = (t: { endedBy?: string; status: string }) =>
  t.status !== "completed" ? "" : t.endedBy === "auto" ? "Closed automatically" : t.endedBy === "admin" ? "Ended by office" : "Ended by agent";
