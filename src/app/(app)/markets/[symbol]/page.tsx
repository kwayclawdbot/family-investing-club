import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, getMetrics, getNews, getClubFeed, getWatchlist } from "@/lib/data";
import { Card, Tag } from "@/components/ui";
import { ChevronRight } from "@/components/ui/icons";
import { SearchField } from "@/components/markets/SearchField";
import { CompanyChart } from "@/components/markets/CompanyChart";
import { KeyMetrics } from "@/components/markets/KeyMetrics";
import { SymbolActions } from "@/components/markets/SymbolActions";
import { NewsRow } from "@/components/markets/NewsRow";
import { money, signed, pct } from "@/components/markets/format";
import { KaiFab } from "@/components/shell/KaiFab";

export default async function CompanyPage(props: PageProps<"/markets/[symbol]">) {
  const { symbol } = await props.params;
  const c = await getCompany(symbol);
  if (!c) notFound();
  const [metrics, news, feed, watchlist] = await Promise.all([getMetrics(c.symbol), getNews(), getClubFeed(), getWatchlist()]);
  const related = news.filter((n) => n.symbols.includes(c.symbol));
  const idea = feed.flatMap((p) => (p.kind === "idea" ? [p.idea] : [])).find((i) => i.companies.some((x) => x.symbol === c.symbol));
  const up = c.change >= 0;
  const firstName = c.name.split(" ")[0].replace(/,$/, "");

  return (
    <div className="pt-[14px] pb-6">
      <SearchField />

      <div className="flex items-start justify-between mt-4">
        <div>
          <h1 className="text-[22px] font-black text-ink">{c.name}</h1>
          <div className="text-[13px] font-extrabold text-ink-3">{c.symbol}</div>
        </div>
        <div className="w-[52px] h-[52px] rounded-[16px] border border-line flex items-center justify-center text-[8px] font-mono text-ink-5 [background:repeating-linear-gradient(45deg,#F0E6D0_0_7px,#F7EFDD_7px_14px)]">
          logo
        </div>
      </div>
      <div className="mt-1 text-[30px] font-black text-ink">${money(c.price)}</div>
      <div className={`text-[13.5px] font-extrabold ${up ? "text-[#3A8C4A]" : "text-red"}`}>
        {signed(c.change)} ({pct(c.changePct, 2).slice(1)}) today
      </div>

      <CompanyChart series={c.series} ranges={["1D", "1W", "1M", "3M", "1Y", "5Y"]} color={up ? "#4C8C4A" : "#C96A57"} />

      <SymbolActions symbol={c.symbol} name={c.name} baseWatchlist={watchlist} />

      <h2 className="mt-[16px] text-[15px] font-black text-ink">Understand {firstName}</h2>
      <Card className="mt-2 !py-1 !px-4">
        {c.understand.map((u, i) => (
          <Link
            key={u.q}
            href={`/kai?context=${encodeURIComponent(`symbol:${c.symbol}`)}&q=${encodeURIComponent(u.q)}`}
            className={`flex items-center gap-[10px] py-[11px] ${i < c.understand.length - 1 ? "border-b border-paper-2" : ""}`}
          >
            <span className="text-orange font-black">+</span>
            <span className="flex-1 text-[13.5px] font-extrabold text-ink">
              {u.q}
              {u.concept && <Tag tone="purple" className="ml-1 !rounded-[8px] !text-[10.5px]">{u.concept}</Tag>}
            </span>
          </Link>
        ))}
      </Card>

      <div className="flex items-center justify-between mt-4">
        <h2 className="text-[15px] font-black text-ink">Key metrics</h2>
        <span className="text-[11px] font-bold text-ink-4">Tap any to learn</span>
      </div>
      <KeyMetrics metrics={metrics} />

      <div className="flex items-center justify-between mt-4 mb-2">
        <h2 className="text-[15px] font-black text-ink">In the news</h2>
        <Link href="/markets/news" className="text-[12px] font-extrabold text-green">All news</Link>
      </div>
      <Card className="!py-1 !px-4">
        {related.length === 0 ? (
          <div className="py-5 text-center text-[12.5px] font-bold text-ink-3">No recent stories about {firstName}.</div>
        ) : (
          related.map((n, i) => <NewsRow key={n.id} n={n} last={i === related.length - 1} />)
        )}
      </Card>

      <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Community</h2>
      {idea ? (
        <Link href={`/club/idea/${idea.id}`} className="block">
          <Card tone="purple" className="flex items-center gap-3 !py-3">
            <span className="text-[20px]" aria-hidden>💡</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[10.5px] font-extrabold text-purple-2 tracking-[0.3px]">CLUB IDEA · {idea.status}</span>
              <span className="block text-[13.5px] font-black text-ink truncate">{idea.title}</span>
              <span className="block text-[11.5px] font-bold text-ink-3">{idea.author} · {idea.comments} comments</span>
            </span>
            <ChevronRight className="text-purple-2" />
          </Card>
        </Link>
      ) : (
        <Card className="!py-3 text-[12.5px] font-bold text-ink-3">No Club ideas mention this yet. <Link href="/club/new" className="text-green font-extrabold">Start one →</Link></Card>
      )}

      <p className="mt-4 text-[11px] font-bold text-ink-4 text-center">Sample market data · prices are delayed for learning</p>
      <KaiFab context={`symbol:${c.symbol}`} />
    </div>
  );
}
