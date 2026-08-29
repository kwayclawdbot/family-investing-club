"use client";
import Link from "next/link";
import { useState } from "react";
import { Logo, Pct, CashText, BackBar } from "./bits";
import type { NewsCard, NewsFeed, NewsTab } from "@/lib/live/newsfeed";

const TABS: { id: NewsTab; label: string }[] = [{ id: "mine", label: "My companies" }, { id: "club", label: "Club" }, { id: "markets", label: "Markets" }];
const EMPTY: Record<NewsTab, string> = {
  mine: "Nothing yet — add a company to your watchlist and its news shows up here.",
  club: "Nothing yet — news follows what your club holds and researches.",
  markets: "No desk stories yet.",
};

/** News — tabs, $TICKER cashtags, and a "why this matters" that states your actual position. */
export function NewsV13({ feed, quotes }: { feed: NewsFeed | null; quotes: Record<string, { changePct: number } | undefined> }) {
  // Open on a tab that actually has stories — an empty default reads as a broken page.
  const first = (["mine", "club", "markets"] as NewsTab[]).find((k) => (feed?.[k]?.length ?? 0) > 0) ?? "mine";
  const [tab, setTab] = useState<NewsTab>(first);
  const rows: NewsCard[] = feed?.[tab] ?? [];
  return (
    <div className="pt-[14px] pb-6">
      <BackBar title="News" right={<span className="text-[10px] font-extrabold text-ink-3">for your holdings &amp; watchlist</span>} />
      <div className="flex gap-[6px] mt-[10px]">{TABS.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={tab === t.id ? "bg-ink text-cream-text rounded-[15px] px-[13px] py-[5px] text-[10.5px] font-black" : "bg-card border border-line text-ink-3 rounded-[15px] px-[13px] py-[5px] text-[10.5px] font-extrabold"}>{t.label}</button>)}</div>
      <div className="mt-[10px] flex flex-col gap-[9px]">
        {rows.map((n) => {
          const sym = n.symbols[0];
          const pct = sym ? quotes[sym]?.changePct : undefined;
          const body = (
            <>
              <div className="flex items-center gap-2">
                {sym ? <Logo symbol={sym} size={26} radius={8} /> : <span className="text-[13px]">🏛</span>}
                <span className="text-[9px] font-extrabold text-ink-3">{n.source} · {n.ago}</span>
                {pct !== undefined && <Pct v={pct} className="ml-auto text-[10px]" />}
              </div>
              <div className="mt-[6px] text-[13.5px] font-black text-ink leading-[1.55]"><CashText text={n.headline} /></div>
              {n.why && <div className={`mt-[6px] rounded-[9px] px-[10px] py-[7px] text-[10.5px] font-bold leading-[1.4] ${n.whyTone === "green" ? "bg-green-tint text-green" : "bg-paper-2 text-ink-2"}`}><b>Why this matters{n.whyTone === "green" ? " to you" : ""}:</b> <CashText text={n.why} /></div>}
              {!!n.symbols.length && <div className="mt-[6px] flex gap-2 text-[10px] font-black text-green">{n.symbols.slice(0, 4).map((s) => <span key={s}>${s}</span>)}</div>}
            </>
          );
          const cls = "block bg-card border border-line rounded-[15px] px-[14px] py-3";
          return sym ? <Link key={n.id} href={`/discover/${sym}`} className={cls}>{body}</Link> : <div key={n.id} className={cls}>{body}</div>;
        })}
        {!rows.length && <div className="text-center text-[11px] font-bold text-ink-3 py-6">{EMPTY[tab]}</div>}
      </div>
      {tab !== "markets" && <p className="mt-3 text-center text-[9.5px] font-bold text-ink-4">Stories from the wire · &ldquo;why this matters&rdquo; states your position, not an opinion</p>}
    </div>
  );
}
