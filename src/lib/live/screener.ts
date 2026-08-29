import "server-only";
import { cache } from "react";
import { SECTORS, sectorOf, type Sector } from "@/lib/server/shared/screener-sectors";
import { adminClient, must, safe, userClient } from "./supa";

/**
 * The screener over the real universe: `screener_metrics` is ~11.7k US common stocks and ETFs,
 * recomputed nightly by `/api/cron/refresh-screener` from one grouped-daily Polygon call. It was
 * showing eight hand-written rows.
 *
 * Filtering and sorting happen in Postgres — the page never loads 11.7k rows — and every filter maps
 * to a column that actually exists. "P/E under 40" and "60% of FIC says buy" were not among them:
 * the first isn't in this table, the second is now a real count of FIC picks.
 */
export type ScreenerSort = "chg_1m" | "chg_3m" | "chg_1d" | "mcap";
export type CapTier = "any" | "mega" | "large" | "mid" | "small";
export type ScreenerFilters = {
  sector?: Sector | null; cap?: CapTier; kind?: "any" | "common" | "etf";
  up1m?: boolean; aboveEma50?: boolean; ficOwned?: boolean; q?: string; sort?: ScreenerSort; limit?: number;
  /** Off by default: include sub-$1, barely-traded listings. Sorting the raw universe by 1-month move
   *  otherwise leads with +30,000% microcaps — real rows, but not what a family club should see first. */
  includeIlliquid?: boolean;
};
export type ScreenerHit = {
  ticker: string; name: string; sector: Sector | null; type: "common" | "etf" | null;
  mcap: number | null; price: number | null; chg1d: number | null; chg1m: number | null; chg3m: number | null;
  aboveEma50: boolean; ficPicks: number;
};
export type ScreenerResult = {
  rows: ScreenerHit[]; matched: number; universe: number; asOf: string | null; sectors: Sector[];
  /** How much of the universe carries each nightly-enriched column — market cap and sector are filled
   *  by a round-robin, so a filter on them can legitimately match almost nothing early on. */
  coverage: { mcap: number; sector: number };
};

export const MIN_PRICE = 1;
export const MIN_AVG_VOL = 100_000;
/** A 21-day move this large is virtually always a split, a reverse split or a days-old listing whose
 *  history is too short to measure — not a return. Excluded from the default view. */
export const MAX_PLAUSIBLE_MOVE = 300;

const CAP_FLOOR: Record<Exclude<CapTier, "any">, number> = { mega: 200e9, large: 10e9, mid: 2e9, small: 0 };
const CAP_CEIL: Partial<Record<Exclude<CapTier, "any">, number>> = { large: 200e9, mid: 10e9, small: 2e9 };

/** The raw SIC strings that map to each canonical sector — the table stores SIC, the UI shows sectors. */
const sicIndex = cache(async (): Promise<Map<Sector, string[]>> => {
  const supa = await userClient();
  const rows = ((await supa.from("screener_metrics").select("sector").not("sector", "is", null).limit(20_000)).data ?? []) as { sector: string }[];
  const out = new Map<Sector, string[]>();
  for (const raw of new Set(rows.map((r) => r.sector))) {
    const s = sectorOf(raw);
    if (s) out.set(s, [...(out.get(s) ?? []), raw]);
  }
  return out;
});

/** Symbols FIC clubs have actually picked, with how many picks — a real "owned by clubs like mine". */
const ficPickCounts = cache(async (): Promise<Map<string, number>> => {
  const supa = adminClient();
  if (!supa) return new Map();
  const rows = ((await supa.from("fic_club_picks").select("symbol")).data ?? []) as { symbol: string }[];
  const out = new Map<string, number>();
  for (const r of rows) out.set(r.symbol.toUpperCase(), (out.get(r.symbol.toUpperCase()) ?? 0) + 1);
  return out;
});

export async function getScreener(f: ScreenerFilters = {}): Promise<ScreenerResult | null> {
  return safe("screener.get", async () => {
    const supa = await userClient();
    const sort = f.sort ?? "chg_1m";
    const limit = Math.min(100, f.limit ?? 40);
    const [index, picks, total, mcapCount, sectorCount] = await Promise.all([
      sicIndex(), ficPickCounts(),
      supa.from("screener_metrics").select("ticker", { count: "exact", head: true }),
      supa.from("screener_metrics").select("ticker", { count: "exact", head: true }).not("mcap", "is", null),
      supa.from("screener_metrics").select("ticker", { count: "exact", head: true }).not("sector", "is", null),
    ]);

    const COLS = "ticker, name, sector, type, mcap, price, chg_1d, chg_1m, chg_3m, ema50_state, updated_at";
    /** Same predicate applied to the count query and the page query. */
    type Q = { not: (c: string, op: string, v: unknown) => Q; eq: (c: string, v: unknown) => Q; in: (c: string, v: unknown[]) => Q; gte: (c: string, v: unknown) => Q; lt: (c: string, v: unknown) => Q; gt: (c: string, v: unknown) => Q; or: (s: string) => Q };
    const where = <T>(query: T): T => {
      let q = query as unknown as Q;
      q = q.not("price", "is", null);
      if (!f.includeIlliquid) {
        q = q.gte("price", MIN_PRICE);
        q = q.gte("avg_vol_20", MIN_AVG_VOL);
        q = q.lt("chg_1m", MAX_PLAUSIBLE_MOVE);
        q = q.gt("chg_1m", -MAX_PLAUSIBLE_MOVE);
      }
      if (f.kind && f.kind !== "any") q = q.eq("type", f.kind);
      if (f.sector) q = q.in("sector", (index.get(f.sector) ?? ["__none__"]));
      if (f.cap && f.cap !== "any") {
        q = q.gte("mcap", CAP_FLOOR[f.cap]);
        const ceil = CAP_CEIL[f.cap];
        if (ceil) q = q.lt("mcap", ceil);
      }
      if (f.up1m) q = q.gt("chg_1m", 0);
      if (f.aboveEma50) q = q.eq("ema50_state", "above");
      if (f.ficOwned) q = q.in("ticker", [...picks.keys(), "__none__"].slice(0, 500));
      const s = f.q?.trim().replace(/[%,()]/g, "");
      if (s) q = q.or(`ticker.ilike.%${s}%,name.ilike.%${s}%`);
      return q as unknown as T;
    };

    const [countRes, rowsRes] = await Promise.all([
      where(supa.from("screener_metrics").select("ticker", { count: "exact", head: true })),
      where(supa.from("screener_metrics").select(COLS)).order(sort, { ascending: false, nullsFirst: false }).limit(limit),
    ]);
    const rows = must(rowsRes) as unknown as { ticker: string; name: string | null; sector: string | null; type: "common" | "etf" | null; mcap: number | null; price: number | null; chg_1d: number | null; chg_1m: number | null; chg_3m: number | null; ema50_state: string | null; updated_at: string | null }[];
    // `screener_metrics.chg_*` is already a percentage (see shared/screener.ts `pctChange`).
    const pct = (n: number | null) => (n === null ? null : +n.toFixed(2));
    return {
      rows: rows.map((r) => ({
        ticker: r.ticker, name: r.name ?? r.ticker, sector: sectorOf(r.sector), type: r.type,
        mcap: r.mcap, price: r.price, chg1d: pct(r.chg_1d), chg1m: pct(r.chg_1m), chg3m: pct(r.chg_3m),
        aboveEma50: r.ema50_state === "above", ficPicks: picks.get(r.ticker.toUpperCase()) ?? 0,
      })),
      matched: countRes.count ?? rows.length,
      universe: total.count ?? 0,
      asOf: rows[0]?.updated_at ?? null,
      sectors: SECTORS.filter((s) => index.has(s)),
      coverage: { mcap: mcapCount.count ?? 0, sector: sectorCount.count ?? 0 },
    };
  });
}
