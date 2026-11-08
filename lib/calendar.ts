import type { Settings } from "./types";

export const TZ = "America/Chicago";

export function todayISO(now = new Date(), timeZone = TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

export function weekday(iso: string): number {
  const { y, m, d } = parseISO(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(iso: string, days: number): string {
  const { y, m, d } = parseISO(iso);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function monthStart(iso: string): string {
  return `${monthKey(iso)}-01`;
}

export function monthEnd(iso: string): string {
  const { y, m } = parseISO(iso);
  const last = new Date(Date.UTC(y, m, 0));
  return last.toISOString().slice(0, 10);
}

export function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function isWorkingDay(iso: string, settings: Settings): boolean {
  if (!settings.workingWeekdays.includes(weekday(iso))) return false;
  return !settings.holidays.includes(iso);
}

export function workingDaysInRange(from: string, to: string, settings: Settings): string[] {
  return eachDate(from, to).filter((d) => isWorkingDay(d, settings));
}

export function workingDaysInMonth(iso: string, settings: Settings): string[] {
  return workingDaysInRange(monthStart(iso), monthEnd(iso), settings);
}

export function weekStartMonday(iso: string): string {
  const dow = weekday(iso);
  const back = dow === 0 ? 6 : dow - 1;
  return addDays(iso, -back);
}

export function weekEndSunday(iso: string): string {
  return addDays(weekStartMonday(iso), 6);
}

export function yearStart(iso: string): string {
  return `${iso.slice(0, 4)}-01-01`;
}

export function formatLong(iso: string): string {
  const { y, m, d } = parseISO(iso);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatShort(iso: string): string {
  const { y, m, d } = parseISO(iso);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function defaultHolidays(year: number): string[] {
  const observed = (iso: string): string => {
    const dow = weekday(iso);
    if (dow === 6) return addDays(iso, -1);
    if (dow === 0) return addDays(iso, 1);
    return iso;
  };
  const nthWeekday = (month: number, dow: number, n: number): string => {
    const first = `${year}-${String(month).padStart(2, "0")}-01`;
    const firstDow = weekday(first);
    const offset = (dow - firstDow + 7) % 7;
    return addDays(first, offset + (n - 1) * 7);
  };
  const lastWeekday = (month: number, dow: number): string => {
    const last = monthEnd(`${year}-${String(month).padStart(2, "0")}-01`);
    const lastDow = weekday(last);
    const back = (lastDow - dow + 7) % 7;
    return addDays(last, -back);
  };
  const thanksgiving = nthWeekday(11, 4, 4);
  return [
    observed(`${year}-01-01`),
    lastWeekday(5, 1),
    observed(`${year}-07-04`),
    nthWeekday(9, 1, 1),
    thanksgiving,
    addDays(thanksgiving, 1),
    observed(`${year}-12-25`),
  ];
}

export function periodRange(
  period: "day" | "week" | "month" | "ytd",
  today: string,
): { from: string; to: string } {
  if (period === "day") return { from: today, to: today };
  if (period === "week") return { from: weekStartMonday(today), to: weekEndSunday(today) };
  if (period === "month") return { from: monthStart(today), to: monthEnd(today) };
  return { from: yearStart(today), to: today };
}
