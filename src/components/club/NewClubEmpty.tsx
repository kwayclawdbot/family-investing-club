"use client";
import Link from "next/link";
import { useState } from "react";
import type { Club } from "@/lib/types";
import { ChevronRight } from "@/components/ui/icons";
import { ClubToggle, InviteSheet, MemberAvatar, useShareInvite } from "./club-shared";

/** Artboard 06 — founder just created the club: invite first, then two ways to get started. */
export function NewClubEmpty({ club, name }: { club: Club; name: string }) {
  const [invite, setInvite] = useState(false);
  const { copied, copy, share } = useShareInvite(club);
  const you = club.members.find((m) => m.isYou) ?? club.members[0];
  const [line1, line2] = splitName(name);
  return (
    <>
      <div className="mt-[14px] bg-card border border-line rounded-[18px] px-4 py-[15px]">
        <div className="flex items-center gap-[13px]">
          <span className="w-[54px] h-[54px] rounded-[17px] bg-green-2 text-cream-text font-black text-[21px] flex items-center justify-center shrink-0">{name.trim().charAt(0).toUpperCase() || "C"}</span>
          <div>
            <div className="text-[17.5px] font-black text-ink leading-[1.2]">{line1}{line2 && <><br />{line2}</>}</div>
            <div className="text-[11px] font-extrabold text-ink-3 mt-[3px]">🔒 Private · 1 member · you&apos;re the founder</div>
          </div>
        </div>
      </div>
      <ClubToggle active="club" />

      <div className="mt-[14px] bg-card border border-line rounded-[20px] px-5 py-[22px] text-center">
        <div className="flex justify-center">
          <MemberAvatar m={you} size={44} />
          {[0, 1, 2].map((i) => (
            <MemberAvatar key={i} m={{ initial: "+", color: "" }} size={44} dashed className="-ml-[10px] text-[17px]" />
          ))}
        </div>
        <div className="mt-4 text-[22px] font-black text-ink leading-[1.25]">Investing is better together.</div>
        <p className="mt-2 text-[13.5px] font-semibold text-ink-3 leading-[1.5]">Invite the people you talk about money with — family, friends, whoever you trust.</p>
        <button onClick={() => setInvite(true)} className="mt-4 w-full bg-orange text-cream-text rounded-[15px] py-[15px] text-[15px] font-black shadow-[0_3px_0_#C96D25] active:translate-y-[2px] active:shadow-none transition">
          Invite Family &amp; Friends
        </button>
        <div className="flex gap-2 mt-[10px]">
          <button onClick={() => setInvite(true)} className="flex-1 bg-paper border border-line rounded-[12px] py-[10px] px-1 text-[11.5px] font-extrabold text-ink-2">👤 Contacts</button>
          <button onClick={() => copy("link")} className="flex-1 bg-paper border border-line rounded-[12px] py-[10px] px-1 text-[11.5px] font-extrabold text-ink-2">{copied === "link" ? "✓ Copied" : "🔗 Copy link"}</button>
          <button onClick={share} className="flex-1 bg-paper border border-line rounded-[12px] py-[10px] px-1 text-[11.5px] font-extrabold text-ink-2">💬 Text</button>
        </div>
      </div>

      <div className="mt-[14px] text-[12px] font-black text-ink-3">MEANWHILE, GET THE CLUB STARTED</div>
      <div className="mt-2 mb-6 bg-card border border-line rounded-[16px] px-[15px] py-[2px]">
        <Link href="/club/pick/new" className="flex items-center gap-[11px] py-[11px] border-b border-paper-2">
          <span className="w-[26px] h-[26px] rounded-[9px] bg-green-tint flex items-center justify-center text-[13px]">▲</span>
          <span className="flex-1 text-[13px] font-extrabold text-ink">Make your first Pick</span>
          <ChevronRight className="text-ink-4" />
        </Link>
        <Link href="/search" className="flex items-center gap-[11px] py-[11px]">
          <span className="w-[26px] h-[26px] rounded-[9px] bg-orange-tint flex items-center justify-center text-[13px]">🔍</span>
          <span className="flex-1 text-[13px] font-extrabold text-ink">Add a company you all know to the research list</span>
          <ChevronRight className="text-ink-4" />
        </Link>
      </div>
      <InviteSheet open={invite} onClose={() => setInvite(false)} club={club} />
    </>
  );
}

export function splitName(name: string): [string, string | null] {
  const n = name.trim();
  const i = n.toLowerCase().indexOf(" investing club");
  if (i > 0) return [n.slice(0, i), n.slice(i + 1)];
  return [n, null];
}
