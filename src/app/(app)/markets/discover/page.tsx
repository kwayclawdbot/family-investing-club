import { getDiscover, getCompanies } from "@/lib/data";
import { TopBar } from "@/components/shell/TopBar";
import { DiscoverView } from "@/components/markets/DiscoverView";

export default async function DiscoverPage() {
  const [categories, companies] = await Promise.all([getDiscover(), getCompanies()]);
  return (
    <div className="-mx-[18px] pb-6">
      <TopBar backHref="/markets" title="Discover" />
      <div className="px-[18px]">
        <p className="text-[12.5px] font-bold text-ink-3">Start with what you understand. Every match says why.</p>
        <DiscoverView categories={categories} companies={companies} />
      </div>
    </div>
  );
}
