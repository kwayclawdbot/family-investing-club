"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { WatchItem } from "@/lib/types";
import { BookmarkIcon } from "@/components/ui/icons";
import { readWatch, isWatched, toggleWatch } from "./store";

export function SymbolActions({ symbol, name, baseWatchlist }: { symbol: string; name: string; baseWatchlist: WatchItem[] }) {
  const [watched, setWatched] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setWatched(isWatched(baseWatchlist, readWatch(), symbol));
  }, [baseWatchlist, symbol]);

  function toggle() {
    const s = toggleWatch(baseWatchlist, symbol, name);
    setWatched(isWatched(baseWatchlist, s, symbol));
  }

  return (
    <div className="flex gap-[10px] mt-3">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={watched}
        className={`flex-1 h-[50px] rounded-[16px] border text-[14px] font-black flex items-center justify-center gap-2 transition active:scale-[0.98] ${
          watched ? "bg-green-tint border-green-line text-green" : "bg-card border-line text-ink"
        }`}
      >
        <BookmarkIcon size={16} className={watched ? "fill-current" : ""} />
        {watched ? "On watchlist" : "Add to watchlist"}
      </button>
      <Link
        href={`/practice/trade/${symbol}`}
        className="flex-1 h-[50px] rounded-[16px] bg-green text-cream-text text-[14px] font-black flex items-center justify-center shadow-[0_3px_0_#2E5631] active:scale-[0.98] transition"
      >
        Practice buy
      </Link>
    </div>
  );
}
