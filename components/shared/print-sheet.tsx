"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { getLogoUrl } from "@/lib/utils";

/**
 * Shared branded print layer. A page renders ONE <PrintSheet> (portaled to
 * <body>, invisible on screen) and calls printDocument() — the @media print
 * CSS in globals.css hides every other body child, so the sheet is the whole
 * printed document: tenant logo + company header, meta block, content,
 * branded footer. Compose content from PrintStats / PrintTable /
 * PrintSection. Browser "Save as PDF" turns it into the PDF download.
 */

/** Inject the shared @page rule and open the browser print dialog. */
export function printDocument(
  orientation: "portrait" | "landscape" = "portrait"
) {
  const styleId = "app-print-page-style";
  let el = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = styleId;
    document.head.appendChild(el);
  }
  el.textContent = `@page { size: A4 ${orientation}; margin: 12mm; }`;
  window.print();
}

export function PrintStats({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="pr-stats">
      {items.map((s) => (
        <div key={s.label} className="pr-stat">
          <div className="pr-stat-label">{s.label}</div>
          <div className="pr-stat-value">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

export function PrintSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pr-section">
      {title && <div className="pr-section-title">{title}</div>}
      {children}
    </div>
  );
}

export function PrintTable({
  title,
  headers,
  rows,
  align,
}: {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
  /** "l" | "r" per column; defaults to first left, rest right */
  align?: ("l" | "r")[];
}) {
  const cls = (i: number) =>
    (align ? align[i] : i === 0 ? "l" : "r") === "r" ? "num" : undefined;
  return (
    <div className="pr-section">
      {title && <div className="pr-section-title">{title}</div>}
      <table className="pr-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={h} className={cls(i)}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className={cls(ci)}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PrintSheet({
  title,
  meta = [],
  children,
}: {
  /** Document title shown under the company name and in the footer */
  title: string;
  /** Extra right-aligned header lines (Period, Invoice No, …); a Generated
   *  timestamp line is always appended */
  meta?: { label: string; value: string }[];
  children: React.ReactNode;
}) {
  const tenant = useTenantStore((s) => s.tenant);
  // SSR-safe mount check: false during server render, true on the client
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  if (!ready) return null;

  const logo = getLogoUrl(tenant?.logo);
  return createPortal(
    <div className="print-sheet pr-root">
      <div className="pr-header">
        <div className="pr-brand">
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="pr-logo" />
          )}
          <div>
            <div className="pr-company">{tenant?.name ?? ""}</div>
            <div className="pr-report-title">{title}</div>
          </div>
        </div>
        <div className="pr-meta">
          {meta.map((m) => (
            <div key={m.label}>
              <b>{m.label}:</b> {m.value}
            </div>
          ))}
          <div>
            <b>Generated:</b>{" "}
            {new Date().toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
      {children}
      <div className="pr-footer">
        {tenant?.name ?? ""} · {title} · Generated with BeatMitra
      </div>
    </div>,
    document.body
  );
}
