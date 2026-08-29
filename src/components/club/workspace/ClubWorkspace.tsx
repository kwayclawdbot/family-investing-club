"use client";
import { OfficialPicks } from "./OfficialPicks";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Club, ClubOverview, MemberCard, PortfolioTab, VerifiedExposure } from "@/lib/types";
import { cx } from "@/components/ui";
import { InviteSheet, useStoredClub } from "../club-shared";
import { NewClubEmpty } from "../NewClubEmpty";
import { useStored } from "../storage";
import { ChatPane } from "./ChatPane";
import type { ClubChatMessage } from "@/lib/live/club";
import { PerformancePane } from "./PerformancePane";
import { DecisionsPane } from "./DecisionsPane";
import { MembersPane } from "./MembersPane";

export type WorkspaceTab = "chat" | "performance" | "decisions" | "members";
const TABS: { id: WorkspaceTab; label: string }[] = [{ id: "chat", label: "Chat" }, { id: "performance", label: "Performance" }, { id: "decisions", label: "Decisions" }, { id: "members", label: "Members" }];

type Props = { club: Club; overview: ClubOverview; portfolio: PortfolioTab; members: MemberCard[]; exposure: VerifiedExposure; initialTab?: WorkspaceTab; forceNew?: boolean; chat?: ClubChatMessage[] | null };

/** v11/v12 — the private club is chat-default: Chat (my people) · Performance (how are we doing) · Decisions (what are we deciding) · Members (who). */
export function ClubWorkspace({ club, overview, portfolio, members, initialTab = "chat", forceNew, chat }: Props) {
  const router = useRouter();
  const [stored] = useStoredClub();
  const [isNew] = useStored<string>("fic.club.new", "");
  const [tab, setTab] = useState<WorkspaceTab>(initialTab);
  const [invite, setInvite] = useState(false);
  const name = (stored.name ?? club.name).replace(/^the\s+/i, "");
  if (forceNew || isNew === "1") return <NewClubEmpty club={club} name={name} />;
  const privacy = stored.privacy ?? club.privacy;
  function go(t: WorkspaceTab) { setTab(t); router.replace(t === "chat" ? "/club" : `/club?tab=${t}`, { scroll: false }); }
  return (
    <>
      <div className="mt-[14px] flex items-center gap-[10px]">
        <span className={cx("rounded-[12px] bg-green-2 text-cream-text font-black flex items-center justify-center shrink-0", tab === "chat" ? "w-[38px] h-[38px] text-[14px]" : "w-[34px] h-[34px] text-[13px]")}>{name.charAt(0).toUpperCase()}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-black text-ink leading-tight truncate">{name}</div>
          <div className="text-[9.5px] font-extrabold text-ink-3">{privacy === "private" ? "🔒 Private" : "🌍 Public"} · {overview.members} members{tab === "chat" ? " · 3 online now" : ""}</div>
        </div>
        {tab === "chat" && <button onClick={() => setInvite(true)} className="bg-green-2 text-cream-text rounded-[10px] px-3 py-[7px] text-[10.5px] font-black shadow-[0_2px_0_#3A6B3E]">+ Invite</button>}
      </div>
      <div className="mt-[10px] flex bg-[#EFE7D6] rounded-[12px] p-[3px]" role="tablist" aria-label="Club">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => go(t.id)} className={cx("flex-1 rounded-[9px] py-[6px] text-[11.5px]", tab === t.id ? "bg-[#FFFDF7] text-ink font-black shadow-[0_1px_3px_rgba(46,42,33,0.1)]" : "text-ink-3 font-extrabold")}>{t.label}</button>
        ))}
      </div>
      {tab === "chat" && <ChatPane live={chat} proposal={overview.activeDecision ? { id: overview.activeDecision.proposalId, title: overview.activeDecision.title, hoursLeft: overview.activeDecision.hoursLeft, voted: overview.activeDecision.voted, eligible: overview.activeDecision.eligible } : null} />}
      {tab === "performance" && <><OfficialPicks /><details className="mt-4 rounded-[14px] border border-line bg-card px-3 py-2"><summary className="cursor-pointer text-[12px] font-black text-ink-2">Model portfolio ▾</summary><div className="pt-2"><PerformancePane o={overview} p={portfolio} /></div></details></>}
      {tab === "decisions" && <DecisionsPane o={overview} />}
      {tab === "members" && <MembersPane members={members} households={overview.households} onInvite={() => setInvite(true)} />}
      <InviteSheet open={invite} onClose={() => setInvite(false)} club={club} />
    </>
  );
}
