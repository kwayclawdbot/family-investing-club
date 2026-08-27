"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Club, ClubOverview, MemberCard, PortfolioTab, VerifiedExposure } from "@/lib/types";
import { cx } from "@/components/ui";
import { clubXpGoal } from "@/lib/fixtures/belts";
import { InviteSheet, useStoredClub } from "../club-shared";
import { NewClubEmpty } from "../NewClubEmpty";
import { useStored } from "../storage";
import { Overview } from "./Overview";
import { PortfolioPane } from "./PortfolioPane";
import { MembersPane } from "./MembersPane";

export type WorkspaceTab = "overview" | "portfolio" | "members";
const TABS: { id: WorkspaceTab; label: string }[] = [{ id: "overview", label: "Overview" }, { id: "portfolio", label: "Portfolio" }, { id: "members", label: "Members" }];

type Props = { club: Club; overview: ClubOverview; portfolio: PortfolioTab; members: MemberCard[]; exposure: VerifiedExposure; initialTab?: WorkspaceTab; portfolioView?: "model" | "verified"; forceNew?: boolean };

/** v10 — the private club as a collective-performance workspace: Overview · Portfolio · Members. */
export function ClubWorkspace({ club, overview, portfolio, members, exposure, initialTab = "overview", portfolioView, forceNew }: Props) {
  const router = useRouter();
  const [stored] = useStoredClub();
  const [isNew] = useStored<string>("fic.club.new", "");
  const [tab, setTab] = useState<WorkspaceTab>(initialTab);
  const [invite, setInvite] = useState(false);
  const name = stored.name ?? club.name;
  if (forceNew || isNew === "1") return <NewClubEmpty club={club} name={name} />;
  const privacy = stored.privacy ?? club.privacy;
  const xpPct = Math.round((clubXpGoal.current / clubXpGoal.goal) * 100);

  function go(t: WorkspaceTab) {
    setTab(t);
    router.replace(t === "overview" ? "/club" : `/club?tab=${t}`, { scroll: false });
  }

  return (
    <>
      {tab === "overview" && (
        <div className="mt-[14px] flex items-center gap-[11px]">
          <span className="w-11 h-11 rounded-[14px] bg-green-2 text-cream-text font-black text-[17px] flex items-center justify-center shrink-0">{name.replace(/^the\s+/i, "").trim().charAt(0).toUpperCase()}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[15.5px] font-black text-ink leading-tight">{name}</div>
            <div className="text-[10px] font-extrabold text-ink-3">{privacy === "private" ? "🔒 Private" : "🌍 Public"} · {overview.members} members · 🔥 {overview.streakWeeks}-week streak</div>
          </div>
          <button onClick={() => setInvite(true)} className="bg-green-2 text-cream-text rounded-[11px] px-[14px] py-2 text-[11.5px] font-black shadow-[0_2px_0_#3A6B3E]">+ Invite</button>
        </div>
      )}
      <div className={cx("flex bg-[#EFE7D6] rounded-[12px] p-[3px]", tab === "overview" ? "mt-[10px]" : "mt-[14px]")} role="tablist" aria-label="Club">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => go(t.id)} className={cx("flex-1 rounded-[9px] py-[7px] text-[12px]", tab === t.id ? "bg-[#FFFDF7] text-ink font-black shadow-[0_1px_3px_rgba(46,42,33,0.1)]" : "text-ink-3 font-extrabold")}>{t.label}</button>
        ))}
      </div>
      {tab === "overview" && (
        <div className="mt-[7px] flex items-center gap-2" title={`Club XP · ${clubXpGoal.window}: ${clubXpGoal.current} / ${clubXpGoal.goal}`}>
          <div className="flex-1 h-[4px] rounded-[2px] bg-line-2 overflow-hidden" role="progressbar" aria-valuenow={xpPct} aria-valuemin={0} aria-valuemax={100} aria-label="Club XP this week"><div className="h-full rounded-[2px] bg-green-2" style={{ width: `${xpPct}%` }} /></div>
          <span className="text-[8.5px] font-extrabold text-ink-4 whitespace-nowrap">Club XP {clubXpGoal.current}/{clubXpGoal.goal} · this week</span>
        </div>
      )}

      {tab === "overview" && <Overview o={overview} exposure={exposure} />}
      {tab === "portfolio" && <PortfolioPane p={portfolio} exposure={exposure} value={overview.value} ytdPct={overview.ytdPct} initialView={portfolioView} />}
      {tab === "members" && <MembersPane members={members} households={overview.households} onInvite={() => setInvite(true)} />}

      <InviteSheet open={invite} onClose={() => setInvite(false)} club={club} />
    </>
  );
}
