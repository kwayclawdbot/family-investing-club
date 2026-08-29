import "server-only";
import { cache } from "react";
import type { DecisionMarker, PerfSeries } from "@/lib/types";
import * as pg from "@/lib/market/polygon";
import { safe } from "./supa";

/**
 * The club's model portfolio, priced from real bars.
 *
 * `fic_club_holdings` stores weights, not dollars — there is no cash ledger — so everything here is a
 * percentage, and the dollar figure a club shows is an explicit practice stake (`rules.startingValue`,
 * default $10,000) grown by the weighted return. Nothing is invented: a symbol we cannot price is
 * reported as `null` and the surfaces render "—".
 *
 * Polygon is a 5-requests/minute key shared with the FTA dashboard, so bars are taken from cache first
 * and only the remaining budget is ever spent. A cold cache degrades (fewer priced holdings, no chart)
 * instead of stalling the page.
 */

export const BENCHMARK = "SPY";
/** Hard ceiling on live bar fetches per render — the rest come from cache or read as "—".
 *  One per render: each miss can wait, and three of them turned a tap into an eight-second stall.
 *  A page warms one new symbol per visit, which fills a six-holding club in six views and costs
 *  nobody a hang. The nightly crons warm the rest. */
const MAX_LIVE_FETCHES = 1;
const RANGES = ["1M", "3M", "YTD", "1Y"] as const;
export type ClubRange = (typeof RANGES)[number];

export type Bars = { t: number; c: number }[];

/** Bars per symbol: cache first, then at most the remaining minute-budget in live calls. */
export async function barsFor(symbols: string[], opts: { spend?: number } = {}): Promise<Map<string, Bars>> {
  const out = new Map<string, Bars>();
  const missing: string[] = [];
  for (const s of symbols) {
    const a = await pg.aggregates(s, "1Y", { cacheOnly: true });
    if (a?.bars.length) out.set(s, a.bars.map((b) => ({ t: b.t, c: b.c }))); else missing.push(s);
  }
  // Leave one slot for whatever else the page needs (quotes are grouped and usually already cached),
  // and never spend more than MAX_LIVE_FETCHES on one render: each miss can wait, and a page that
  // blocks for twenty seconds on a cold cache is worse than one that says "3 of 6 priced" and fills
  // in on the next visit. `spend: 0` means cache-only, for widgets that must not starve the page.
  let spend = Math.min(MAX_LIVE_FETCHES, opts.spend ?? Math.max(0, pg.budgetLeft() - 1));
  for (const s of missing) {
    if (spend <= 0) break;
    spend--;
    const a = await pg.aggregates(s, "1Y", { maxWait: 1_500 });
    if (a?.bars.length) out.set(s, a.bars.map((b) => ({ t: b.t, c: b.c })));
  }
  return out;
}

export const windowStart = (range: ClubRange): number => {
  const now = new Date();
  if (range === "YTD") return Date.UTC(now.getUTCFullYear(), 0, 1);
  const days = range === "1M" ? 32 : range === "3M" ? 93 : 366;
  return Date.now() - days * 86_400_000;
};

/** % change across the bars at/after `from`. */
export function changeSince(bars: Bars, from: number): number | null {
  const pct = (b: Bars) => (b[0].c > 0 ? +(((b[b.length - 1].c - b[0].c) / b[0].c) * 100).toFixed(2) : null);
  if (bars.length < 2) return null;
  const win = bars.filter((b) => b.t >= from);
  if (win.length >= 2) return pct(win);
  // Too few bars in the window. Falling back to the full year would report a 1-year move as
  // "since we added it two days ago", so only do it when `from` predates the history we hold.
  return from <= bars[0].t ? pct(bars) : null;
}

/** Weighted index (base 100) for one range: each holding normalised to its own first bar in the window. */
export function weightedSeries(rows: { weightPct: number; bars: Bars }[], from: number, points = 40): number[] | null {
  const priced = rows.filter((r) => r.bars.some((b) => b.t >= from));
  if (!priced.length) return null;
  const total = priced.reduce((a, r) => a + r.weightPct, 0) || 1;
  const windows = priced.map((r) => {
    const w = r.bars.filter((b) => b.t >= from);
    return { weight: r.weightPct / total, closes: (w.length >= 2 ? w : r.bars).map((b) => b.c) };
  });
  const n = Math.min(points, Math.max(...windows.map((w) => w.closes.length)));
  if (n < 2) return null;
  const at = (closes: number[], i: number) => closes[Math.min(closes.length - 1, Math.round((i / (n - 1)) * (closes.length - 1)))];
  return Array.from({ length: n }, (_, i) =>
    +windows.reduce((acc, w) => acc + w.weight * (at(w.closes, i) / w.closes[0]) * 100, 0).toFixed(2));
}

export type HoldingPerf = { symbol: string; name: string; weightPct: number; origin: string; addedAt: string; ytdPct: number | null; sinceAddPct: number | null; price: number | null };
export type ClubPerformance = {
  holdings: HoldingPerf[];
  ytdPct: number | null;
  benchmarkYtdPct: number | null;
  /** null when too few holdings could be priced to draw an honest line. */
  series: PerfSeries[] | null;
  ranges: string[];
  allocation: { label: string; pct: number; color: string }[];
  concentration: { symbol: string; pct: number } | null;
  priced: number;
};

const PALETTE = ["bg-green-2", "bg-orange", "bg-purple", "bg-gold", "bg-green-3", "bg-coral"];

export const clubPerformance = cache(async (
  rows: { symbol: string; company_name: string | null; weight_pct: number; origin: string | null; added_at: string }[],
  markersFor?: (range: ClubRange, points: number) => DecisionMarker[],
): Promise<ClubPerformance | null> => {
  if (!rows.length) return null;
  return safe("club.performance", async () => {
    const bars = await barsFor([BENCHMARK, ...rows.map((r) => r.symbol)]);
    const bench = bars.get(BENCHMARK);
    const holdings: HoldingPerf[] = rows.map((r) => {
      const b = bars.get(r.symbol);
      const added = new Date(r.added_at).setHours(0, 0, 0, 0);
      return {
        symbol: r.symbol, name: r.company_name ?? r.symbol, weightPct: Number(r.weight_pct),
        origin: r.origin ?? "", addedAt: r.added_at,
        ytdPct: b ? changeSince(b, windowStart("YTD")) : null,
        sinceAddPct: b ? changeSince(b, added) : null,
        price: b?.length ? b[b.length - 1].c : null,
      };
    });
    const priced = holdings.filter((h) => h.ytdPct !== null);
    const weight = priced.reduce((a, h) => a + h.weightPct, 0);
    const ytdPct = weight > 0 ? +(priced.reduce((a, h) => a + h.weightPct * h.ytdPct!, 0) / weight).toFixed(2) : null;

    const withBars = rows.map((r) => ({ weightPct: Number(r.weight_pct), bars: bars.get(r.symbol) ?? [] })).filter((r) => r.bars.length);
    const series: PerfSeries[] = [];
    if (withBars.length && bench) {
      for (const range of RANGES) {
        const from = windowStart(range);
        const club = weightedSeries(withBars, from);
        const bm = weightedSeries([{ weightPct: 1, bars: bench }], from, club?.length ?? 40);
        if (club && bm && club.length === bm.length) series.push({ range, club, benchmark: bm, markers: markersFor?.(range, club.length) ?? [] });
      }
    }

    // Allocation is what the club actually holds, plus whatever weight is unallocated (cash).
    const sorted = [...holdings].sort((a, b) => b.weightPct - a.weightPct);
    const allocation = sorted.slice(0, 5).map((h, i) => ({ label: h.symbol, pct: Math.round(h.weightPct), color: PALETTE[i % PALETTE.length] }));
    const held = sorted.reduce((a, h) => a + h.weightPct, 0);
    const rest = sorted.slice(5).reduce((a, h) => a + h.weightPct, 0);
    if (rest >= 1) allocation.push({ label: "Other", pct: Math.round(rest), color: "bg-line-3" });
    if (held < 99) allocation.push({ label: "Cash", pct: Math.round(100 - held), color: "bg-line-3" });

    return {
      holdings, ytdPct,
      benchmarkYtdPct: bench ? changeSince(bench, windowStart("YTD")) : null,
      series: series.length ? series : null,
      ranges: series.length ? series.map((s) => s.range) : [...RANGES],
      allocation,
      concentration: sorted[0] ? { symbol: sorted[0].symbol, pct: Math.round(sorted[0].weightPct) } : null,
      priced: priced.length,
    };
  });
});
