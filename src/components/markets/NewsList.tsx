"use client";
import { useEffect, useState } from "react";
import type { NewsItem, WatchItem } from "@/lib/types";
import { Card } from "@/components/ui";
import { NewsRow } from "./NewsRow";
import { readWatch, mergeWatch } from "./store";

export function NewsList({ news, baseWatchlist }: { news: NewsItem[]; baseWatchlist: WatchItem[] }) {
  const [followed, setFollowed] = useState<string[]>(baseWatchlist.map((w) => w.symbol));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setFollowed(mergeWatch(baseWatchlist, readWatch()).map((w) => w.symbol));
  }, [baseWatchlist]);
  const mine = news.filter((n) => n.symbols.some((s) => followed.includes(s)));
  const rest = news.filter((n) => !mine.includes(n));
  return (
    <>
      <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">For companies you follow</h2>
      <Card className="!py-1 !px-4">
        {mine.length === 0 ? (
          <div className="py-5 text-center text-[12.5px] font-bold text-ink-3">Add companies to your watchlist to see their news here.</div>
        ) : (
          mine.map((n, i) => <NewsRow key={n.id} n={n} last={i === mine.length - 1} />)
        )}
      </Card>
      {rest.length > 0 && (
        <>
          <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Market events</h2>
          <Card className="!py-1 !px-4">{rest.map((n, i) => <NewsRow key={n.id} n={n} last={i === rest.length - 1} />)}</Card>
        </>
      )}
    </>
  );
}
