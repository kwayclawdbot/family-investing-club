import { Screener } from "@/components/markets/v13/Screener";
import { getScreener, type CapTier, type ScreenerSort } from "@/lib/live/screener";
import { SECTORS, type Sector } from "@/lib/server/shared/screener-sectors";

/** Screener — filters live in the URL so Postgres does the filtering over the full universe. */
export default async function ScreenerPage(props: PageProps<"/screener">) {
  const sp = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const filters = { sector: one(sp.sector), cap: one(sp.cap), sort: one(sp.sort), q: one(sp.q), kind: one(sp.kind), up1m: one(sp.up1m), ema50: one(sp.ema50), fic: one(sp.fic), all: one(sp.all) };
  const result = await getScreener({
    sector: (SECTORS as readonly string[]).includes(filters.sector) ? (filters.sector as Sector) : null,
    cap: (["mega", "large", "mid", "small"].includes(filters.cap) ? filters.cap : "any") as CapTier,
    kind: filters.kind === "etf" || filters.kind === "common" ? filters.kind : "any",
    sort: (["chg_1m", "chg_3m", "chg_1d", "mcap"].includes(filters.sort) ? filters.sort : "chg_1m") as ScreenerSort,
    up1m: filters.up1m === "1", aboveEma50: filters.ema50 === "1", ficOwned: filters.fic === "1", q: filters.q,
    includeIlliquid: filters.all === "1",
  });
  return <Screener result={result} filters={filters} />;
}
