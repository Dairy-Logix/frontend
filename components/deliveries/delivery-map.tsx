"use client";

import dynamic from "next/dynamic";
import type { DeliveryMapProps } from "./delivery-map-inner";

/** Client-only Leaflet map; renders a placeholder during SSR / load. */
export const DeliveryMap = dynamic<DeliveryMapProps>(() => import("./delivery-map-inner"), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full rounded-xl bg-muted/40 animate-pulse" />,
});

export type { MapAgent, MapStore, DeliveryMapProps } from "./delivery-map-inner";
