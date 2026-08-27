import { getCompanies, getDiscover } from "@/lib/data-live";
import { discoverStream } from "@/lib/fixtures/v12-explore";
import { DiscoverStream } from "@/components/markets/v12/DiscoverStream";
import { SearchField } from "@/components/markets/SearchField";
import { DiscoverView } from "@/components/markets/DiscoverView";

/** Discover — "What should I explore?" (v12): search + one visual stream; the screener lives behind Filters. */
export default async function DiscoverPage() {
  const [companies, categories] = await Promise.all([getCompanies(), getDiscover()]);
  const quotes = Object.fromEntries(companies.map((c) => [c.symbol, { price: c.price, changePct: c.changePct, series: c.series?.["1M"] ?? c.series?.["1W"] }]));
  return (
    <div className="pt-[14px] pb-6">
      <h1 className="text-[21px] font-black text-ink mb-3">Discover</h1>
      <SearchField placeholder="Stocks, ETFs, ideas, people…" />
      <DiscoverStream items={discoverStream} quotes={quotes} filters={<DiscoverView categories={categories} companies={companies} />} />
    </div>
  );
}
