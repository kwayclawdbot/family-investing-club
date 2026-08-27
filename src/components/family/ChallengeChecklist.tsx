"use client";
import type { Challenge, FamilyMember } from "@/lib/types";
import { Avatar, cx } from "@/components/ui";
import { useLocal } from "@/components/profile/useLocal";

/** Shared checklist: each step records which family members did it. */
export function ChallengeChecklist({ challenge, members }: { challenge: Challenge; members: FamilyMember[] }) {
  const [done, setDone] = useLocal<Record<number, string[]>>("fic.challenge.family", { 0: ["m1", "m2", "m3"], 1: ["m2"] });
  const me = members.find((m) => m.isYou)?.id ?? members[0].id;
  const total = challenge.steps.length;
  const complete = Object.values(done).filter((v) => v.length > 0).length;

  function toggle(i: number) {
    setDone((d) => {
      const cur = d[i] ?? [];
      return { ...d, [i]: cur.includes(me) ? cur.filter((x) => x !== me) : [...cur, me] };
    });
  }

  return (
    <div className="bg-card border border-line rounded-card px-4 py-1">
      <div className="flex justify-between items-center py-3 border-b border-paper-2">
        <span className="text-[13px] font-black text-ink">Steps</span>
        <span className="text-[12px] font-extrabold text-green">{complete} / {total} started</span>
      </div>
      {challenge.steps.map((s, i) => {
        const who = done[i] ?? [];
        const mine = who.includes(me);
        return (
          <div key={s} className={cx("flex items-center gap-3 py-3", i < total - 1 && "border-b border-paper-2")}>
            <button onClick={() => toggle(i)} aria-pressed={mine} aria-label={`Mark "${s}" done for you`}
              className={cx("w-6 h-6 rounded-full border-2 flex items-center justify-center text-[12px] font-black shrink-0", mine ? "bg-green-2 border-green-2 text-white" : "border-line-3 text-transparent")}>✓</button>
            <span className={cx("flex-1 text-[13.5px] font-extrabold", who.length ? "text-ink" : "text-ink-2")}>{s}</span>
            <div className="flex -space-x-2">
              {who.map((id) => {
                const m = members.find((x) => x.id === id);
                return m ? <Avatar key={id} name={m.name} color={m.color} size={22} className="ring-2 ring-white" /> : null;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
