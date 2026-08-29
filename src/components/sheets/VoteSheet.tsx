"use client";
import { useEffect, useState } from "react";
import { getClub, getProposal } from "@/lib/data";
import type { Club, ClubProposal } from "@/lib/types";
import { VoteScreen } from "@/components/club/VoteScreen";
import { clubApi } from "@/lib/live/client-club";
import { SheetFrame } from "./SheetFrame";

/** Compact vote — the case, For/Against, tally — as a sheet. Deep link stays at /club/vote/[id].
 *  Signed in → live club + proposal from /api/club/context; signed out → the fixture demo. */
export function VoteSheet({ proposalId, onClose }: { proposalId: string; onClose: () => void }) {
  const [data, setData] = useState<{ club: Club; proposal?: ClubProposal; live: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const ctx = await clubApi.context(proposalId);
      if (ctx.ok && ctx.club) { if (alive) setData({ club: ctx.club, proposal: ctx.proposal ?? undefined, live: true }); return; }
      const [club, proposal] = await Promise.all([getClub(), getProposal(proposalId)]);
      if (alive) setData({ club, proposal, live: false });
    })();
    return () => { alive = false; };
  }, [proposalId]);
  return (
    <SheetFrame title="Your vote" onClose={onClose}>
      {data ? <VoteScreen compact club={data.club} proposal={data.proposal} id={proposalId} live={data.live} onDone={onClose} /> : <div className="py-10 text-center text-[12px] font-bold text-ink-3">Loading…</div>}
    </SheetFrame>
  );
}
