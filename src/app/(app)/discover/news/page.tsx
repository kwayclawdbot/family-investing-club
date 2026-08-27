import { getNews, getCompanies } from "@/lib/data-live";
import { newsItems } from "@/lib/fixtures/v13-discover";
import { NewsV13 } from "@/components/markets/v13/NewsV13";

/** News — prototype v2: My companies · Club · Markets, every story with "why this matters". */
export default async function NewsPage() {
  const [live, companies] = await Promise.all([getNews(), getCompanies()]);
  const quotes = Object.fromEntries(companies.map((c) => [c.symbol, { changePct: c.changePct }]));
  const fixtureHeads = new Set(newsItems.map((n) => n.headline.toLowerCase()));
  const extra = live.filter((n) => n.url && !fixtureHeads.has(n.headline.toLowerCase()));
  return <NewsV13 items={newsItems} live={extra} quotes={quotes} />;
}
