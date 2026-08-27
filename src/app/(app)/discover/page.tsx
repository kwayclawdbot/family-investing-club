import Link from "next/link";
import { getCompanies, getDiscover, getResearch } from "@/lib/data";
import { Card } from "@/components/ui";
import { CompanyList } from "@/components/markets/CompanyList";
import { QuickTiles } from "@/components/markets/QuickTiles";
import { DiscoverView } from "@/components/markets/DiscoverView";
import { KaiFab } from "@/components/shell/KaiFab";

/** Discover (was Markets): search → quick tiles → curated categories → companies you're learning about. */
export default async function DiscoverPage() {
  const [companies, categories, research] = await Promise.all([getCompanies(), getDiscover(), getResearch()]);
  const open = research.filter((r) => r.status === "open");
  return (
    <div className="pt-[14px] pb-6">
      <CompanyList
        companies={companies}
        tiles={
          <>
            <QuickTiles />
            {open.length > 0 && (
              <Link href="/discover/watchlist" className="block mt-3">
                <Card tone="green" className="flex items-center gap-3 !py-3">
                  <span className="text-[20px]" aria-hidden>🔍</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] font-extrabold text-green tracking-[0.3px]">RESEARCHING TOGETHER</span>
                    <span className="block text-[13px] font-black text-ink truncate">{open.map((r) => `${r.symbol} — ${r.assignee}`).join(" · ")}</span>
                  </span>
                  <span className="font-black text-green">›</span>
                </Card>
              </Link>
            )}
            <h2 className="mt-4 text-[15px] font-black text-ink">Start with what you understand</h2>
            <p className="text-[12px] font-bold text-ink-3">Every match says why.</p>
            <DiscoverView categories={categories} companies={companies} />
          </>
        }
      />
      <p className="mt-4 text-[11px] font-bold text-ink-4 text-center">Sample market data · prices are delayed for learning</p>
      <KaiFab context="discover" />
    </div>
  );
}
