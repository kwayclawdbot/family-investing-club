"use client";
import Link from "next/link";
import { useState } from "react";
import { Logo, Pct, CashText, BackBar } from "./bits";
import type { NewsFixture } from "@/lib/fixtures/v13-discover";
import type { NewsItem } from "@/lib/types";

type Tab = "mine" | "club" | "markets";
const TABS: { id: Tab; label: string }[] = [{ id: "mine", label: "My companies" }, { id: "club", label: "Club" }, { id: "markets", label: "Markets" }];

/** News — prototype v2 `news`: tabs, $TICKER cashtags, "Why this matters to you". */
export function NewsV13({ items, live, quotes }: { items: NewsFixture[]; live: NewsItem[]; quotes: Record<string, { changePct: number } | undefined> }) {
  const [tab, setTab] = useState<Tab>("mine");
  const rows = items.filter((n) => n.tab === tab);
  const extra = tab === "mine" ? live.slice(0, 4) : [];
  return (
    <div className="pt-[14px] pb-6">
      <BackBar title="News" right={<span className="text-[10px] font-extrabold text-ink-3">for your holdings &amp; watchlist</span>} />
      <div className="flex gap-[6px] mt-[10px]">{TABS.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={tab === t.id ? "bg-ink text-cream-text rounded-[15px] px-[13px] py-[5px] text-[10.5px] font-black" : "bg-card border border-line text-ink-3 rounded-[15px] px-[13px] py-[5px] text-[10.5px] font-extrabold"}>{t.label}</button>)}</div>
      <div className="mt-[10px] flex flex-col gap-[9px]">
        {rows.map((n) => {
          const pct = n.symbol ? (quotes[n.symbol]?.changePct ?? n.pct) : undefined;
          const body = (
            <>
              <div className="flex items-center gap-2">
                {n.symbol ? <Logo symbol={n.symbol} size={26} radius={8} /> : <span className="text-[13px]">🏛</span>}
                <span className="text-[9px] font-extrabold text-ink-3">{n.source} · {n.ago}</span>
                {pct !== undefined && <Pct v={pct} className="ml-auto text-[10px]" />}
              </div>
              <div className="mt-[6px] text-[13.5px] font-black text-ink leading-[1.55]"><CashText text={n.headline} /></div>
              {n.why && <div className={`mt-[6px] rounded-[9px] px-[10px] py-[7px] text-[10.5px] font-bold leading-[1.4] ${n.whyTone === "red" ? "bg-[#F7E9E5] text-[#A05242]" : "bg-green-tint text-green"}`}><b>Why this matters{n.whyTone === "red" ? "" : " to you"}:</b> <CashText text={n.why} /></div>}
              {n.circle && <Link href={`/circle/${n.circle.id}`} className="block mt-[6px] text-[10.5px] font-black text-purple-2">{n.circle.label}</Link>}
            </>
          );
          const cls = "block bg-card border border-line rounded-[15px] px-[14px] py-3";
          return n.symbol ? <Link key={n.id} href={`/discover/${n.symbol}`} className={cls}>{body}</Link> : <div key={n.id} className={cls}>{body}</div>;
        })}
        {extra.map((n) => (
          <Link key={n.id} href={n.symbols[0] ? `/discover/${n.symbols[0]}` : "/discover/news"} className="block bg-card border border-line rounded-[15px] px-[14px] py-3">
            <div className="flex items-center gap-2">{n.symbols[0] && <Logo symbol={n.symbols[0]} size={26} radius={8} />}<span className="text-[9px] font-extrabold text-ink-3">{n.source} · {n.ago}</span></div>
            <div className="mt-[6px] text-[13.5px] font-black text-ink leading-[1.5]">{n.headline}</div>
            <div className="mt-[6px] bg-green-tint rounded-[9px] px-[10px] py-[7px] text-[10.5px] font-bold text-green leading-[1.4]"><b>Why this matters:</b> {n.whyItMatters}</div>
          </Link>
        ))}
        {rows.length + extra.length === 0 && <div className="text-center text-[11px] font-bold text-ink-3 py-6">Nothing here yet.</div>}
      </div>
    </div>
  );
}
