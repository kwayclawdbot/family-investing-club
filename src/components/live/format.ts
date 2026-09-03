import { clockTime, shortClockTime, shortDate, weekday } from "@/lib/format/when";

/** "Thu · 7:00 PM" */
export function whenLabel(iso: string) {
  return `${weekday(iso)} · ${clockTime(iso)}`;
}
export function dateLabel(iso: string) {
  return shortDate(iso);
}
/** Artboard 22 date tile: "THU" / "7 PM". */
export function dayTile(iso: string) {
  return { day: weekday(iso).toUpperCase(), time: shortClockTime(iso) };
}
