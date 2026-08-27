"use client";
import { useEffect, useState } from "react";
import { getClub, getProposal } from "@/lib/data";
import type { Club, ClubProposal } from "@/lib/types";
import { VoteScreen } from "@/components/club/VoteScreen";
import { SheetFrame } from "./SheetFrame";

/** Compact vote — the case, For/Against, tally — as a sheet. Deep link stays at /club/vote/[id]. */
export function VoteSheet({ proposalId, onClose }: { proposalId: string; onClose: () => void }) {
  const [data, setData] = useState<{ club: Club; proposal?: ClubProposal } | null>(null);
  useEffect(() => { Promise.all([getClub(), getProposal(proposalId)]).then(([club, proposal]) => setData({ club, proposal })); }, [proposalId]);
  return (
    <SheetFrame title="Your vote" onClose={onClose}>
      {data ? <VoteScreen compact club={data.club} proposal={data.proposal} id={proposalId} onDone={onClose} /> : <div className="py-10 text-center text-[12px] font-bold text-ink-3">Loading…</div>}
    </SheetFrame>
  );
}
