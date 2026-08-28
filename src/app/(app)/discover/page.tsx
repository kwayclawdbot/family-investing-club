import { getCompanies, getSeries } from "@/lib/data-live";
import { DiscoverV13, type Quote } from "@/components/markets/v13/DiscoverV13";
import { discoverCards } from "@/lib/fixtures/v14-explore";

/** Discover — prototype v3: one ticker per card, themes behind the chips, screener behind ⚙︎. */
export default async function DiscoverPage() {
  const companies = await getCompanies();
  const quotes: Record<string, Quote | undefined> = Object.fromEntries(companies.map((c) => [c.symbol, { price: c.price, changePct: c.changePct }]));
  for (const c of discoverCards.filter((d) => d.metric === "ytd")) {
    try {
      const s = await getSeries(c.symbol, "YTD");
      const closes = s?.closes ?? [];
      if (closes.length > 1 && quotes[c.symbol]) quotes[c.symbol] = { ...quotes[c.symbol]!, ytdPct: ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100 };
    } catch { /* fixture fallback */ }
  }
  return <DiscoverV13 quotes={quotes} />;
}
