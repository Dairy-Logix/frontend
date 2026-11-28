"use client";

import { Fragment } from "react";
import { createPortal } from "react-dom";
import type { CrossingGroupResult, CrossingItem, CrossingResult } from "@/lib/types";

/**
 * A4 crossing sheet. One page per crossing group; the page is split into one
 * equal block per truck (two halves for two trucks) separated by a dashed cut
 * line, so staff can cut it and hand each truck's labour its own list.
 *
 * Portaled to <body> and revealed only while body has `printing-crossing`
 * (see globals.css), so it never collides with the order print sheet.
 */

/** Text/padding scales tried, largest first, before giving up and spilling. */
const FIT_SCALES = [1, 0.9, 0.8, 0.7, 0.6];

/**
 * Measure each group's page off-screen. The page keeps both trucks together
 * (cut line between) and shrinks the text step by step until every half fits.
 * Only if even the smallest scale doesn't fit does it get `crossing-spill`
 * (one truck per page, flowing onto more pages) so nothing is ever clipped.
 * Returns how many groups had to spill.
 */
function fitPages(): number {
  const sheet = document.querySelector<HTMLElement>(".crossing-sheet");
  if (!sheet) return 0;
  const pages = Array.from(sheet.querySelectorAll<HTMLElement>(".crossing-page"));
  pages.forEach((p) => {
    p.classList.remove("crossing-spill");
    p.style.removeProperty("--cx-scale");
  });
  sheet.classList.add("crossing-measure");
  let spilled = 0;
  try {
    for (const page of pages) {
      const overflows = () =>
        Array.from(page.querySelectorAll<HTMLElement>(".crossing-half")).some(
          (h) => h.scrollHeight > h.clientHeight + 1,
        );
      let fits = false;
      for (const scale of FIT_SCALES) {
        page.style.setProperty("--cx-scale", String(scale));
        if (!overflows()) {
          fits = true;
          break;
        }
      }
      if (!fits) {
        page.style.removeProperty("--cx-scale");
        page.classList.add("crossing-spill");
        spilled++;
      }
    }
  } finally {
    sheet.classList.remove("crossing-measure");
  }
  return spilled;
}

/** Print the crossing sheet. Returns the number of groups that needed one truck per page. */
export function printCrossing(): number {
  const styleId = "crossing-print-page-style";
  let el = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = styleId;
    document.head.appendChild(el);
  }
  el.textContent = `@media print { @page { size: A4 portrait; margin: 8mm; } }`;

  const spilled = fitPages();

  const cleanup = () => {
    document.body.classList.remove("printing-crossing");
    window.removeEventListener("afterprint", cleanup);
  };
  document.body.classList.add("printing-crossing");
  window.addEventListener("afterprint", cleanup);
  window.print();
  return spilled;
}

function SendTable({ title, items }: { title: string; items: CrossingItem[] }) {
  return (
    <div className="crossing-block">
      <div className="crossing-block-title">{title}</div>
      <table className="crossing-table">
        <thead>
          <tr>
            <th className="tick" />
            <th>Product</th>
            <th className="num">Total</th>
            <th className="num">Remain</th>
            <th className="num send">Move</th>
            <th className="code">Code</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.productId}>
              <td className="tick">☐</td>
              <td>
                {item.productName} ({item.unitType})
              </td>
              <td className="num">{item.total}</td>
              <td className="num">{item.remain}</td>
              <td className="num send">{item.quantity}</td>
              <td className="code">{item.shortName || "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupPage({
  group,
  date,
  tenantName,
  generated,
}: {
  group: CrossingGroupResult;
  date: string;
  tenantName: string;
  generated: string;
}) {
  const nameOf = (id: string) => group.trucks.find((t) => t.id === id)?.name ?? "Truck";

  return (
    <div className="crossing-page">
      {group.trucks.map((truck, idx) => {
        const gives = group.transfers.filter((t) => t.fromTruckId === truck.id);
        return (
          <Fragment key={truck.id}>
            {idx > 0 && <div className="crossing-cut">✂ cut here</div>}
            <div className="crossing-half">
              <div className="crossing-head">
                <div>
                  <div className="crossing-truck">
                    {truck.name}
                    {truck.factoryName ? ` — ${truck.factoryName}` : ""}
                  </div>
                  <div className="crossing-sub">
                    Crossing list · {group.name}
                    {tenantName ? ` · ${tenantName}` : ""}
                  </div>
                </div>
                <div className="crossing-meta">
                  <div>Date: {date}</div>
                  <div>Printed: {generated}</div>
                </div>
              </div>

              {gives.length === 0 && (
                <div className="crossing-empty">Nothing to move from this truck.</div>
              )}
              {gives.map((t) => (
                <SendTable
                  key={t.toTruckId}
                  title={`Move to ${nameOf(t.toTruckId)}`}
                  items={t.items}
                />
              ))}

              {idx === group.trucks.length - 1 && group.unassignedProducts.length > 0 && (
                <div className="crossing-warn">
                  Not assigned to any truck (set up in Settings → Crossing):{" "}
                  {group.unassignedProducts
                    .map((p) => `${p.productName} (${p.unitType}) ${p.quantity}`)
                    .join(", ")}
                </div>
              )}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

export function CrossingPrintSheet({
  data,
  tenantName,
  ready,
}: {
  data: CrossingResult | null;
  tenantName: string;
  /** Portal target is only available client-side. */
  ready: boolean;
}) {
  if (!ready) return null;
  const generated = new Date().toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "short",
  });
  return createPortal(
    <div className="crossing-sheet">
      {data?.groups.map((group) => (
        <GroupPage
          key={group.id}
          group={group}
          date={data.date}
          tenantName={tenantName}
          generated={generated}
        />
      ))}
    </div>,
    document.body,
  );
}
