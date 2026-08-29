"use client";
import Link from "next/link";
import { useState } from "react";
import { brandOf } from "@/lib/content/brands";
import type { DiscoverCard } from "@/lib/live/discover";

export type Quote = { price: number; changePct: number; ytdPct?: number };
const TONE = { green: "bg-green-tint text-green", orange: "bg-orange-tint text-orange-2", gold: "bg-[#FFFDF4] text-[#BC9227]", purple: "bg-purple-tint text-purple-2" };
const CHIPS = ["For You", "Trending", "Themes"] as const;

function Spark({ up }: { up: boolean }) {
  const d = up ? "M2 22 L14 18 L24 20 L34 12 L44 14 L54 6" : "M2 8 L14 12 L24 10 L34 16 L44 15 L54 22";
  return <svg width="56" height="26" viewBox="0 0 56 26" aria-hidden><path d={d} fill="none" stroke={up ? "#4C8C4A" : "#C96A57"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Card({ c, q }: { c: DiscoverCard; q?: Quote }) {
  const pct = c.metric === "ytd" ? q?.ytdPct : q?.changePct;
  const up = (pct ?? 0) >= 0;
  return (
    <Link href={c.href} className="flex-1 min-w-0 h-[158px] bg-card border border-line rounded-[18px] px-[13px] pt-[13px] pb-[11px] flex flex-col gap-[7px]">
      <div className="flex items-start justify-between">
        <span className="w-11 h-11 rounded-[13px] flex items-center justify-center text-[11px] font-black text-white tracking-[-0.3px] shadow-[0_3px_8px_rgba(46,42,33,0.28)] shrink-0" style={{ background: brandOf(c.symbol) }}>{c.symbol}</span>
        <span className={`rounded-[7px] px-[7px] py-[2px] text-[7.5px] font-black text-right leading-[1.2] whitespace-pre-line ${TONE[c.tone]}`}>{c.tag}</span>
      </div>
      <div>
        <div className="text-[14px] font-black text-ink">{c.name}</div>
        <div className="text-[9.5px] font-bold text-ink-3 leading-[1.35] mt-[2px]">{c.story}</div>
      </div>
      <div className="mt-auto flex items-end justify-between">
        <span className={`text-[12.5px] font-black ${pct === undefined ? "text-ink-4" : up ? "text-green-2" : "text-red"}`}>{pct === undefined ? "—" : `${up ? "+" : "−"}${Math.abs(pct).toFixed(1)}% ${c.metric === "ytd" ? "YTD" : "today"}`}</span>
        {pct !== undefined && <Spark up={up} />}
      </div>
    </Link>
  );
}

/** Discover — prototype v3 `discover`: one ticker per card · tap for the full company page. */
export function DiscoverV13({ quotes, cards: all, trending }: { quotes: Record<string, Quote | undefined>; cards: DiscoverCard[]; trending: { id: string; emoji: string; title: string; sub: string } | null }) {
  const [chip, setChip] = useState<(typeof CHIPS)[number]>("For You");
  const cards = chip === "Themes" ? all.filter((c) => c.kind === "theme") : chip === "Trending" ? [...all].sort((a, b) => Math.abs(quotes[b.symbol]?.changePct ?? 0) - Math.abs(quotes[a.symbol]?.changePct ?? 0)) : all;
  const rows: DiscoverCard[][] = [];
  for (let i = 0; i < cards.length; i += 2) rows.push(cards.slice(i, i + 2));
  return (
    <div className="pt-[14px] pb-6">
      <h1 className="text-[21px] font-black text-ink">Discover</h1>
      <Link href="/screener" className="mt-[9px] flex items-center gap-[9px] bg-card border border-line rounded-[13px] px-[13px] py-[10px]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A89F8D" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <span className="text-[12.5px] font-bold text-ink-4">Search stocks, ETFs, themes…</span>
      </Link>
      <div className="flex items-center gap-[6px] mt-[9px]" role="tablist">
        {CHIPS.map((c) => (
          <button key={c} role="tab" aria-selected={chip === c} onClick={() => setChip(c)} className={`rounded-[15px] px-[13px] py-[5px] text-[10.5px] ${chip === c ? "bg-ink text-cream-text font-black" : "bg-card border border-line text-ink-3 font-extrabold"}`}>{c}</button>
        ))}
        <Link href="/screener" className="ml-auto rounded-[15px] bg-card border border-line text-ink-2 px-[11px] py-[5px] text-[10.5px] font-black">⚙︎ Screener</Link>
      </div>
      {rows.map((r, i) => (
        <div key={i} className={`flex gap-[9px] ${i === 0 ? "mt-[11px]" : "mt-[9px]"}`}>
          {r.map((c) => <Card key={c.symbol} c={c} q={quotes[c.symbol]} />)}
          {r.length === 1 && <div className="flex-1" />}
        </div>
      ))}
      {!cards.length && <p className="mt-6 rounded-[16px] border border-line bg-card px-5 py-8 text-center text-[12px] font-bold text-ink-3">Nothing to show yet — add a company to your watchlist or make a pick.</p>}
      {trending && (
        <Link href={`/theme/${trending.id}`} className="mt-[11px] rounded-[18px] px-4 py-[14px] flex items-center gap-[13px]" style={{ background: "linear-gradient(120deg,#E9C46A,#E58234)" }}>
          <span className="w-[46px] h-[46px] rounded-[15px] bg-[rgba(255,253,247,0.25)] flex items-center justify-center text-[22px] shrink-0">{trending.emoji}</span>
          <div className="flex-1">
            <div className="text-[8.5px] font-black text-[rgba(255,253,247,0.85)]">THEME · BEST BASKET THIS YEAR</div>
            <div className="text-[15px] font-black text-cream-text">{trending.title}</div>
            <div className="text-[9.5px] font-extrabold text-[rgba(255,253,247,0.9)]">{trending.sub}</div>
          </div>
          <span className="text-cream-text text-[16px] font-black">›</span>
        </Link>
      )}
      <p className="mt-[9px] text-center text-[9.5px] font-bold text-ink-4">One ticker per card · tap for the full company page</p>
    </div>
  );
}
