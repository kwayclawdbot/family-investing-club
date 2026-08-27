"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { NewsItem, WatchItem, Holding } from "@/lib/types";
import { Card } from "@/components/ui";
import { SymbolTile } from "./SymbolTile";
import { readWatch, mergeWatch } from "./store";

const FILTERS = ["Following", "All", "Big picture"] as const;

/** Artboard 23 — "why this matters" framing. One BIG PICTURE story, watchlist stories with "Why it matters", then compact rows. */
export function NewsList({ news, baseWatchlist, holdings }: { news: NewsItem[]; baseWatchlist: WatchItem[]; holdings: Holding[] }) {
  const [followed, setFollowed] = useState<string[]>(baseWatchlist.map((w) => w.symbol));
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Following");
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setFollowed(mergeWatch(baseWatchlist, readWatch()).map((w) => w.symbol));
  }, [baseWatchlist]);

  const held = holdings.map((h) => h.symbol);
  const big = news.find((n) => n.concepts.includes("Interest rates") || n.symbols.includes("VOO")) ?? news[0];
  const mine = news.filter((n) => n !== big && n.symbols.some((s) => followed.includes(s)));
  const rest = news.filter((n) => n !== big && !mine.includes(n));
  const shown = filter === "All" ? { big, mine, rest } : filter === "Big picture" ? { big, mine: [], rest: [] } : { big, mine, rest: rest.filter((n) => n.symbols.some((s) => held.includes(s))) };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-[21px] font-black text-ink">Market News</h1>
        <div className="relative">
          <button type="button" onClick={() => setMenu((v) => !v)} aria-expanded={menu} className="rounded-[10px] border border-line bg-card px-3 py-[6px] text-[11.5px] font-extrabold text-ink-3">{filter} ▾</button>
          {menu && (
            <div className="absolute right-0 top-[34px] z-10 w-[130px] rounded-[12px] border border-line bg-card p-1 shadow-[0_8px_20px_rgba(46,42,33,0.15)]">
              {FILTERS.map((f) => (
                <button key={f} type="button" onClick={() => { setFilter(f); setMenu(false); }} className={`block w-full rounded-[8px] px-3 py-2 text-left text-[12px] font-extrabold ${f === filter ? "bg-green-tint text-green" : "text-ink"}`}>{f}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {shown.big && (
        <Card className="mt-3 !rounded-[18px] !px-4 !py-[15px]">
          <div className="flex items-center gap-2 text-[11px] font-extrabold text-ink-3">
            <span className="rounded-[7px] bg-green-tint px-2 py-[2px] font-black text-green">BIG PICTURE</span>
            <span>{shown.big.source} · {shown.big.ago}</span>
          </div>
          <Link href={`/discover/news/${shown.big.id}`} className="mt-2 block text-[16.5px] font-black text-ink leading-[1.3]">{shown.big.headline}</Link>
          <div className="mt-[10px] rounded-[13px] border border-line bg-paper px-[13px] py-[11px]">
            <div className="text-[10.5px] font-black text-orange">WHY THIS MATTERS TO YOU</div>
            <p className="mt-[5px] text-[12.5px] font-semibold text-[#4A4436] leading-[1.5]">{shown.big.whyItMatters}</p>
          </div>
          <div className="mt-[10px] flex flex-wrap gap-[7px]">
            {shown.big.concepts.slice(0, 1).map((c) => (
              <Link key={c} href={`/discover/news/${shown.big!.id}`} className="rounded-[9px] bg-purple-tint px-[11px] py-1 text-[10.5px] font-extrabold text-purple-2 uppercase">Concept: {c}</Link>
            ))}
            <Link href="/learn/path/money-basics" className="rounded-[9px] bg-purple-tint px-[11px] py-1 text-[10.5px] font-extrabold text-purple-2">LESSON: 4 MIN →</Link>
          </div>
        </Card>
      )}

      {shown.mine.map((n) => (
        <Card key={n.id} className="mt-3 !rounded-[18px] !px-4 !py-[15px]">
          <div className="flex items-center gap-2 text-[11px] font-extrabold text-ink-3">
            <span className="rounded-[7px] bg-orange-tint px-2 py-[2px] font-black text-orange-2">FROM YOUR WATCHLIST</span>
            <span>{n.ago}</span>
          </div>
          <Link href={`/discover/news/${n.id}`} className="mt-2 flex items-center gap-[11px]">
            <SymbolTile symbol={n.symbols[0]} size={36} />
            <span className="text-[14.5px] font-black text-ink leading-[1.3]">{n.headline}</span>
          </Link>
          <p className="mt-[9px] text-[12.5px] font-semibold text-ink-2 leading-[1.5]"><b className="text-ink">Why it matters:</b> {n.whyItMatters}</p>
          <div className="mt-[10px] flex gap-[14px] text-[11.5px] font-extrabold text-ink-3">
            <Link href="/club">💬 Discuss in Club</Link>
            <Link href={`/kai?context=${encodeURIComponent(`news:${n.id}`)}`} className="text-purple-2">Ask Kai to explain →</Link>
          </div>
        </Card>
      ))}

      {shown.rest.map((n) => (
        <Link key={n.id} href={`/discover/news/${n.id}`} className="mt-3 flex items-center gap-[11px] rounded-[18px] border border-line bg-card px-4 py-[13px]">
          <SymbolTile symbol={n.symbols[0]} size={36} />
          <span className="flex-1 min-w-0">
            <span className="block text-[13.5px] font-extrabold text-ink leading-[1.3]">{n.headline}</span>
            <span className="block text-[11px] font-bold text-ink-3">
              Ties to: {n.concepts[0]?.toUpperCase()}{n.symbols.some((s) => held.includes(s)) ? " · you hold this in practice" : ""}
            </span>
          </span>
          <span className="font-black text-ink-4">›</span>
        </Link>
      ))}

      {shown.mine.length + shown.rest.length === 0 && filter === "Following" && (
        <p className="mt-3 text-center text-[12px] font-bold text-ink-4">Follow companies on your research list to see their stories here.</p>
      )}
    </>
  );
}
