"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cx } from "@/components/ui";
import { MemberAvatar } from "./MemberAvatar";
import { familyApi } from "@/lib/live/client-family";
import type { HouseholdMember, Mission } from "@/lib/live/family";

/** Family missions (FTA `fic_missions`): each member completes their own; the row shows who in the house has. */
export function MissionList({ missions, members, isKid }: { missions: Mission[]; members: HouseholdMember[]; isKid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function complete(m: Mission) {
    setBusy(m.slug); setMsg(null);
    const r = await familyApi.completeMission(m.slug);
    setBusy(null);
    if (!r.ok) { setMsg(r.error); return; }
    setMsg(r.alreadyDone ? "Already done" : r.xp ? `Done · +${r.xp} XP` : "Done ✓");
    router.refresh();
  }
  return (
    <div className="flex flex-col gap-[10px]">
      {missions.map((m) => (
        <div key={m.id} className="bg-card border border-line rounded-card px-4 py-[13px]">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-black text-ink leading-[1.3]">{m.title}</div>
              <p className="mt-1 text-[12px] font-bold text-ink-3 leading-[1.45]">{isKid && m.kidPrompt ? m.kidPrompt : m.description}</p>
            </div>
            <span className="shrink-0 rounded-[6px] bg-orange-tint px-2 py-[3px] text-[10px] font-extrabold text-orange-2">+{m.xp} XP</span>
          </div>
          <div className="mt-[10px] flex items-center gap-2">
            <div className="flex -space-x-2 flex-1">
              {m.completedBy.map((id) => { const mem = members.find((x) => x.id === id); return mem ? <MemberAvatar key={id} name={mem.name} color={mem.color} avatarUrl={mem.avatarUrl} size={22} className="ring-2 ring-white" /> : null; })}
              {m.completedBy.length === 0 && <span className="text-[11px] font-bold text-ink-4">Nobody yet</span>}
            </div>
            <button type="button" onClick={() => complete(m)} disabled={m.doneByMe || busy !== null} className={cx("h-[30px] px-3 rounded-[10px] text-[11.5px] font-black", m.doneByMe ? "bg-green-tint text-green" : "bg-orange text-cream-text")}>{m.doneByMe ? "Done ✓" : busy === m.slug ? "…" : "I did this"}</button>
          </div>
        </div>
      ))}
      {msg && <p className={cx("text-center text-[12px] font-extrabold", msg.startsWith("Done") || msg === "Already done" ? "text-green" : "text-red")} role="status">{msg}</p>}
    </div>
  );
}
