import "server-only";
import type { Pick } from "@/lib/types";
import { getClubPortfolio, getPicks, getResearch } from "./club";
import { getWatchlist } from "./watchlist";
import { barsFor, changeSince, weightedSeries, BENCHMARK } from "./club-performance";
import { ficConsensus } from "./admin";
import { safe } from "./supa";
import { universeEntry, UNIVERSE } from "@/lib/market/universe";

/**
 * Discover — what this member's world is actually about, not an editor's shortlist.
 * Every card is a row somebody wrote: a club holding, a research assignment, a pick, a watchlist entry.
 * The "story" line states that fact; nothing is invented. When the club is brand new the list falls
 * back to the curated starter universe, labelled as such.
 */
export type DiscoverCard = {
  symbol: string; name: string; story: string; tag: string;
  tone: "green" | "orange" | "gold" | "purple"; metric: "today" | "ytd"; href: string; kind: "stock" | "theme";
};

export async function getDiscoverCards(limit = 6): Promise<DiscoverCard[] | null> {
  return safe("discover.cards", async () => {
    const [port, research, picks, watch] = await Promise.all([getClubPortfolio(), getResearch(), getPicks(), getWatchlist()]);
    // One bucket per source, drained round-robin: a six-holding club still leaves room for the
    // research, picks and watchlist cards.
    const buckets: DiscoverCard[][] = [[], [], [], [], []];
    const seen = new Set<string>();
    let bucket = 0;
    const add = (c: DiscoverCard) => { if (!seen.has(c.symbol)) { seen.add(c.symbol); buckets[bucket].push(c); } };

    for (const h of port?.holdings ?? []) {
      add({ symbol: h.symbol, name: h.name, tone: "gold", metric: "today", href: `/discover/${h.symbol}`, kind: "stock",
        tag: `YOUR CLUB\n${Math.round(h.weightPct)}%`, story: h.origin ? `Your club holds ${Math.round(h.weightPct)}% — ${h.origin}.` : `Your club holds ${Math.round(h.weightPct)}%.` });
    }
    bucket = 1;
    for (const r of (research ?? []).filter((x) => x.status === "open")) {
      add({ symbol: r.symbol, name: r.name, tone: "orange", metric: "today", href: `/discover/${r.symbol}`, kind: "stock",
        tag: `${(r.assignee === "you" ? "YOU ARE" : `${r.assignee.toUpperCase()} IS`)}\nRESEARCHING`, story: r.reason || `${r.assignee === "you" ? "You are" : `${r.assignee} is`} researching this for the club.` });
    }
    bucket = 2;
    const bySymbol = new Map<string, Pick[]>();
    for (const p of picks ?? []) bySymbol.set(p.symbol, [...(bySymbol.get(p.symbol) ?? []), p]);
    for (const [symbol, ps] of bySymbol) {
      const latest = ps[0];
      add({ symbol, name: latest.name ?? symbol, tone: "green", metric: "today", href: `/discover/${symbol}`, kind: "stock",
        tag: `${ps.length} IN YOUR\nCLUB`, story: `${latest.author} ${latest.stance === "buy" ? "picked it" : latest.stance === "watch" ? "is watching it" : "passed on it"} — “${latest.reason.split(".")[0].slice(0, 70)}”.` });
    }
    bucket = 3;
    for (const w of watch ?? []) {
      // A personal stance stores only a ticker; give it a real company name where we know one.
      add({ symbol: w.symbol, name: w.name === w.symbol ? universeEntry(w.symbol)?.name ?? w.symbol : w.name, tone: "purple", metric: "today", href: `/discover/${w.symbol}`, kind: "stock",
        tag: w.list === "family" ? "ON YOUR CLUB\nWATCHLIST" : "ON YOUR\nWATCHLIST", story: w.reason || `On your ${w.list === "family" ? "club's" : ""} watchlist.` });
    }
    bucket = 4;
    // A brand-new club has nothing of its own yet — offer the curated starter list, and say so.
    for (const u of UNIVERSE) {
      if (seen.size >= limit + 4) break;
      add({ symbol: u.symbol, name: u.name, tone: "purple", metric: "today", href: `/discover/${u.symbol}`, kind: "stock",
        tag: "START\nHERE", story: u.understand[0]?.q ?? `Learn how ${u.name} makes money.` });
    }
    const out: DiscoverCard[] = [];
    for (let i = 0; out.length < limit; i++) {
      const row = buckets.map((b) => b[i]).filter(Boolean);
      if (!row.length) break;
      out.push(...row.slice(0, limit - out.length));
    }
    return out;
  });
}

/** A theme's basket return, priced from real bars — equal-weighted, against the same window of SPY. */
export async function getThemePerformance(symbols: string[], months = 12, opts: { spend?: number } = {}): Promise<{ basketPct: number | null; benchmarkPct: number | null; per: Record<string, number | null> } | null> {
  if (!symbols.length) return null;
  return safe("discover.themePerformance", async () => {
    const bars = await barsFor([BENCHMARK, ...symbols], opts);
    const from = Date.now() - months * 30.4 * 86_400_000;
    const per: Record<string, number | null> = {};
    for (const s of symbols) { const b = bars.get(s); per[s] = b ? changeSince(b, from) : null; }
    const priced = Object.values(per).filter((v): v is number => v !== null);
    const bench = bars.get(BENCHMARK);
    return {
      basketPct: priced.length ? +(priced.reduce((a, b) => a + b, 0) / priced.length).toFixed(1) : null,
      benchmarkPct: bench ? changeSince(bench, from) : null,
      per,
    };
  });
}

export { universeEntry };

/** A theme, with every number computed: basket vs benchmark, per-company 1Y, and real FIC picks. */
export type ThemeStats = {
  basketPct: number | null; benchmarkPct: number | null; per: Record<string, number | null>;
  series: number[] | null; picks: number; buyPct: number | null; watchPct: number | null; passPct: number | null;
};
export async function getThemeStats(symbols: string[]): Promise<ThemeStats | null> {
  return safe("discover.themeStats", async () => {
    const [perf, consensus] = await Promise.all([
      getThemePerformance(symbols),
      Promise.all(symbols.map((s) => ficConsensus(s))),
    ]);
    const bars = await barsFor(symbols);
    const rows = consensus.filter((c): c is NonNullable<typeof c> => !!c);
    const picks = rows.reduce((a, c) => a + c.picks, 0);
    const wavg = (key: "buyPct" | "watchPct" | "passPct") =>
      picks ? Math.round(rows.reduce((a, c) => a + c[key] * c.picks, 0) / picks) : null;
    const withBars = symbols.map((s) => ({ weightPct: 1, bars: bars.get(s) ?? [] })).filter((r) => r.bars.length);
    return {
      basketPct: perf?.basketPct ?? null, benchmarkPct: perf?.benchmarkPct ?? null, per: perf?.per ?? {},
      series: withBars.length ? weightedSeries(withBars, Date.now() - 366 * 86_400_000, 24) : null,
      picks, buyPct: wavg("buyPct"), watchPct: wavg("watchPct"), passPct: wavg("passPct"),
    };
  });
}
