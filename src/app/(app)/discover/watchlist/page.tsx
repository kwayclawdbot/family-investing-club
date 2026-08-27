import { getWatchlist, getCompanies } from "@/lib/data";
import { TopBar } from "@/components/shell/TopBar";
import { WatchlistView } from "@/components/markets/WatchlistView";

export default async function WatchlistPage() {
  const [base, companies] = await Promise.all([getWatchlist(), getCompanies()]);
  return (
    <div className="-mx-[18px] pb-6">
      <TopBar backHref="/discover" title="Watchlist" />
      <div className="px-[18px]">
        <p className="text-[12.5px] font-bold text-ink-3">Research lists, not trade lists — every pick carries a reason.</p>
        <WatchlistView base={base} companies={companies} />
      </div>
    </div>
  );
}
