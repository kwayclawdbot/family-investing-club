import { getNews, getWatchlist } from "@/lib/data";
import { TopBar } from "@/components/shell/TopBar";
import { NewsList } from "@/components/markets/NewsList";

export default async function NewsPage() {
  const [news, watchlist] = await Promise.all([getNews(), getWatchlist()]);
  return (
    <div className="-mx-[18px] pb-6">
      <TopBar backHref="/discover" title="News" />
      <div className="px-[18px]">
        <p className="text-[12.5px] font-bold text-ink-3">Fewer headlines, more “why this matters”.</p>
        <NewsList news={news} baseWatchlist={watchlist} />
      </div>
    </div>
  );
}
