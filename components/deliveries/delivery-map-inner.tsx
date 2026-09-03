"use client";

/**
 * Leaflet map used by the delivery pages. Loaded only on the client (see
 * delivery-map.tsx) because Leaflet touches `window` at import time.
 * OSM tiles, no API key. Markers are divIcons so no image assets are needed.
 */

import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap, useMapEvents } from "react-leaflet";

export interface MapAgent {
  id: string;
  name: string;
  lat: number;
  lng: number;
  at?: string;
  live?: boolean;
}

export interface MapStore {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status?: "pending" | "delivered" | "failed" | "skipped" | "unverified" | "verified";
  subtitle?: string;
}

export interface DeliveryMapProps {
  agents?: MapAgent[];
  stores?: MapStore[];
  path?: Array<{ lat: number; lng: number }>;
  /** Draggable single pin (store location editor). */
  pin?: { lat: number; lng: number } | null;
  /** The distributor's office, drawn as a fixed marker. */
  office?: { lat: number; lng: number; name?: string } | null;
  onPinChange?: (p: { lat: number; lng: number }) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  /** Re-fit bounds whenever this changes (e.g. the trip id). */
  fitKey?: string;
}

const STATUS_COLOR: Record<NonNullable<MapStore["status"]>, string> = {
  pending: "#6B7280",
  delivered: "#16A34A",
  failed: "#DC2626",
  skipped: "#D97706",
  unverified: "#D97706",
  verified: "#16A34A",
};

const storeIcon = (color: string) =>
  L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
  });

const agentIcon = (live: boolean) =>
  L.divIcon({
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div style="position:relative;width:26px;height:26px">
      ${live ? '<div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(0,108,230,.25);animation:bm-pulse 1.6s ease-out infinite"></div>' : ""}
      <div style="position:absolute;inset:0;border-radius:50%;background:#006CE6;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>
    </div>`,
  });

const officeIcon = L.divIcon({
  className: "",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  html: `<div style="width:26px;height:26px;border-radius:6px;background:#1A1A2E;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;color:#fff;font:700 12px system-ui">B</div>`,
});

const pinIcon = L.divIcon({
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#006CE6;border:3px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.45)"></div>`,
});

function FitBounds({ points, fitKey }: { points: Array<[number, number]>; fitKey?: string }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 15));
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, points.length]);
  return null;
}

function ClickToPin({ onPick }: { onPick?: (p: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function DeliveryMapInner({
  agents = [],
  stores = [],
  path = [],
  pin,
  onPinChange,
  office,
  center,
  zoom = 12,
  className,
  fitKey,
}: DeliveryMapProps) {
  const fitPoints = useMemo<Array<[number, number]>>(() => {
    const pts: Array<[number, number]> = [];
    agents.forEach((a) => pts.push([a.lat, a.lng]));
    stores.forEach((s) => pts.push([s.lat, s.lng]));
    path.forEach((p) => pts.push([p.lat, p.lng]));
    if (pin) pts.push([pin.lat, pin.lng]);
    if (office) pts.push([office.lat, office.lng]);
    return pts;
  }, [agents, stores, path, pin, office]);

  const initialCenter: [number, number] = center
    ? [center.lat, center.lng]
    : fitPoints[0] ?? [21.1702, 72.8311];

  return (
    <div className={className ?? "h-[420px] w-full rounded-xl overflow-hidden"}>
      <style>{`@keyframes bm-pulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.8);opacity:0}}.leaflet-container{font:inherit}`}</style>
      <MapContainer center={initialCenter} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={fitPoints} fitKey={fitKey} />
        {onPinChange ? <ClickToPin onPick={onPinChange} /> : null}

        {path.length > 1 ? (
          <Polyline positions={path.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={{ color: "#006CE6", weight: 4, opacity: 0.7 }} />
        ) : null}

        {stores.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={storeIcon(STATUS_COLOR[s.status ?? "pending"])}>
            <Tooltip direction="top" offset={[0, -20]}>
              <span className="font-medium">{s.name}</span>
              {s.subtitle ? <span className="block text-xs opacity-70">{s.subtitle}</span> : null}
            </Tooltip>
          </Marker>
        ))}

        {agents.map((a) => (
          <Marker key={a.id} position={[a.lat, a.lng]} icon={agentIcon(!!a.live)} zIndexOffset={1000}>
            <Popup>
              <div className="text-sm font-medium">{a.name}</div>
              {a.at ? <div className="text-xs opacity-70">{new Date(a.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div> : null}
            </Popup>
          </Marker>
        ))}

        {office ? (
          <Marker position={[office.lat, office.lng]} icon={officeIcon}>
            <Tooltip direction="top" offset={[0, -14]}><span className="font-medium">{office.name ?? "Office"}</span></Tooltip>
          </Marker>
        ) : null}

        {pin ? (
          <Marker
            position={[pin.lat, pin.lng]}
            icon={pinIcon}
            draggable={!!onPinChange}
            eventHandlers={{
              dragend: (e) => {
                const ll = (e.target as L.Marker).getLatLng();
                onPinChange?.({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
