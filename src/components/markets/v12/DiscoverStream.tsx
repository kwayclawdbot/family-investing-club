"use client";
import Link from "next/link";
import { useState } from "react";
import type { DiscoverItem } from "@/lib/fixtures/v12-explore";
import { Sheet } from "@/components/ui/extras";
import { Ticker, Person } from "./bits";
import { pct } from "@/components/markets/format";
import { Sparkline } from "@/components/markets/LineChart";

type Quote = { price: number; changePct: number; series?: number[] };
const CHIPS = ["For You", "Trending", "Stocks", "People"] as const;
export function DiscoverStream({ items, quotes, filters }: { items: DiscoverItem[]; quotes: Record<string, Quote>; filters: React.ReactNode }) {
  const [chip, setChip] = useState<(typeof CHIPS)[number]>("For You");
  const [open, setOpen] = useState(false);
  const shown = items.filter((it) => chip === "For You" || (chip === "Stocks" && it.kind === "stock") || (chip === "People" && it.kind === "person") || (chip === "Trending" && (it.kind === "theme" || it.kind === "circle" || it.kind === "stock")));
  return (
    <>
      <div className="flex gap-[6px] mt-3 mb-3">{CHIPS.map((c) => <button key={c} onClick={() => setChip(c)} className={`h-[30px] px-[13px] rounded-[16px] text-[11px] font-black ${chip === c ? "bg-ink text-cream-text" : "bg-card border border-line text-ink-3"}`}>{c}</button>)}</div>
      <div className="flex flex-col gap-[9px]">
        {shown.map((it, i) => {
          if (it.kind === "stock") { const q = quotes[it.symbol]; return (
            <Link key={i} href={`/discover/${it.symbol}`} className="bg-card border border-line rounded-[15px] px-[13px] py-[11px] flex items-center gap-[11px]">
              <Ticker symbol={it.symbol} tone={it.tone === "gold" ? "gold" : "green"} />
              <div className="flex-1 min-w-0"><div className="text-[13.5px] font-black text-ink">{it.name}</div><div className="text-[10.5px] font-bold text-ink-3 truncate">{it.social}</div></div>
              {q?.series && <Sparkline data={q.series} width={46} height={18} color={q.changePct >= 0 ? "#3A8C4A" : "#C96A57"} />}
              <span className={`text-[11px] font-black ${q && q.changePct < 0 ? "text-red" : "text-[#3A8C4A]"}`}>{q ? pct(q.changePct) : "—"}</span>
            </Link>); }
          if (it.kind === "theme") return (
            <Link key={i} href="/club/idea/nuclear-next-decade" className="rounded-[15px] border border-orange-line px-[13px] py-[11px]" style={{ background: "linear-gradient(105deg,#FBEDD9,#FDF4E6)" }}>
              <div className="flex justify-between"><span className="text-[10px] font-black text-orange-2">THEME · TRENDING ACROSS FIC</span><span className="text-[9.5px] font-bold text-ink-3">{it.researching}</span></div>
              <div className="text-[14.5px] font-black text-ink mt-[2px]">{it.title}</div>
              <div className="flex gap-[6px] mt-2">{it.symbols.map((s) => <span key={s} className="rounded-[8px] bg-[#FFFDF7] text-green px-[8px] py-[3px] text-[10px] font-black">{s}</span>)}</div>
            </Link>);
          if (it.kind === "person") return <Person key={i} {...it} action="Follow" href={`/club/members/${it.id}`} />;
          return (
            <div key={i} className="bg-card border border-line rounded-[15px] px-[13px] py-[11px] flex items-center gap-[11px]">
              <span className="w-9 h-9 rounded-[12px] bg-purple-tint flex items-center justify-center text-[16px]">{it.emoji}</span>
              <div className="flex-1 min-w-0"><div className="text-[13.5px] font-black text-ink">{it.name}</div><div className="text-[10.5px] font-bold text-orange-2">{it.line}</div></div>
              <Link href={`/circle/${it.id}`} className="rounded-[10px] bg-green-2 text-cream-text px-3 py-[6px] text-[10px] font-black">Join</Link>
            </div>);
        })}
      </div>
      <p className="mt-4 text-center text-[10px] font-bold text-ink-4">Everything taps into its canonical page · screener lives behind <button className="underline" onClick={() => setOpen(true)}>Filters</button></p>
      <Sheet open={open} onClose={() => setOpen(false)} title="Filters">{filters}</Sheet>
    </>
  );
}
