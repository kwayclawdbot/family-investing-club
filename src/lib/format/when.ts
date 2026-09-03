/**
 * Dates and times that render identically on the server and in the browser.
 *
 * `new Date(iso).toLocaleTimeString("en-US", …)` inside a client component is a hydration bug: the
 * server renders it in the server's timezone (UTC on Vercel) and the browser re-renders it in the
 * viewer's. The strings differ, React throws a hydration mismatch, and — because the whole tree
 * fails to hydrate — every button on the page stops responding while plain links keep working. It
 * presents as "nothing is clickable", which is a long way from "a time is wrong".
 *
 * Every helper here pins the timezone, so both sides produce the same characters. Market time is the
 * right pin for this product: sessions are scheduled in ET, the market opens in ET, and a class at
 * 7:00 PM ET should say so rather than shifting per viewer.
 */

const TZ = "America/New_York";

const opts = (o: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({ ...o, timeZone: TZ });

/** "Thu" */
export function weekday(iso: string | number | Date): string {
  return new Date(iso).toLocaleDateString("en-US", opts({ weekday: "short" }));
}

/** "7:00 PM" — market time. Pair it with `ET` where the timezone is not obvious from context. */
export function clockTime(iso: string | number | Date): string {
  return new Date(iso).toLocaleTimeString("en-US", opts({ hour: "numeric", minute: "2-digit" }));
}

/** "7 PM", dropping the minutes when the time lands on the hour. For tight date tiles. */
export function shortClockTime(iso: string | number | Date): string {
  return clockTime(iso).replace(":00", "");
}

/** The hour of the day, 0–23, in market time — for "good morning / afternoon / evening" copy. */
export function marketHour(iso: string | number | Date = Date.now()): number {
  return Number(new Date(iso).toLocaleString("en-US", opts({ hour: "numeric", hourCycle: "h23" })));
}

/** "Aug 28" */
export function shortDate(iso: string | number | Date): string {
  return new Date(iso).toLocaleDateString("en-US", opts({ month: "short", day: "numeric" }));
}

/** "Aug 28, 2026" */
export function longDate(iso: string | number | Date): string {
  return new Date(iso).toLocaleDateString("en-US", opts({ month: "short", day: "numeric", year: "numeric" }));
}

/** "Thu, Aug 28" */
export function dayAndDate(iso: string | number | Date): string {
  return new Date(iso).toLocaleDateString("en-US", opts({ weekday: "short", month: "short", day: "numeric" }));
}

/** "Aug 28, 7:00 PM" */
export function dateAndTime(iso: string | number | Date): string {
  return new Date(iso).toLocaleString("en-US", opts({ month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }));
}

/** "Thu, Aug 28, 7:00 PM" */
export function fullWhen(iso: string | number | Date): string {
  return new Date(iso).toLocaleString("en-US", opts({ weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }));
}
