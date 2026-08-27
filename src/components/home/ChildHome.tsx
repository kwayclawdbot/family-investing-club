import Link from "next/link";
import { Avatar, ArtPlaceholder } from "@/components/ui";
import type { ChildHome as ChildHomeData } from "@/lib/types";

/** Child Home (artboard 10): Learn · Practice · Participate — protected account. */
export function ChildHome({ data }: { data: ChildHomeData }) {
  const r = data.familyRequest;
  return (
    <div className="pt-[18px] pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-black text-ink">Hi {data.name}! 🌱</h1>
          <div className="text-[11px] font-extrabold text-ink-3">{data.level} level · protected account</div>
        </div>
        <div className="flex items-center gap-[5px] bg-orange-tint rounded-[20px] px-3 py-[6px]">
          <span className="text-[14px]" aria-hidden>🔥</span>
          <span className="text-[13px] font-black text-orange-2">{data.streakDays} days</span>
        </div>
      </div>

      {r && (
        <div className="mt-3 bg-card border-2 border-orange rounded-[18px] px-4 py-[14px]">
          <div className="text-[10.5px] font-black text-orange">FROM YOUR FAMILY</div>
          <div className="flex items-center gap-[11px] mt-2">
            <Avatar name={r.from} color="bg-coral" size={36} className="border-2 border-[#FFFDF7]" />
            <div className="flex-1">
              <div className="text-[14px] font-black text-ink">{r.from} wants your opinion on {r.name}</div>
              <div className="text-[11.5px] font-bold text-ink-3">&quot;{r.text}&quot;</div>
            </div>
          </div>
          <div className="flex gap-2 mt-[11px]">
            <Link href={`/search?q=${encodeURIComponent(r.name)}`} className="flex-1 bg-orange text-cream-text rounded-[12px] py-[10px] text-center text-[12.5px] font-black shadow-[0_2px_0_#C96D25]">Research it</Link>
            <Link href="/family" className="flex-1 bg-card border-[1.5px] border-line text-ink-2 rounded-[12px] py-[10px] text-center text-[12.5px] font-extrabold">Later</Link>
          </div>
        </div>
      )}

      <Link href={data.nextLesson.href} className="mt-[11px] bg-card border border-line rounded-[16px] px-4 py-[13px] flex items-center gap-3">
        <ArtPlaceholder round label="" className="w-11 h-11 shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[10.5px] font-extrabold text-orange">NEXT LESSON · {data.nextLesson.path}</span>
          <span className="block text-[14px] font-black text-ink">{data.nextLesson.title}</span>
          <span className="block h-[6px] rounded-[3px] bg-line-2 mt-[6px] overflow-hidden"><span className="block h-full w-[45%] rounded-[3px] bg-green-2" /></span>
        </span>
        <span className="bg-green-2 text-cream-text rounded-[11px] px-[13px] py-2 text-[12px] font-black">{data.nextLesson.minutes} min</span>
      </Link>

      <Link href="/practice" className="mt-[11px] block bg-card border border-line rounded-[16px] px-4 py-[13px]">
        <span className="flex justify-between items-center">
          <span className="text-[10.5px] font-extrabold text-ink-3">MY PRACTICE PORTFOLIO</span>
          <span className="text-[10px] font-extrabold text-green">stocks &amp; ETFs only 🔒</span>
        </span>
        <span className="flex items-center justify-between mt-[5px]">
          <span className="text-[19px] font-black text-ink">
            ${data.practice.value.toFixed(2)} <span className="text-[12px] text-[#3A8C4A]">+{data.practice.changePct}%</span>
          </span>
          <svg width="70" height="26" viewBox="0 0 70 26" fill="none" aria-hidden><path d="M1 20 L14 17 L26 19 L38 11 L50 13 L62 6 L69 3" stroke="#4C8C4A" strokeWidth="2" strokeLinecap="round" /></svg>
        </span>
        <span className="block text-[11px] font-bold text-ink-3 mt-[3px]">{data.practice.note}</span>
      </Link>

      <div className="mt-[11px] flex gap-[9px]">
        {data.familyVote && (
          <Link href={data.familyVote.gated ? "/learn" : `/club/vote/${data.familyVote.proposalId}`} className="flex-1 bg-purple-tint border border-[#DDD4F0] rounded-[14px] px-[13px] py-[11px]">
            <span className="block text-[10px] font-black text-purple-2">FAMILY VOTE 🗳</span>
            <span className="block text-[12px] font-extrabold text-ink mt-1">{data.familyVote.text}</span>
          </Link>
        )}
        {data.newBadge && (
          <Link href="/profile/badges" className="flex-1 bg-[#FFFDF4] border border-[#F0E0AE] rounded-[14px] px-[13px] py-[11px]">
            <span className="block text-[10px] font-black text-[#BC9227]">NEW BADGE {data.newBadge.emoji}</span>
            <span className="block text-[12px] font-extrabold text-ink mt-1">{data.newBadge.label} — {data.newBadge.sub}</span>
          </Link>
        )}
      </div>

      <Link href="/live/family-investing-night" className="mt-[11px] bg-orange-tint border border-orange-line rounded-[14px] px-[14px] py-[10px] flex items-center gap-[10px]">
        <span className="text-[17px]" aria-hidden>📅</span>
        <span className="flex-1 text-[12px] font-extrabold text-orange-2">Family Investing Night — {data.investingNight.when} · {data.investingNight.text}</span>
      </Link>

      <p className="mt-[11px] text-center text-[10.5px] font-bold text-ink-4">Public community is off for your account · a grown-up manages settings</p>
    </div>
  );
}
