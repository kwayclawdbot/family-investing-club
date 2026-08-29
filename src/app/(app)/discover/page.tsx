import { getCompanies } from "@/lib/data-live";
import { DiscoverV13, type Quote } from "@/components/markets/v13/DiscoverV13";
import { getDiscoverCards, getThemePerformance } from "@/lib/live/discover";
import { THEMES } from "@/lib/content/themes";

/** Discover — one ticker per card, each card a row somebody in the club actually wrote. */
export default async function DiscoverPage() {
  const cards = (await getDiscoverCards()) ?? [];
  const companies = await getCompanies(cards.map((c) => c.symbol));
  const quotes: Record<string, Quote | undefined> = Object.fromEntries(companies.map((c) => [c.symbol, { price: c.price, changePct: c.changePct }]));

  // The banner is whichever curated theme's basket is actually ahead over the last year.
  const themes = Object.values(THEMES);
  // Cache-only: the banner is a nicety and must never spend the minute-budget the cards need.
  const perf = await Promise.all(themes.map((t) => getThemePerformance(t.companies.map((c) => c.symbol), 12, { spend: 0 })));
  const ranked = themes
    .map((t, i) => ({ t, p: perf[i] }))
    .filter((x) => x.p?.basketPct !== null && x.p?.basketPct !== undefined)
    .sort((a, b) => b.p!.basketPct! - a.p!.basketPct!)[0];
  const trending = ranked
    ? { id: ranked.t.id, emoji: ranked.t.emoji, title: ranked.t.name, sub: `basket ${ranked.p!.basketPct! >= 0 ? "+" : "−"}${Math.abs(ranked.p!.basketPct!).toFixed(1)}% 1Y · ${ranked.t.companies.length} companies` }
    : null;

  return <DiscoverV13 quotes={quotes} cards={cards} trending={trending} />;
}
