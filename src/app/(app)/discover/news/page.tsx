import { getCompanies } from "@/lib/data-live";
import { getNewsFeed } from "@/lib/live/newsfeed";
import { NewsV13 } from "@/components/markets/v13/NewsV13";

/** News — real stories for what this member watches, what the club holds, and the FIC desk wrap. */
export default async function NewsPage() {
  const feed = await getNewsFeed();
  const companies = await getCompanies(feed?.symbols ?? []);
  const quotes = Object.fromEntries(companies.map((c) => [c.symbol, { changePct: c.changePct }]));
  return <NewsV13 feed={feed} quotes={quotes} />;
}
