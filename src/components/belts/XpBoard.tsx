"use client";
import Link from "next/link";
import { useState } from "react";
import type { XpLeaderboard } from "@/lib/types";
import { beltAtLevel } from "@/lib/data";
import { cx } from "@/components/ui";
import { EmptyState } from "@/components/ui/extras";
import { BeltChip, BeltRing } from "@/components/ui/belt";
import { ScreenHeader } from "@/components/club/club-shared";

const MEDAL = ["🥇", "🥈", "🥉"];

/** XP Leaderboard — belts beside identity, boards never merged (canvas v8, artboard 04). */
export function XpBoard({ lb }: { lb: XpLeaderboard }) {
  const [win, setWin] = useState(lb.windows[0]);
  const [scope, setScope] = useState(lb.scopes[0]);
  const rows = win === "7 days" ? lb.rows : [...lb.rows].sort((a, b) => b.lifetimeXp - a.lifetimeXp).map((r, i) => ({ ...r, rank: i + 1 }));
  const chip = (label: string, on: boolean, onClick: () => void) => (
    <button key={label} role="tab" aria-selected={on} onClick={onClick} className={cx("rounded-[16px] px-[13px] py-[6px] text-[11px] transition", on ? "bg-green-2 text-cream-text font-black" : "bg-card border border-line text-ink-3 font-extrabold")}>
      {label}
    </button>
  );
  const leader = rows[0];
  const leaderBelt = beltAtLevel(leader.awardedLevel ?? 1);

  return (
    <div className="pb-6">
      <ScreenHeader backHref="/club" />
      <h1 className="mt-1 text-[21px] font-black text-ink">XP Leaderboard</h1>
      <p className="mt-[2px] text-[11.5px] font-bold text-ink-3">Progression &amp; participation — separate from investment performance</p>
      <div className="flex gap-[7px] mt-[11px] flex-wrap" role="tablist">
        {lb.windows.map((w) => chip(w, win === w, () => setWin(w)))}
        {lb.scopes.map((s) => chip(s, scope === s, () => setScope(s)))}
      </div>

      {scope === "Class" ? (
        <div className="mt-[11px]"><EmptyState emoji="🏫" title="Join a class to see its XP board" body="Classroom boards arrive with class groups." action="Browse groups" href="/club/groups" /></div>
      ) : (
        <>
          <div className="mt-[11px] bg-card border border-line rounded-[16px] px-[15px] py-1">
            {rows.map((r, i) => {
              const belt = beltAtLevel(r.awardedLevel ?? 1);
              return (
                <div key={r.memberId} className={cx("flex items-center gap-[10px] py-[9px]", i < rows.length - 1 && "border-b border-paper-2")}>
                  <span className="w-5 text-center text-[12px] font-black text-ink-3" aria-label={`Rank ${r.rank}`}>{MEDAL[r.rank - 1] ?? r.rank}</span>
                  <BeltRing belt={belt} className="!ring-offset-[#FFFDF7]">
                    <span className={cx("w-8 h-8 rounded-full text-white flex items-center justify-center text-[12px] font-black", r.color)} aria-hidden>{r.initial}</span>
                  </BeltRing>
                  <span className="flex-1 min-w-0 flex items-center gap-[6px] flex-wrap">
                    <span className="text-[13px] font-extrabold text-ink">{r.name}</span>
                    <BeltChip belt={belt} />
                  </span>
                  <span className="text-[13px] font-black text-green">{win === "All-time" ? r.lifetimeXp.toLocaleString() : `+${r.deltaXp}`}</span>
                </div>
              );
            })}
          </div>
          {win === "7 days" ? (
            <div className="mt-[10px] bg-purple-tint border border-[#DDD4F0] rounded-[14px] px-[14px] py-[11px] text-[11.5px] font-bold text-[#584A93] leading-[1.5]">
              🥇 A {leaderBelt.color === "white" ? "White Belt" : leaderBelt.label} leading the XP board is the system working — {leader.name.replace(" (you)", "")} out-<i>learned</i> everyone this week. Pick accuracy is a different board.
            </div>
          ) : (
            <div className="mt-[10px] bg-purple-tint border border-[#DDD4F0] rounded-[14px] px-[14px] py-[11px] text-[11.5px] font-bold text-[#584A93] leading-[1.5]">
              {win === "All-time" ? "Lifetime XP — the belt ladder, in numbers." : "Last 30 days, ordered by lifetime XP until the 30-day window has enough history."} Pick accuracy is a different board.
            </div>
          )}
        </>
      )}

      <div className="mt-[10px] bg-card border border-line rounded-[16px] px-[15px] py-3">
        <div className="text-[11px] font-black text-ink-3">SEPARATE BOARDS · NEVER MERGED</div>
        {lb.otherBoards.map((b, i) => (
          <Link key={b.label} href={b.href} className={cx("flex justify-between py-[9px] text-[12.5px] font-extrabold text-ink", i < lb.otherBoards.length - 1 && "border-b border-paper-2")}>
            <span>{b.emoji} {b.label}</span>
            <span className="text-ink-4">›</span>
          </Link>
        ))}
      </div>
      <p className="mt-[9px] text-center text-[10px] font-bold text-ink-4">Belts appear beside every identity · XP never ranks dollars, trades or risk</p>
    </div>
  );
}
