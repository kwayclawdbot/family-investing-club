"use client";
import Link from "next/link";
import type { MemberCard } from "@/lib/types";
import { cx } from "@/components/ui";
import { Belt, MemberDot, Panel, pctText } from "./shared";

/** Artboard 03 — Members: investors, not a roster. */
export function MembersPane({ members, households, onInvite }: { members: MemberCard[]; households: number; onInvite: () => void }) {
  return (
    <>
      <div className="mt-[11px] flex items-center gap-[10px]">
        <span className="w-[34px] h-[34px] rounded-[11px] bg-green-2 text-cream-text font-black text-[13px] flex items-center justify-center shrink-0">M</span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-black text-ink">Mensah Club · Members</div>
          <div className="text-[9.5px] font-extrabold text-ink-3">{members.length} members · {households} households</div>
        </div>
        <button onClick={onInvite} className="bg-green-2 text-cream-text rounded-[11px] px-[13px] py-[7px] text-[11px] font-black shadow-[0_2px_0_#3A6B3E]">+ Invite</button>
      </div>

      <Panel className="mt-[11px]">
        {members.map((m, i) => (
          <div key={m.memberId} className={cx("py-[10px]", i < members.length - 1 && "border-b border-paper-2")}>
            <div className="flex items-center gap-[10px]">
              <MemberDot memberId={m.memberId} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[6px] flex-wrap">
                  <Link href={`/club/members/${m.memberId}`} className="text-[13px] font-black text-ink">{m.name}</Link>
                  <Belt memberId={m.memberId} />
                  {m.role && (
                    <span className={cx("rounded-[6px] px-[7px] py-[1px] text-[8.5px] font-black", m.role.startsWith("PRACTICE") ? "bg-purple-tint text-purple-2" : "bg-line-2 text-ink-2")}>{m.role}</span>
                  )}
                </div>
                <div className="text-[10px] font-bold text-ink-3 mt-[2px]">{[...m.facts, `${m.xpWeek} XP${m.memberId === "kway" ? " this wk" : ""}`, m.extra].filter(Boolean).join(" · ")}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12.5px] font-black text-[#3A8C4A]">{pctText(m.picksYtdPct)}</div>
                <div className="text-[8.5px] font-extrabold text-ink-4">PICKS YTD</div>
              </div>
            </div>
          </div>
        ))}
      </Panel>

      <div className="mt-[10px] bg-purple-tint border border-[#DDD4F0] rounded-[13px] px-[13px] py-[10px] text-[11px] font-bold text-[#584A93] leading-[1.5]">
        🎓 <b>Arielle&apos;s returns are practice-portfolio only</b> — clearly labeled, never mixed with verified adult performance. Guardian controls what she sees and joins.
      </div>
      <div className="mt-[9px] text-center text-[10px] font-bold text-ink-4">Ranked by timestamped picks · never account dollars · verified ✓ shows data trust, not skill</div>

      <div className="mt-3 mb-4 bg-card border border-line rounded-[14px] px-[14px]">
        <Link href="/club/leaderboards" className="flex items-center justify-between py-3 border-b border-paper-2 text-[13px] font-extrabold text-ink"><span>🏆 Leaderboards</span><span className="text-ink-4">›</span></Link>
        <Link href="/club/xp" className="flex items-center justify-between py-3 text-[13px] font-extrabold text-ink"><span>🏅 XP board</span><span className="text-ink-4">›</span></Link>
      </div>
    </>
  );
}
