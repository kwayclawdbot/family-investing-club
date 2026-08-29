import "server-only";
import type { NewsItem } from "@/lib/types";
import * as mkt from "@/lib/market";
import { getClubPortfolio, getResearch } from "./club";
import { getNews } from "./news";
import { getWatchlist } from "./watchlist";
import { safe } from "./supa";

/**
 * News, for this member. Three tabs, three real sources:
 *   mine    — Polygon stories for what they watch and hold
 *   club    — Polygon stories for the club's holdings and open research
 *   markets — `news_articles`, the FIC desk wrap the nightly crons write
 *
 * "Why this matters" is a fact about the reader's own position ("your club holds 12%"), never an
 * invented take; where there's no position, the honest framing template from the market layer is used.
 */
export type NewsTab = "mine" | "club" | "markets";
export type NewsCard = NewsItem & { why: string | null; whyTone: "green" | "neutral" };
export type NewsFeed = { mine: NewsCard[]; club: NewsCard[]; markets: NewsCard[]; symbols: string[] };

/** Polygon news is one request per symbol (cached 30 min) on a 5/min key — keep the fan-out small. */
const MAX_SYMBOLS = 3;

export async function getNewsFeed(): Promise<NewsFeed | null> {
  return safe("news.feed", async () => {
    const [port, research, watch, desk] = await Promise.all([getClubPortfolio(), getResearch(), getWatchlist(), getNews()]);
    const holdings = new Map((port?.holdings ?? []).map((h) => [h.symbol.toUpperCase(), h]));
    const watched = new Set((watch ?? []).map((w) => w.symbol.toUpperCase()));

    const mineSyms = [...watched].slice(0, MAX_SYMBOLS);
    const clubSyms = [...new Set([...holdings.keys(), ...(research ?? []).filter((r) => r.status === "open").map((r) => r.symbol.toUpperCase())])].slice(0, MAX_SYMBOLS);
    const [mineRaw, clubRaw] = await Promise.all([
      mineSyms.length ? mkt.newsFor(mineSyms, 3) : Promise.resolve([]),
      clubSyms.length ? mkt.newsFor(clubSyms, 3) : Promise.resolve([]),
    ]);

    const decorate = (n: NewsItem): NewsCard => {
      const held = n.symbols.map((s) => holdings.get(s.toUpperCase())).find(Boolean);
      if (held) return { ...n, why: `Your club holds ${Math.round(held.weightPct)}% ${held.symbol}${held.origin ? ` — ${held.origin}` : ""}.`, whyTone: "green" };
      const onList = n.symbols.find((s) => watched.has(s.toUpperCase()));
      if (onList) return { ...n, why: `${onList} is on your watchlist.`, whyTone: "green" };
      return { ...n, why: n.whyItMatters || null, whyTone: "neutral" };
    };

    return {
      mine: (mineRaw ?? []).map(decorate).slice(0, 12),
      club: (clubRaw ?? []).map(decorate).slice(0, 12),
      markets: (desk ?? []).map(decorate).slice(0, 12),
      symbols: [...new Set([...mineSyms, ...clubSyms])],
    };
  });
}
