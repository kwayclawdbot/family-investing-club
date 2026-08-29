"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Club, ClubMember, ClubProposal } from "@/lib/types";
import { cx } from "@/components/ui";
import { proposalTitle } from "./MyClub";
import { Chip, MemberAvatar, ScreenHeader } from "./club-shared";
import { read, useStored } from "./storage";
import { clubApi, isUuid, signedOut } from "@/lib/live/client-club";

/** Eligible = a member whose vote counts (not mini-lesson gated). The fixture's "dad" is an observer, not a voter. */
const eligibleMember = (m: ClubMember | undefined) => !!m && m.id !== "dad" && !m.voteGated;

/** Artboard 04 — the case, learn-before-voting bridge, your vote, the tally.
 *  Signed in → POST /api/club/vote (vote_gated + kids-can-vote enforced server-side, refusal shown). Signed out → localStorage. */
export function VoteScreen({ proposal: initial, club, id, compact, onDone, live }: { proposal?: ClubProposal; club: Club; id: string; /** sheet mode: no screen header, a Done action */ compact?: boolean; onDone?: () => void; /** signed-in, real ids */ live?: boolean }) {
  const router = useRouter();
  const [p, setP] = useState<ClubProposal | undefined>(initial);
  useEffect(() => {
    if (initial) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate a locally-made proposal after mount
    setP(read<ClubProposal[]>("fic.proposals", []).find((x) => x.id === id));
  }, [id, initial]);
  const meId = club.members.find((m) => m.isYou)?.id ?? "kway";
  const isLive = live ?? isUuid(id);
  const [localMine, setLocalMine] = useStored<"for" | "against" | null>(`fic.votes.${id}`, null);
  const [serverMine, setServerMine] = useState<"for" | "against" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!p) return <div className="pt-16 text-center text-[13px] font-bold text-ink-3">{isLive ? "This proposal isn't in your club." : "This proposal isn't on this device."}</div>;

  const recorded = p.votes.find((v) => v.memberId === meId)?.vote ?? null;
  const mine = isLive ? (serverMine ?? recorded) : localMine;
  const proposer = club.members.find((m) => m.id === p.byId) ?? { initial: p.by.charAt(0), color: "bg-[#B08968]" };
  const votes = p.votes.map((v) => (v.memberId === meId && mine ? { ...v, vote: mine } : v));
  const eligible = votes.filter((v) => eligibleMember(club.members.find((m) => m.id === v.memberId)) || (!club.members.some((m) => m.id === v.memberId) && v.memberId !== "dad"));
  const forN = votes.filter((v) => v.vote === "for").length;
  const againstN = votes.filter((v) => v.vote === "against").length;
  const cast = eligible.filter((v) => v.vote).length;
  const waiting = eligible.filter((v) => !v.vote).map((v) => club.members.find((m) => m.id === v.memberId)).filter(Boolean);
  const gatedNames = club.members.filter((m) => m.voteGated).map((m) => m.name);
  const closed = p.status !== "open";
  const passing = forN > againstN && forN * 2 > eligible.length;
  const forPct = forN + againstN ? Math.round((forN / (forN + againstN)) * 100) : 0;
  const delta = p.toWeightPct - p.fromWeightPct;
  const me = club.members.find((m) => m.id === meId);
  const gatedMe = !!me?.voteGated;

  async function choose(v: "for" | "against") {
    if (closed || busy) return;
    if (!isLive) { setLocalMine(localMine === v ? null : v); return; }
    if (mine === v) return;
    setBusy(true); setError(null);
    const r = await clubApi.vote(id, v);
    setBusy(false);
    if (r.ok) { setServerMine(v); router.refresh(); return; }
    if (signedOut(r)) { setLocalMine(v); return; }
    setError(r.error);
  }

  return (
    <div className="flex flex-col min-h-full">
      {compact ? (
        <div className="flex justify-center mt-1"><span className="bg-purple-tint text-purple-2 rounded-[20px] px-[13px] py-[5px] text-[11px] font-black">{closed ? `PROPOSAL · ${p.status.toUpperCase()}` : `PROPOSAL · ENDS IN ${p.endsIn.toUpperCase()}`}</span></div>
      ) : (
        <ScreenHeader backHref="/club" center title={<span className="bg-purple-tint text-purple-2 rounded-[20px] px-[13px] py-[5px] text-[11px] font-black">{closed ? `PROPOSAL · ${p.status.toUpperCase()}` : `PROPOSAL · ENDS IN ${p.endsIn.toUpperCase()}`}</span>} />
      )}
      <h1 className="mt-[14px] text-[21px] font-black text-ink leading-[1.3]">
        {proposalTitle(p)} {p.kind !== "remove" && <span className="font-bold text-ink-3">({p.fromWeightPct}% → {p.toWeightPct}%)</span>}
      </h1>
      <div className="flex items-center gap-[9px] mt-2">
        <MemberAvatar m={proposer} size={28} />
        <span className="text-[12px] font-extrabold text-ink-2">Proposed by {p.by} · {p.postedAgo} · {club.shortName}</span>
      </div>

      <div className="mt-3 bg-card border border-line rounded-[16px] px-4 py-[13px]">
        <div className="text-[11px] font-black text-orange">THE CASE</div>
        <p className="mt-[5px] text-[13px] font-semibold text-[#4A4436] leading-[1.5]">&quot;{p.rationale}&quot;</p>
        <div className="flex gap-[7px] mt-[9px] flex-wrap">
          {p.evidence.map((e) => (
            <Link key={e.label} href={e.href} className={cx("rounded-[9px] px-[11px] py-1 text-[10px] font-black", e.label.startsWith("IDEA") ? "bg-orange-tint text-orange-2" : "bg-green-tint text-green")}>📎 {e.label.replace("IDEA: ", "").replace("'S RESEARCH", "'S NOTES").replace("ENERGY", "IDEA")}</Link>
          ))}
          {p.sinceBuyPct != null && <Chip>{p.symbol} {p.sinceBuyPct >= 0 ? "+" : ""}{p.sinceBuyPct}% since buy</Chip>}
        </div>
      </div>

      {p.conceptGate && !closed && (
        <div className="mt-[10px] bg-green-tint border border-green-line rounded-[14px] px-[14px] py-[11px] flex items-center gap-[10px]">
          <span className="w-[26px] h-[26px] rounded-[9px] bg-purple text-white text-[12px] flex items-center justify-center shrink-0">✦</span>
          <span className="flex-1 text-[11.5px] font-bold text-green">New to <b className="font-black">{p.conceptGate.concept}</b>? {p.conceptGate.minutes}-min refresher before you vote</span>
          <Link href={p.conceptGate.href} className="bg-green-2 text-cream-text rounded-[9px] px-[11px] py-[5px] text-[10.5px] font-black">Learn</Link>
        </div>
      )}

      {gatedMe && !closed && (
        <div className="mt-[10px] bg-purple-tint border border-[#DDD4F0] rounded-[14px] px-[14px] py-[11px] text-[11.5px] font-bold text-[#584A93]">
          🎓 {me?.gateReason ? `Your vote counts once you ${me.gateReason.replace(/^needs /, "finish ")}` : "Finish the mini-lesson and your vote counts"}. <Link href="/learn" className="font-black text-purple-2">Go learn →</Link>
        </div>
      )}

      {!closed ? (
        <>
          <div className="mt-[14px] text-center text-[12px] font-black text-ink-3">YOUR VOTE — LOCKED IN WHEN THE WINDOW CLOSES</div>
          <div className="flex gap-[10px] mt-[10px]" role="radiogroup" aria-label="Your vote">
            <button role="radio" aria-checked={mine === "for"} disabled={busy || gatedMe} onClick={() => choose("for")} className={cx("flex-1 rounded-[16px] py-[17px] text-center transition disabled:opacity-60", mine === "against" ? "bg-card border-2 border-green-line text-green" : "bg-green-2 text-cream-text shadow-[0_3px_0_#3A6B3E]", mine === "for" && "ring-2 ring-offset-2 ring-green-2 ring-offset-paper")}>
              <div className="text-[16px] font-black">👍 For</div>
              <div className="text-[10.5px] font-extrabold opacity-85">{p.kind === "remove" ? "sell it" : delta >= 0 ? "grow the position" : "trim it"}</div>
            </button>
            <button role="radio" aria-checked={mine === "against"} disabled={busy || gatedMe} onClick={() => choose("against")} className={cx("flex-1 rounded-[16px] py-[17px] text-center transition disabled:opacity-60", mine === "against" ? "bg-red text-cream-text shadow-[0_3px_0_#A8503F] ring-2 ring-offset-2 ring-red ring-offset-paper" : "bg-card border-2 border-[#E5B8AE] text-red")}>
              <div className="text-[16px] font-black">👎 Against</div>
              <div className="text-[10.5px] font-extrabold opacity-85">keep it at {p.fromWeightPct}%</div>
            </button>
          </div>
          {error && <p role="alert" className="mt-[10px] rounded-[12px] bg-orange-tint border border-orange-line px-3 py-2 text-[12px] font-bold text-orange-2">{error}</p>}
        </>
      ) : (
        <div className={cx("mt-[14px] rounded-[16px] px-4 py-[14px] text-center", p.status === "passed" ? "bg-green-tint border border-green-line" : "bg-orange-tint border border-orange-line")}>
          <div className="text-[16px] font-black text-ink">{p.status === "passed" ? "✓ Passed" : "Rejected"} · {forN}–{againstN}</div>
          <div className="text-[11.5px] font-bold text-ink-3 mt-1">{p.status === "passed" ? "Executed in the practice portfolio · journal entry drafted" : "Nothing changed in the portfolio"}</div>
        </div>
      )}

      <div className="mt-[14px] bg-card border border-line rounded-[16px] px-4 py-[13px]">
        <div className="text-[12px] font-black text-ink">Where the club stands · {cast} of {eligible.length} voted</div>
        <div className="relative h-3 rounded-[6px] bg-[#F7E2DE] mt-[9px] overflow-hidden">
          <div className="h-full bg-green-2" style={{ width: `${forPct}%` }} />
        </div>
        <div className="flex justify-between mt-[6px] text-[11px] font-extrabold">
          <span className="text-green">For · {forN}</span>
          <span className="text-red">Against · {againstN}{waiting.length > 0 && !closed ? ` · waiting on ${waiting.map((m) => (m!.isYou ? "you" : m!.name)).join(", ")}` : ""}{gatedNames.length && !closed ? ` · ${gatedNames.join(", ")} 🎓` : ""}</span>
        </div>
        <div className="flex gap-[6px] mt-[9px]">
          {eligible.map((v) => {
            const m = club.members.find((x) => x.id === v.memberId) ?? { initial: "?", color: "bg-ink-4" };
            return <MemberAvatar key={v.memberId} m={m} size={24} dashed={!v.vote} className={cx(v.vote === "against" && "ring-2 ring-red")} />;
          })}
        </div>
      </div>
      <p className="mt-[10px] mb-6 text-center text-[11px] font-bold text-ink-4">
        {closed ? "Every decision stays attached to its reasoning in the journal." : mine && cast === eligible.length ? `${passing ? "Passes" : "Fails"} when the window closes · executes in the practice portfolio · journal entry auto-drafted` : "Passes on majority · executes in the practice portfolio · journal entry auto-drafted"}
      </p>
      {compact && (
        <div className="flex gap-[10px] mb-[calc(8px+env(safe-area-inset-bottom))]">
          <Link href={`/club/vote/${id}`} onClick={onDone} className="flex-1 h-[44px] rounded-[14px] bg-card border border-line flex items-center justify-center text-[13px] font-black text-ink">Full case &amp; discussion</Link>
          <button onClick={onDone} className="flex-1 h-[44px] rounded-[14px] bg-green text-cream-text text-[13px] font-black">{mine ? "Done" : "Later"}</button>
        </div>
      )}
    </div>
  );
}
