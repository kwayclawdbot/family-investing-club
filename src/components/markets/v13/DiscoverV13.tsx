import Link from "next/link";
import { Logo, Pct, Label } from "./bits";
import { popularFamilies, mostOwned, mostDiscussed, topIdea, earningsWeek } from "@/lib/fixtures/v13-discover";
import { SearchField } from "@/components/markets/SearchField";

export type Quote = { price: number; changePct: number };
const card = "bg-card border border-line rounded-[15px] px-[14px] py-[11px]";

/** Discover — prototype v2 `discover`: signals first, screener behind 🔬. */
export function DiscoverV13({ quotes }: { quotes: Record<string, Quote | undefined> }) {
  return (
    <div className="pt-[14px] pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[21px] font-black text-ink">Discover</h1>
        <Link href="/screener" className="inline-flex items-center gap-[6px] rounded-[12px] bg-ink text-cream-text px-[13px] py-[7px] text-[11px] font-black">🔬 Screener</Link>
      </div>
      <div className="mt-[9px]"><SearchField placeholder="Stocks, ETFs, ideas, people…" /></div>

      <div className={`mt-[10px] ${card}`}>
        <div className="text-[10px] font-black text-orange">👨‍👩‍👧‍👦 POPULAR WITH FAMILIES LIKE YOURS</div>
        {popularFamilies.map((p, i) => {
          const q = quotes[p.symbol];
          return (
            <Link key={p.symbol} href={`/discover/${p.symbol}`} className={`flex items-center gap-[10px] py-2 ${i < popularFamilies.length - 1 ? "border-b border-paper-2" : ""}`}>
              <Logo symbol={p.symbol} />
              <div className="flex-1 min-w-0"><div className="text-[12px] font-black text-ink">{p.name}</div><div className="text-[9px] font-bold text-ink-3 truncate">{p.line}</div></div>
              {q && <span className="text-right"><div className="text-[11px] font-black text-ink">${q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div><Pct v={q.changePct} className="text-[9px]" /></span>}
              <span className="text-ink-4 font-black">›</span>
            </Link>
          );
        })}
      </div>

      <Link href="/theme/nuclear-energy" className="block mt-[9px] rounded-[15px] border border-orange-line px-[14px] py-[11px]" style={{ background: "linear-gradient(105deg,#FBEDD9,#FDF4E6)" }}>
        <div className="flex justify-between"><span className="text-[9.5px] font-black text-orange-2">THEME · TRENDING ACROSS FIC</span><span className="text-[9px] font-extrabold text-ink-3">1.2K researching</span></div>
        <div className="text-[14px] font-black text-ink mt-[2px]">Nuclear Energy <span className="text-[10px] font-extrabold text-ink-3">CEG · VST · CCJ</span></div>
      </Link>

      <div className="flex gap-[9px] mt-[9px]">
        <Link href="/profile/portfolio" className="flex-1 bg-card border border-line rounded-[14px] px-3 py-[10px]">
          <div className="text-[9px] font-black text-purple-2">✓ MOST OWNED · VERIFIED</div>
          <div className="flex items-center gap-[5px] mt-[6px]">{mostOwned.symbols.map((s) => <Logo key={s} symbol={s} size={26} radius={8} />)}<span className="text-[9px] font-extrabold text-ink-4 ml-[2px]">+{mostOwned.more}</span></div>
        </Link>
        <Link href="/home" className="flex-1 bg-card border border-line rounded-[14px] px-3 py-[10px]">
          <div className="text-[9px] font-black text-orange-2">💬 MOST DISCUSSED</div>
          <div className="flex items-center gap-[5px] mt-[6px]">{mostDiscussed.symbols.map((s) => <Logo key={s} symbol={s} size={26} radius={8} />)}<span className="text-[9px] font-extrabold text-ink-4 ml-[2px]">+{mostDiscussed.more}</span></div>
        </Link>
      </div>

      <Link href={`/theme/${topIdea.id}`} className={`block mt-[9px] ${card}`}>
        <div className="flex justify-between"><span className="text-[9.5px] font-black text-purple-2">💡 TOP INVESTMENT IDEA</span><span className="text-[9px] font-extrabold text-ink-3">{topIdea.following} following</span></div>
        <div className="text-[13.5px] font-black text-ink mt-[3px]">{topIdea.title}</div>
        <div className="flex items-center gap-[5px] mt-[6px]">{topIdea.symbols.map((s) => <Logo key={s} symbol={s} size={24} radius={7} />)}<span className="text-[9px] font-extrabold text-ink-3 ml-[3px]">{topIdea.line}</span></div>
      </Link>

      <div className={`mt-[9px] ${card}`}>
        <div className="flex justify-between"><span className="text-[9.5px] font-black text-orange-2">📅 EARNINGS THIS WEEK</span><span className="text-[9px] font-extrabold text-ink-3">from your world</span></div>
        <div className="flex gap-2 mt-2">
          {earningsWeek.map((e) => (
            <Link key={e.symbol} href={`/discover/${e.symbol}`} className="flex-1 bg-paper rounded-[11px] p-2 text-center flex flex-col items-center">
              <Logo symbol={e.symbol} size={24} radius={7} />
              <div className="text-[9px] font-black text-ink mt-1">{e.when}</div>
              <div className="text-[7.5px] font-extrabold text-ink-3">{e.note}</div>
            </Link>
          ))}
        </div>
      </div>

      <Link href="/discover/news" className={`mt-[9px] flex items-center gap-[10px] ${card}`}>
        <span className="text-[15px]">📰</span>
        <span className="flex-1 text-[11.5px] font-extrabold text-ink">Today&apos;s market news — with &quot;why this matters&quot;</span>
        <span className="text-ink-4 font-black">›</span>
      </Link>
      <p className="mt-2 text-center text-[10px] font-bold text-ink-4">Signals from picks, research &amp; verified holdings · never advice</p>
      <Label className="sr-only">Discover</Label>
    </div>
  );
}
