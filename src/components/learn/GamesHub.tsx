"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Game } from "@/lib/types";
import { Card, Tag, cx } from "@/components/ui";
import { EmptyState } from "@/components/ui/extras";

const CATS = ["All", "Recognition", "Decision", "Chart", "Family"] as const;

export function GamesHub({ games }: { games: Game[] }) {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [best, setBest] = useState<Record<string, number>>({});
  useEffect(() => {
    try {
      const b: Record<string, number> = {};
      for (const g of games) { const v = localStorage.getItem(`fic.best.${g.id}`); if (v) b[g.id] = Number(v); }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      setBest(b);
    } catch { /* storage unavailable */ }
  }, [games]);
  const list = games.filter((g) => cat === "All" || g.kind === cat.toLowerCase());
  return (
    <>
      <div className="flex gap-[6px] mt-3 overflow-x-auto no-scrollbar -mx-[18px] px-[18px]" role="tablist">
        {CATS.map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={cx("h-[30px] px-[13px] rounded-[10px] text-[12px] font-extrabold shrink-0", cat === c ? "bg-green text-cream-text" : "bg-card border border-line text-ink-3")}>{c}</button>
        ))}
      </div>
      <div className="flex flex-col gap-3 mt-4">
        {list.length === 0 && <EmptyState emoji="🎮" title="No games here yet" />}
        {list.map((g) => {
          const b = best[g.id] ?? g.best;
          return (
            <Link key={g.id} href={`/learn/games/${g.id}`} className="block">
              <Card className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-[14px] bg-green-tint flex items-center justify-center text-[24px] shrink-0" aria-hidden>{g.emoji}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14.5px] font-black text-ink">{g.title}</span>
                  <span className="block text-[11.5px] font-bold text-ink-3 mt-[1px]">{g.skill} · {g.level} · {g.minutes} min</span>
                  <span className="flex items-center gap-2 mt-[6px]">
                    <Tag tone={g.kind === "family" ? "orange" : g.kind === "chart" ? "purple" : "green"}>{g.kind}</Tag>
                    {b !== undefined && <span className="text-[11px] font-extrabold text-gold">★ Best {b}</span>}
                  </span>
                </span>
                <span className="h-[32px] px-[14px] inline-flex items-center rounded-[10px] bg-orange text-cream-text text-[12.5px] font-black">Play</span>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
