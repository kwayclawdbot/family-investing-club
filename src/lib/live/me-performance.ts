import "server-only";
import type { PickStance } from "@/lib/types";
import { BENCHMARK, barsFor, changeSince, weightedSeries, windowStart } from "./club-performance";
import { getSession } from "./session";
import { must, safe, userClient } from "./supa";

/**
 * "My Performance → Picks": this member's own picks, priced from real bars.
 * A pick is a timestamped opinion, so its return is measured from the day it was made — never from
 * the start of the year — and a pick too new (or a symbol we can't price) reports null, not zero.
 */
export type PickRow = { id: string; symbol: string; name: string; stance: PickStance; reason: string; at: string; date: string; pct: number | null };
export type MyPicksPerformance = {
  picks: number; open: number; resolved: number;
  avgPct: number | null; benchYtdPct: number | null; series: number[] | null;
  best: PickRow | null; worst: PickRow | null;
  stance: { buy: number; watch: number; pass: number };
  history: PickRow[];
  priced: number;
};

export async function getMyPicksPerformance(): Promise<MyPicksPerformance | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("me.picksPerformance", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("fic_club_picks")
      .select("id, symbol, company_name, stance, reason, price_at_pick, resolved_at, resolved_return_pct, created_at")
      .eq("author_id", s.user.id).order("created_at", { ascending: false })) as
      { id: string; symbol: string; company_name: string | null; stance: PickStance; reason: string; price_at_pick: number | null; resolved_at: string | null; resolved_return_pct: number | null; created_at: string }[];
    if (!rows.length) {
      return { picks: 0, open: 0, resolved: 0, avgPct: null, benchYtdPct: null, series: null, best: null, worst: null, stance: { buy: 0, watch: 0, pass: 0 }, history: [], priced: 0 };
    }
    const bars = await barsFor([BENCHMARK, ...new Set(rows.map((r) => r.symbol))]);
    const history: PickRow[] = rows.map((r) => {
      const b = bars.get(r.symbol);
      const pct = r.resolved_return_pct !== null ? Number(r.resolved_return_pct)
        : b ? changeSince(b, new Date(r.created_at).setHours(0, 0, 0, 0)) : null;
      return {
        id: r.id, symbol: r.symbol, name: r.company_name ?? r.symbol, stance: r.stance, reason: r.reason, at: r.created_at,
        date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        pct: pct === null ? null : +pct.toFixed(1),
      };
    });
    const priced = history.filter((h) => h.pct !== null);
    const ranked = [...priced].sort((a, b) => b.pct! - a.pct!);
    // The line is the member's picks held equally from the day each was made.
    const equal = [...new Set(rows.map((r) => r.symbol))].map((sym) => ({ weightPct: 1, bars: bars.get(sym) ?? [] })).filter((r) => r.bars.length);
    const earliest = Math.min(...rows.map((r) => new Date(r.created_at).getTime()));
    const bench = bars.get(BENCHMARK);
    return {
      picks: rows.length,
      open: rows.filter((r) => !r.resolved_at).length,
      resolved: rows.filter((r) => r.resolved_at).length,
      avgPct: priced.length ? +(priced.reduce((a, h) => a + h.pct!, 0) / priced.length).toFixed(1) : null,
      benchYtdPct: bench ? changeSince(bench, windowStart("YTD")) : null,
      series: equal.length ? weightedSeries(equal, earliest) : null,
      best: ranked[0] ?? null, worst: ranked.length > 1 ? ranked[ranked.length - 1] : null,
      stance: { buy: rows.filter((r) => r.stance === "buy").length, watch: rows.filter((r) => r.stance === "watch").length, pass: rows.filter((r) => r.stance === "pass").length },
      history, priced: priced.length,
    };
  });
}
