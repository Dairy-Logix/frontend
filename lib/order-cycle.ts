/**
 * Client-side mirror of the backend business-day window math (IST, UTC+5:30),
 * used only to render a live preview in the agency form. The backend remains the
 * source of truth; this never persists anything.
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

export interface OrderCyclePreview {
  dayStartTime?: string;
  orderOpenTime?: string;
  orderCutoff?: string;
  autoToggle?: boolean;
}

function parseMinutes(time?: string | null): number {
  if (!time) return 0;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(time).trim());
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

function floorTo(value: number, step: number): number {
  return value - (((value % step) + step) % step);
}

export function businessDayWindow(dayStartTime?: string, at: Date = new Date()): { start: Date; end: Date } {
  const istMs = at.getTime() + IST_OFFSET_MS;
  const rolloverMs = parseMinutes(dayStartTime) * 60_000;
  const startIstMs = floorTo(istMs - rolloverMs, DAY_MS) + rolloverMs;
  const startUtcMs = startIstMs - IST_OFFSET_MS;
  return { start: new Date(startUtcMs), end: new Date(startUtcMs + DAY_MS - 1) };
}

function instantInWindow(window: { start: Date; end: Date }, time: string): Date {
  const minutes = parseMinutes(time);
  const startIstMs = window.start.getTime() + IST_OFFSET_MS;
  const startMinuteOfDay = (((startIstMs % DAY_MS) + DAY_MS) % DAY_MS) / 60_000;
  let deltaMin = minutes - startMinuteOfDay;
  if (deltaMin < 0) deltaMin += 24 * 60;
  return new Date(window.start.getTime() + deltaMin * 60_000);
}

export function isOrderWindowOpen(cycle: OrderCyclePreview, at: Date = new Date()): boolean {
  const window = businessDayWindow(cycle.dayStartTime, at);
  const now = at.getTime();
  const open = (cycle.orderOpenTime ? instantInWindow(window, cycle.orderOpenTime) : window.start).getTime();
  if (!cycle.orderCutoff) return now >= open;
  const cutoff = instantInWindow(window, cycle.orderCutoff).getTime();
  return cutoff > open ? now >= open && now < cutoff : now >= open || now < cutoff;
}

/** Strict "HH:mm" → minutes, or null when empty/invalid. */
function toMinutesOrNull(time?: string | null): number | null {
  if (!time) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(time).trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/**
 * Validate that ordering open/close times sit correctly inside the business-day
 * window. Times are measured as an offset from the window start (dayStartTime),
 * since clock times wrap around the rollover. Returns an error message, or null
 * when valid. Only enforced when auto open/close is on (the times are unused
 * otherwise); an empty open means "opens at the rollover".
 */
export function validateOrderCycle(c: OrderCyclePreview): string | null {
  if (!c.autoToggle) return null;
  const start = toMinutesOrNull(c.dayStartTime) ?? 0;
  const offset = (t: number) => (t - start + 1440) % 1440;

  const open = toMinutesOrNull(c.orderOpenTime);
  const cutoff = toMinutesOrNull(c.orderCutoff);

  if (open !== null && offset(open) === 0) {
    return 'Opening time must be after the day-start time.';
  }
  const openOffset = open !== null ? offset(open) : 0; // empty open = window start
  if (cutoff !== null) {
    const cutoffOffset = offset(cutoff);
    if (cutoffOffset === 0) return 'Closing time must be within the order window (after the day start).';
    if (cutoffOffset <= openOffset) return 'Closing time must be after the opening time.';
  }
  return null;
}

/** Format an instant in IST as a friendly "Sun, Jun 1, 5:00 PM". */
export function fmtIST(d: Date): string {
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
