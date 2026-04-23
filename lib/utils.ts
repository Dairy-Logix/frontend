import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns a displayable URL for a stored logo (data URI, http URL, or relative backend path). */
export function getLogoUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath) return null;
  if (logoPath.startsWith("data:") || logoPath.startsWith("http")) return logoPath;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const backendBase = apiBase.replace(/\/api$/, "");
  return `${backendBase}${logoPath}`;
}

const IST_TZ = 'Asia/Kolkata';
const IST_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: IST_TZ });

/** Returns today's date as YYYY-MM-DD in Asia/Kolkata timezone */
export function todayIST(): string {
  return IST_FMT.format(new Date());
}

/** Converts any date value to a YYYY-MM-DD string in Asia/Kolkata timezone */
export function dateToIST(date: Date | string | number): string {
  return IST_FMT.format(new Date(date));
}

/** Returns true if the given ISO date string falls on today in Asia/Kolkata timezone */
export function isTodayIST(dateStr: string): boolean {
  return dateToIST(new Date(dateStr)) === todayIST();
}
