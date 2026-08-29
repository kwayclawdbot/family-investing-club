"use client";
import { useState } from "react";
import type { Club, Leaderboards as LB, LeaderRow } from "@/lib/types";
import { cx } from "@/components/ui";
import { Sheet } from "@/components/ui/extras";
import Link from "next/link";
import { MemberAvatar, ScreenHeader } from "@/components/club/club-shared";
import { BeltChip } from "@/components/ui/belt";
import { RingedAvatar } from "@/components/belts/identity";
import { useBeltOf } from "@/components/belts/identity-context";

/**
 * Leaderboards — many ways to win, methodology labelled (canvas v7, artboard 07).
 * Never one "highest return wins"; never ranked by account size or dollars.
 */
const BASIS: Record<LeaderRow["basis"], { cls: string; how: string }> = {
  PRACTICE: { cls: "bg-purple-tint text-purple-2", how: "practice portfolio · simulated dollars, standardized rules" },
  PICK: { cls: "bg-orange-tint text-orange-2", how: "pick-based · timestamped Pick vs. price today" },
  "VERIFIED ✓": { cls: "bg-green-tint text-green", how: "brokerage-verified · return only, never account size" },
};
const MEDAL = ["🥇", "🥈", "🥉"];

export function Leaderboards({ club, lb }: { club: Club; lb: LB }) {
  const beltOf = useBeltOf();
  const [board, setBoard] = useState(lb.boards[0].id);
  const [method, setMethod] = useState(false);
  const active = lb.boards.find((b) => b.id === board) ?? lb.boards[0];
  const full = board === "pick";
  const otherLeader = lb.others.find((o) => o.label.toLowerCase().includes(board === "research" ? "research" : board === "learning" ? "learning" : "—"));

  return (
    <div className="pb-6">
      <ScreenHeader backHref="/club/members" />
      <Link href="/club/xp" className="mt-2 inline-block text-[11px] font-extrabold text-purple-2">Looking for progression? XP board →</Link>
      <h1 className="text-[21px] font-black text-ink">Leaderboards</h1>
      <p className="mt-[2px] text-[11.5px] font-bold text-ink-3">{club.shortName} · many ways to win — not just returns</p>

      <div className="mt-[11px] flex flex-wrap gap-[7px]" role="tablist" aria-label="Boards">
        {lb.boards.map((b) => (
          <button key={b.id} role="tab" aria-selected={board === b.id} onClick={() => setBoard(b.id)}
            className={cx("rounded-[16px] px-[13px] py-[6px] text-[11px] transition", board === b.id ? "bg-green-2 text-cream-text font-black" : "bg-card border border-line text-ink-3 font-extrabold")}>
            {b.label}
          </button>
        ))}
      </div>

      {full ? (
        <div className="mt-[11px] rounded-card border border-line bg-card px-[15px] py-1">
          <div className="flex items-center justify-between pt-[9px] pb-[5px]">
            <span className="text-[11px] font-black text-ink-3">{lb.window}</span>
            <button onClick={() => setMethod(true)} className="text-[10px] font-extrabold text-purple-2">methodology ›</button>
          </div>
          {lb.rows.map((r, i) => {
            const m = club.members.find((x) => x.id === r.memberId);
            return (
              <div key={r.memberId} className={cx("flex items-center gap-[10px] py-[9px]", i < lb.rows.length - 1 && "border-b border-paper-2")}>
                <span className="w-5 text-center text-[12px] font-black text-ink-3" aria-label={`Rank ${r.rank}`}>{MEDAL[r.rank - 1] ?? r.rank}</span>
                {m ? <RingedAvatar belt={beltOf(m.id)}><MemberAvatar m={m} size={30} /></RingedAvatar> : <span className="w-[30px] h-[30px] rounded-full bg-line-3" />}
                <span className="flex-1 min-w-0 text-[13px] font-extrabold text-ink flex items-center gap-[6px] flex-wrap">{r.name}{r.ageLabel ? ` · ${r.ageLabel}` : ""}{beltOf(r.memberId) && <BeltChip belt={beltOf(r.memberId)!} />}</span>
                <span className={cx("rounded-[6px] px-[7px] py-[2px] text-[8.5px] font-black", BASIS[r.basis].cls)}>{r.basis}</span>
                <span className="w-[56px] text-right text-[13px] font-black text-[#3A8C4A]">+{r.valuePct}%</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-[11px] rounded-card border border-line bg-card px-[15px] py-4">
          <div className="text-[11px] font-black text-ink-3">{active.label.toUpperCase()} · THIS SEASON</div>
          {otherLeader ? (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[12.5px] font-extrabold text-ink">{otherLeader.emoji} {otherLeader.label}</span>
              <span className="text-[11px] font-extrabold text-ink-3">{otherLeader.leader}</span>
            </div>
          ) : (
            <p className="mt-2 text-[12.5px] font-bold text-ink-2">{board === "practice" ? "Arielle leads on practice picks this season." : "Kway is the only connected member so far — a Verified ✓ board needs two or more consenting adults."}</p>
          )}
          <p className="mt-2 text-[11px] font-bold text-ink-4">Full board arrives with more data — window and rules will be stated here.</p>
        </div>
      )}

      <div className="mt-[9px] rounded-[14px] border border-[#DDD4F0] bg-purple-tint px-[14px] py-[11px] text-[11.5px] font-bold text-[#584A93] leading-[1.5]">
        🏅 {lb.footnote.split("reasoning")[0]}<b className="font-black">reasoning</b>{lb.footnote.split("reasoning")[1]}
      </div>

      <div className="mt-[9px] rounded-card border border-line bg-card px-[15px] py-3">
        <div className="text-[11px] font-black text-ink-3">OTHER BOARDS THIS SEASON</div>
        {lb.others.map((o, i) => (
          <div key={o.label} className={cx("flex items-center justify-between py-[9px]", i < lb.others.length - 1 && "border-b border-paper-2")}>
            <span className="text-[12.5px] font-extrabold text-ink">{o.emoji} {o.label}</span>
            <span className="text-[11px] font-extrabold text-ink-3">{o.leader}</span>
          </div>
        ))}
      </div>

      <p className="mt-[9px] text-center text-[10px] font-bold text-ink-4 leading-[1.5]">
        Every board states its window, rules, and whether data is practice, pick-based or brokerage-verified. Never one &quot;highest return wins&quot; — and never ranked by account size or dollars.
      </p>

      <Sheet open={method} onClose={() => setMethod(false)} title="How this board works">
        <div className="text-[11px] font-black text-ink-3">WINDOW</div>
        <p className="mt-1 text-[13px] font-bold text-ink-2">Last 6 months · return from each member&apos;s timestamped Pick to today&apos;s price. Picks made inside the window count from their timestamp.</p>
        <div className="mt-3 text-[11px] font-black text-ink-3">RULES</div>
        <ul className="mt-1 list-disc pl-4 text-[13px] font-bold text-ink-2 space-y-1">
          <li>Buy picks score price change; Watch and Pass picks are excluded.</li>
          <li>Edits never rewrite history — the original timestamp stands.</li>
          <li>Kids&apos; practice picks are scored exactly like adult picks.</li>
        </ul>
        <div className="mt-3 text-[11px] font-black text-ink-3">DATA BASIS PER ROW</div>
        <div className="mt-1 rounded-[12px] border border-line bg-paper px-3 py-1">
          {lb.rows.map((r, i) => (
            <div key={r.memberId} className={cx("flex items-center justify-between py-2 gap-2", i < lb.rows.length - 1 && "border-b border-line")}>
              <span className="text-[12px] font-extrabold text-ink">{r.name}</span>
              <span className="text-[10.5px] font-bold text-ink-3 text-right">{BASIS[r.basis].how}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] font-bold text-ink-3">Never ranked by account size or dollars. Adults are compared on returns and reasoning only; account values are private.</p>
      </Sheet>
    </div>
  );
}
