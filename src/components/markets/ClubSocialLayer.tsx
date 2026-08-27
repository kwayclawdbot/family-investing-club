import Link from "next/link";
import type { ClubMember, Pick, ClubProposal, ResearchAssignment } from "@/lib/types";

/**
 * Company page v2 (artboard 08): the private-club layer that sits ABOVE the educational dossier.
 * Who's watching · member picks · open proposal · research task · Make a Pick / Start an Idea / Propose to Club.
 */
export function ClubSocialLayer({
  symbol,
  clubName,
  watchers,
  picks,
  proposal,
  research,
}: {
  symbol: string;
  clubName: string;
  watchers: ClubMember[];
  picks: Pick[];
  proposal?: ClubProposal;
  research?: ResearchAssignment;
}) {
  const stance = { buy: "BUY", watch: "WATCH", pass: "PASS" } as const;
  const stanceTone = { buy: "bg-green-tint text-green", watch: "bg-orange-tint text-orange-2", pass: "bg-paper-2 text-ink-3" } as const;
  const q = `?symbol=${encodeURIComponent(symbol)}`;
  return (
    <>
      <div className="mt-3 rounded-card border border-[#DDD4F0] bg-purple-tint px-[15px] py-3">
        <div className="flex items-center gap-[10px]">
          <span className="flex">
            {watchers.slice(0, 4).map((m, i) => (
              <span
                key={m.id}
                className={`w-[26px] h-[26px] rounded-full ${m.color} text-white text-[10px] font-black flex items-center justify-center border-2 border-[#FFFDF7] ${i ? "-ml-2" : ""}`}
                title={m.name}
              >
                {m.initial}
              </span>
            ))}
          </span>
          <span className="flex-1 text-[12.5px] font-extrabold text-ink">
            {watchers.length === 0
              ? `Nobody in ${clubName} is watching ${symbol} yet`
              : `${watchers.length} ${watchers.length === 1 ? "person" : "people"} in your club ${watchers.length === 1 ? "is" : "are"} watching ${symbol}`}
          </span>
        </div>

        {picks.map((p) => (
          <Link
            key={p.id}
            href={`/club/pick/${p.id}`}
            className="mt-[9px] flex items-center gap-[9px] rounded-[11px] border border-[#E3DAF3] bg-[#FFFDF7] px-3 py-[9px]"
          >
            <span className="w-6 h-6 rounded-full bg-green-3 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#FFFDF7] shrink-0">{p.author[0]}</span>
            <span className="flex-1 text-[11.5px] font-bold text-[#4A4436] leading-[1.35]">
              <b>{p.author}</b> · <span className={`rounded-[6px] px-[7px] py-[1px] text-[9.5px] font-black ${stanceTone[p.stance]}`}>{stance[p.stance]}</span>{" "}
              “{p.reason.replace(/\.$/, "")}”
            </span>
          </Link>
        ))}

        {research && research.status === "open" && (
          <div className="mt-[9px] flex items-center gap-[9px] rounded-[11px] border border-[#E3DAF3] bg-[#FFFDF7] px-3 py-[9px] text-[11.5px] font-bold text-[#4A4436]">
            <span aria-hidden>🔍</span>
            <span className="flex-1"><b>{research.assignee === "you" ? "You're" : `${research.assignee} is`}</b> researching {symbol} · due {research.due}</span>
          </div>
        )}

        {proposal ? (
          <Link href={`/club/vote/${proposal.id}`} className="mt-[7px] block text-[11px] font-extrabold text-purple-2">
            🗳 Open proposal: {proposal.kind === "resize" ? "Resize" : proposal.kind === "add" ? "Add" : "Remove"} {proposal.symbol}{" "}
            {proposal.fromWeightPct}% → {proposal.toWeightPct}% · ends in {proposal.endsIn} · Vote →
          </Link>
        ) : (
          <div className="mt-[7px] text-[11px] font-extrabold text-purple-2">🗳 No open proposal — start one from a Pick or Idea</div>
        )}
      </div>

      <div className="mt-[10px] flex gap-2">
        <Link href={`/club/pick/new${q}`} className="flex-1 rounded-[13px] bg-green-2 px-1 py-[11px] text-center text-[12px] font-black text-cream-text shadow-[0_2px_0_#3A6B3E]">Make a Pick</Link>
        <Link href={`/club/new${q}`} className="flex-1 rounded-[13px] border-[1.5px] border-green-2 bg-card px-1 py-[11px] text-center text-[12px] font-black text-green">Start an Idea</Link>
        <Link href={`/club/propose${q}`} className="flex-1 rounded-[13px] border-[1.5px] border-[#DDD4F0] bg-card px-1 py-[11px] text-center text-[12px] font-black text-purple-2">Propose to Club</Link>
      </div>
    </>
  );
}
