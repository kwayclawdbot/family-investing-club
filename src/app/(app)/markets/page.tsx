import Link from "next/link";
import { getCompanies, getPortfolio } from "@/lib/data";
import { Card } from "@/components/ui";
import { ChevronRight } from "@/components/ui/icons";
import { CompanyList } from "@/components/markets/CompanyList";
import { QuickTiles } from "@/components/markets/QuickTiles";
import { Sparkline } from "@/components/markets/LineChart";
import { money, signed, pct } from "@/components/markets/format";
import { KaiFab } from "@/components/shell/KaiFab";

export default async function MarketsPage() {
  const [companies, portfolio] = await Promise.all([getCompanies(), getPortfolio()]);
  return (
    <div className="pt-[14px] pb-6">
      <CompanyList companies={companies} tiles={<QuickTiles />} />

      <div className="flex items-center justify-between mt-4 mb-2">
        <h2 className="text-[15px] font-black text-ink">Practice Portfolio</h2>
        <Link href="/practice" className="text-[12px] font-extrabold text-green">Open</Link>
      </div>
      <Link href="/practice" className="block">
        <Card className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[11.5px] font-extrabold text-ink-3">Total Value · virtual money</div>
            <div className="text-[19px] font-black text-ink mt-[2px]">${money(portfolio.totalValue)}</div>
            <div className="text-[11.5px] font-extrabold text-[#3A8C4A]">
              {signed(portfolio.dayChange).replace(/^([+−])/, "$1$")} ({pct(portfolio.dayChangePct, 2).slice(1)})
            </div>
          </div>
          <Sparkline data={portfolio.series} color="#E58234" width={80} height={36} />
          <ChevronRight className="text-ink-4" />
        </Card>
      </Link>

      <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Market Lesson of the Day</h2>
      <Card tone="green" className="!p-4">
        <div className="text-[11.5px] font-extrabold text-green tracking-[0.3px]">NVDA · +4.2% TODAY</div>
        <div className="mt-1 text-[19px] font-black text-ink leading-[1.25]">Why is NVIDIA up 4.2% today?</div>
        <div className="mt-1 text-[12.5px] font-bold text-ink-3">Learn 3 key concepts in under 5 minutes.</div>
        <div className="mt-3 flex items-center gap-3">
          <Link href="/markets/NVDA" className="inline-flex items-center h-[36px] px-4 rounded-[12px] bg-green text-cream-text text-[13px] font-black">Start Lesson</Link>
          <Link href="/kai?context=symbol:NVDA&q=Why%20did%20NVIDIA%20go%20up%20today%3F" className="text-[12px] font-extrabold text-green">Ask Kai →</Link>
        </div>
      </Card>

      <p className="mt-4 text-[11px] font-bold text-ink-4 text-center">Sample market data · prices are delayed for learning</p>
      <KaiFab context="markets" />
    </div>
  );
}
