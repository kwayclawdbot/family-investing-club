"use client";
import Link from "next/link";
import { useState } from "react";
import type { CommunityPost } from "@/lib/types";
import { cx } from "@/components/ui";
import { BarChip, RingAvatar } from "./BarChip";
import { useBeltOf } from "@/components/belts/identity-context";

const GUEST_RING: Record<string, "blue" | "purple" | "yellow" | "white" | null> = { "Sarah J.": "blue", "Jordan P.": "yellow", "Coach Tia": "purple" };
const GUEST_BG: Record<string, string> = { "Sarah J.": "bg-coral", "Jordan P.": "bg-purple", "Coach Tia": "bg-green-3" };
const beltColorFromLabel = (l?: string): "blue" | "purple" | "yellow" | "white" | "black" => {
  const s = (l ?? "").toLowerCase();
  return s.startsWith("blue") ? "blue" : s.startsWith("purple") ? "purple" : s.startsWith("yellow") ? "yellow" : s.startsWith("black") ? "black" : "white";
};

function Head({ author, authorId, belt, ago, square, chip: chipOverride }: { author: string; authorId?: string; belt?: string; ago: string; square?: boolean; chip?: { color: "public" | "verified"; label: string } }) {
  const beltOf = useBeltOf();
  const member = authorId ? beltOf(authorId) : null;
  const ring = member?.color ?? GUEST_RING[author] ?? null;
  const bg = authorId ? (authorId === "andwele" ? "bg-green-3" : authorId === "kway" ? "bg-green-2" : authorId === "mom" ? "bg-coral" : "bg-[#B08968]") : GUEST_BG[author] ?? "bg-ink-4";
  const chip: { color: Parameters<typeof BarChip>[0]["color"]; label: string } | null = chipOverride ?? (member ? { color: member.color, label: member.short } : belt ? { color: beltColorFromLabel(belt), label: belt } : null);
  return (
    <div className="flex items-center gap-2">
      {square ? (
        <span className="w-[30px] h-[30px] rounded-[10px] bg-green-2 text-white flex items-center justify-center text-[11px] font-black shrink-0">{author[0]}</span>
      ) : (
        <RingAvatar initial={author[0]} bg={bg} ring={ring} size={30} />
      )}
      <span className="text-[12.5px] font-black text-ink">{author}</span>
      {chip && <BarChip color={chip.color} label={chip.label} />}
      <span className="ml-auto text-[10px] font-extrabold text-ink-4">{ago}</span>
    </div>
  );
}

export function PickPost({ p }: { p: Extract<CommunityPost, { kind: "pick" }> }) {
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  return (
    <article className="py-3 border-b border-[#F1E8D4]">
      <Head author={p.author} authorId={p.authorId} belt={p.belt} ago={p.ago} />
      <div className="mt-2 flex items-center gap-[10px]">
        <span className="w-[38px] h-[38px] rounded-[12px] bg-line-2 flex items-center justify-center text-[10px] font-black text-ink-2 shrink-0">{p.symbol}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-black text-ink">{p.name} · <span className={cx(p.stance === "buy" ? "text-green" : p.stance === "watch" ? "text-orange-2" : "text-red")}>{p.stance.toUpperCase()}</span></div>
          <div className="text-[11px] font-bold text-ink-2">“{p.reason}”</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-[10px] bg-[#FBF6EA] rounded-[11px] px-3 py-2">
        <div>
          <div className={cx("text-[12px] font-black", p.sincePct >= 0 ? "text-[#3A8C4A]" : "text-red")}>{p.sincePct >= 0 ? "+" : ""}{p.sincePct}%</div>
          <div className="text-[8.5px] font-extrabold text-ink-3">SINCE PICK</div>
        </div>
        <svg width="150" height="26" viewBox="0 0 150 26" preserveAspectRatio="none" className="shrink-0" aria-hidden><polyline fill="none" stroke="#4C8C4A" strokeWidth="2" points="0,20 20,17 40,21 60,13 80,16 100,9 125,12 150,4" /></svg>
        {p.verified && <span className="ml-auto"><BarChip color="verified" label="VERIFIED ✓" /></span>}
      </div>
      <div className="mt-[7px] flex gap-4 text-[10.5px] font-extrabold text-ink-3">
        <button onClick={() => setLiked((v) => !v)} aria-pressed={liked} className={liked ? "text-green" : ""}>👍 {p.likes + (liked ? 1 : 0)}</button>
        <span>💬 {p.comments}</span>
        <span>👁 {p.views}</span>
        <button onClick={() => setSaved((v) => !v)} aria-pressed={saved} aria-label="Save" className="ml-auto">{saved ? "🔖 Saved" : "🔖"}</button>
      </div>
    </article>
  );
}

export function ClubVotePost({ p }: { p: Extract<CommunityPost, { kind: "clubvote" }> }) {
  const [asked, setAsked] = useState(false);
  const c = 2 * Math.PI * 30;
  const add = c * (p.split.add / 100), watch = c * (p.split.watch / 100);
  return (
    <article className="py-3 border-b border-[#F1E8D4]">
      <Head author={p.club} ago={p.ago} square chip={{ color: "public", label: p.visibility }} />
      <div className="mt-2 text-[14px] font-black text-ink">{p.question}</div>
      <div className="mt-2 flex items-center gap-[14px]">
        <span className="relative w-[74px] h-[74px] shrink-0">
          <svg width="74" height="74" viewBox="0 0 74 74" aria-hidden>
            <circle cx="37" cy="37" r="30" fill="none" stroke="#F0E6D0" strokeWidth="9" />
            <circle cx="37" cy="37" r="30" fill="none" stroke="#4C8C4A" strokeWidth="9" strokeDasharray={`${add} ${c}`} strokeLinecap="round" transform="rotate(-90 37 37)" />
            <circle cx="37" cy="37" r="30" fill="none" stroke="#E9C46A" strokeWidth="9" strokeDasharray={`${watch} ${c}`} strokeDashoffset={-add} transform="rotate(-90 37 37)" />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[15px] font-black text-ink">{p.leading.pct}%</span>
            <span className="text-[8px] font-extrabold text-ink-3">{p.leading.label}</span>
          </span>
        </span>
        <div className="flex-1 text-[11px] font-extrabold text-ink-2 leading-[1.7]">
          🟢 Add {p.split.add}% · 🟡 Watch {p.split.watch}% · 🔴 Pass {p.split.pass}%<br />{p.voted} of {p.eligible} voted · closes in {p.closesIn}
        </div>
        <button onClick={() => setAsked(true)} className="bg-purple text-cream-text rounded-[11px] px-[15px] py-[9px] text-[11.5px] font-black">Vote</button>
      </div>
      {asked && <p className="mt-2 text-[11px] font-bold text-ink-3">Join the club to vote — public clubs show their decisions, members make them. <Link href="/community?tab=clubs" className="text-purple-2 font-black">See clubs →</Link></p>}
    </article>
  );
}

export function PromotionPost({ p }: { p: Extract<CommunityPost, { kind: "promotion" }> }) {
  const beltOf = useBeltOf();
  const color = beltOf(p.authorId)?.color ?? beltColorFromLabel(p.belt);
  const bar: Record<string, string> = { white: "bg-[#F5F0E4] border border-[#C9BC9E]", yellow: "bg-[#E9C46A]", blue: "bg-[#4E7DA6]", purple: "bg-[#8B7BC7]", black: "bg-[#2E2A21]" };
  return (
    <article className="py-3 border-b border-[#F1E8D4]">
      <Head author={p.author} authorId={p.authorId} belt={p.belt} ago={p.ago} />
      <div className="mt-[7px] flex items-center gap-[10px] rounded-[12px] border border-[#F0E0AE] px-[13px] py-[9px]" style={{ background: "linear-gradient(105deg,#FFFDF4,#FBF3DD)" }}>
        <span className={cx("w-11 h-4 rounded-[5px] shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)]", bar[color])} aria-hidden />
        <span className="flex-1 text-[12px] font-extrabold text-[#4A4436]">Promoted to <b>{p.toBelt}</b> · {p.xp.toLocaleString()} XP</span>
        <span className="text-[12px]">🎉</span>
      </div>
    </article>
  );
}
