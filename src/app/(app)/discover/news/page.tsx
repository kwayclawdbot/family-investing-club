import { getNews, getWatchlist, getPortfolio } from "@/lib/data";
import { NewsList } from "@/components/markets/NewsList";

export default async function NewsPage() {
  const [news, watchlist, portfolio] = await Promise.all([getNews(), getWatchlist(), getPortfolio()]);
  return (
    <div className="pt-[14px] pb-6">
      <NewsList news={news} baseWatchlist={watchlist} holdings={portfolio.holdings} />
      <p className="mt-4 text-[11px] font-bold text-ink-4 text-center">Fewer headlines, more “why this matters” · sample stories for learning</p>
    </div>
  );
}
