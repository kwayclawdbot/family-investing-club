"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Game } from "@/lib/types";
import { cx } from "@/components/ui";

/** Artboard 17 — Practice Arcade: category tag tone + label per game kind. */
const KIND: Record<Game["kind"], { label: string; cls: string }> = {
  chart: { label: "CHARTS", cls: "bg-green-tint text-green" },
  decision: { label: "DECISIONS", cls: "bg-[#FFFDF4] text-[#BC9227]" },
  recognition: { label: "RECOGNITION", cls: "bg-purple-tint text-purple-2" },
  family: { label: "FAMILY", cls: "bg-orange-tint text-orange-2" },
};
const PORTFOLIO_GAMES = new Set(["diversify-it", "budget-builder"]);

function useBest(games: Game[]) {
  const [best, setBest] = useState<Record<string, number>>({});
  useEffect(() => {
    try {
      const b: Record<string, number> = {};
      for (const g of games) { const v = localStorage.getItem(`fic.best.${g.id}`); if (v) b[g.id] = Number(v); }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      setBest(b);
    } catch { /* storage unavailable */ }
  }, [games]);
  return best;
}

export function GamesHub({ games }: { games: Game[] }) {
  const best = useBest(games);
  const skill = games.filter((g) => g.kind !== "family");
  const family = games.find((g) => g.kind === "family");
  return (
    <>
      {/* Daily challenge hero */}
      <div className="mt-3 rounded-[18px] bg-green p-4 relative overflow-hidden">
        <span className="inline-block rounded-[8px] bg-cream-text/[0.18] px-[10px] py-[3px] text-[10px] font-black tracking-[0.5px] text-cream-text">DAILY CHALLENGE</span>
        <div className="mt-[9px] text-[20px] font-black text-cream-text">Bull or Bear?</div>
        <div className="mt-[3px] text-[12.5px] font-bold text-[#C9DCBD]">Guess how 5 real stocks moved today · 2 min</div>
        <div className="mt-[13px] flex items-center justify-between">
          <span className="text-[11.5px] font-extrabold text-[#C9DCBD]">Streak bonus: 2× XP</span>
          <Link href="/learn/chart-practice" className="rounded-[12px] bg-orange px-5 py-[9px] text-[13.5px] font-black text-cream-text shadow-[0_3px_0_#C96D25] active:translate-y-[2px] active:shadow-none transition">Play</Link>
        </div>
      </div>

      <h2 className="mt-[14px] mb-2 text-[15px] font-black text-ink">Skill Games</h2>
      <div className="grid grid-cols-2 gap-[10px]">
        {skill.map((g) => {
          const k = PORTFOLIO_GAMES.has(g.id) ? { label: "PORTFOLIO", cls: "bg-orange-tint text-orange-2" } : KIND[g.kind];
          // The saved score (game_scores) and any unsynced local round — whichever is actually higher.
          const local = best[g.id]; const b = local !== undefined && g.best !== undefined ? Math.max(local, g.best) : local ?? g.best;
          return (
            <Link key={g.id} href={`/learn/games/${g.id}`} className="rounded-[16px] border border-line bg-card px-[14px] py-[13px] active:scale-[0.98] transition">
              <span className={cx("inline-block rounded-[8px] px-[9px] py-[3px] text-[10px] font-black", k.cls)}>{k.label}</span>
              <div className="mt-2 text-[14.5px] font-black text-ink">{g.title}</div>
              <div className="mt-[2px] text-[11px] font-bold text-ink-3">{g.skill} · {g.level === "All" ? "All levels" : `Lv ${g.level}`}</div>
              <div className="mt-2 text-[11px] font-extrabold text-orange-2">🏅 Best: {b !== undefined ? b : "—"}</div>
            </Link>
          );
        })}
      </div>

      {family && (
        <Link href={`/learn/games/${family.id}`} className="mt-3 flex items-center gap-3 rounded-[16px] border border-line bg-card px-4 py-[13px]">
          <span className="text-[24px]" aria-hidden>🏆</span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-black text-ink">{family.title} · play together</span>
            <span className="block text-[11.5px] font-bold text-ink-3">{family.blurb}</span>
          </span>
          <span className="rounded-[11px] border-[1.5px] border-green-2 px-[13px] py-[7px] text-[11.5px] font-black text-green">Join</span>
        </Link>
      )}
    </>
  );
}
