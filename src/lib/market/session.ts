/** US equities session helpers in America/New_York, without a date library. */

export type EtParts = { y: number; m: number; d: number; hh: number; mm: number; dow: number }; // dow: 0=Sun

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short",
});
const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function etDate(date: Date = new Date()): EtParts {
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) if (part.type !== "literal") p[part.type] = part.value;
  return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour, mm: +p.minute, dow: DOW[p.weekday] ?? 0 };
}

/** A Date whose *UTC* fields equal the ET calendar date/time — convenient for date arithmetic. */
export function etNow(date: Date = new Date()): Date {
  const p = etDate(date);
  return new Date(Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm));
}
export const ymd = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const isWeekday = (d: Date) => d.getUTCDay() >= 1 && d.getUTCDay() <= 5;

/** Minutes since midnight ET. */
const minutesOf = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes();
export const OPEN_MIN = 9 * 60 + 30;
export const CLOSE_MIN = 16 * 60;

export type SessionState = "pre" | "open" | "post" | "closed-weekend";
export function sessionState(now: Date = etNow()): SessionState {
  if (!isWeekday(now)) return "closed-weekend";
  const m = minutesOf(now);
  if (m < OPEN_MIN) return "pre";
  if (m < CLOSE_MIN) return "open";
  return "post";
}

/**
 * The most recent day that had (or is having) a session, as YYYY-MM-DD in ET.
 * Before today's open, that's the previous weekday. Holidays aren't modelled (holidays_known:false) —
 * Polygon simply returns no bars for them and callers fall back to the last available daily bar.
 */
export function lastTradingDay(now: Date = etNow()): string {
  let d = now;
  const state = sessionState(d);
  if (state === "pre" || state === "closed-weekend") d = addDays(d, -1);
  while (!isWeekday(d)) d = addDays(d, -1);
  return ymd(d);
}

export function isSameEtDay(tsMs: number, dayYmd: string): boolean {
  return ymd(etNow(new Date(tsMs))) === dayYmd;
}

/** Previous weekday of a YYYY-MM-DD (holidays not modelled). */
export function previousWeekday(dayYmd: string): string {
  let d = new Date(dayYmd + "T00:00:00Z");
  do d = addDays(d, -1); while (!isWeekday(d));
  return ymd(d);
}

/**
 * Last *completed* session (the free tier only serves end-of-day bars): during a session that's the
 * previous weekday; after the close it's today.
 */
export function lastCompletedSession(now: Date = etNow()): string {
  const state = sessionState(now);
  if (state === "post") return ymd(now);
  return previousWeekday(ymd(now));
}
