"use client";
/** Client-side persistence for Markets/Practice (localStorage `fic.*`, all in try/catch). */
import type { Order, WatchItem, ExplanationLevel } from "@/lib/types";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

/* ── Watchlist: user additions + removals layered over the fixture list ── */
export type WatchState = { added: WatchItem[]; removed: string[] };
const WL = "fic.watchlist";
export const readWatch = () => read<WatchState>(WL, { added: [], removed: [] });
export function mergeWatch(base: WatchItem[], s: WatchState): WatchItem[] {
  const out = base.filter((w) => !s.removed.includes(w.symbol));
  for (const a of s.added) if (!out.some((w) => w.symbol === a.symbol && w.list === a.list)) out.push(a);
  return out;
}
export function isWatched(base: WatchItem[], s: WatchState, symbol: string) {
  return mergeWatch(base, s).some((w) => w.symbol === symbol);
}
export function toggleWatch(base: WatchItem[], symbol: string, name: string, reason = "Added from the company page"): WatchState {
  const s = readWatch();
  if (isWatched(base, s, symbol)) {
    s.added = s.added.filter((w) => w.symbol !== symbol);
    if (base.some((w) => w.symbol === symbol)) s.removed = [...new Set([...s.removed, symbol])];
  } else {
    s.removed = s.removed.filter((x) => x !== symbol);
    s.added.push({ symbol, name, reason, list: "personal" });
  }
  write(WL, s);
  return s;
}
export function removeWatch(symbol: string, list: WatchItem["list"]): WatchState {
  const s = readWatch();
  s.added = s.added.filter((w) => !(w.symbol === symbol && w.list === list));
  s.removed = [...new Set([...s.removed, symbol])];
  write(WL, s);
  return s;
}

/* ── Orders ─────────────────────────────────────────────────────────── */
const OR = "fic.orders";
export const readOrders = () => read<Order[]>(OR, []);
export function addOrder(o: Order) {
  const all = [o, ...readOrders()];
  write(OR, all);
  return all;
}

/* ── Recent searches ────────────────────────────────────────────────── */
const RC = "fic.recent";
export const readRecent = () => read<string[]>(RC, []);
export function pushRecent(q: string) {
  const r = [q, ...readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6);
  write(RC, r);
  return r;
}

/* ── Explanation level ──────────────────────────────────────────────── */
export function readLevel(): ExplanationLevel {
  try {
    const v = localStorage.getItem("fic.level");
    if (v === "Explorer" || v === "Builder" || v === "Investor" || v === "Trader") return v;
  } catch { /* ignore */ }
  return "Investor";
}
export const isYouth = (l: ExplanationLevel) => l === "Explorer" || l === "Builder";
