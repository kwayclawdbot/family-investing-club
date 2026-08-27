"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { WatchItem } from "@/lib/types";
import { readWatch, isWatched, toggleWatch } from "./store";

/** Artboard 24 footer: outlined "Add to List" + orange "Practice Buy". */
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
    <div className="mt-3 flex gap-[10px]">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={watched}
        className={`flex-1 rounded-[14px] border-2 py-3 text-center text-[13.5px] font-black transition active:scale-[0.98] ${
          watched ? "border-green-2 bg-green-tint text-green" : "border-green-2 bg-transparent text-green"
        }`}
      >
        {watched ? "✓ On your list" : "Add to List"}
      </button>
      <Link href={`/practice/trade/${symbol}`} className="flex-1 rounded-[14px] bg-orange py-3 text-center text-[13.5px] font-black text-cream-text shadow-[0_3px_0_#C96D25] transition active:scale-[0.98]">
        Practice Buy
      </Link>
    </div>
  );
}
