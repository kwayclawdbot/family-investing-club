"use client";
import Link from "next/link";
import { Card, ButtonLink, Row, Avatar } from "@/components/ui";
import { ChevronRight, KaiSpark } from "@/components/ui/icons";
import { useLevel, isYouth } from "./useLevel";
import type { LiveSession, Idea, Challenge, Portfolio } from "@/lib/types";

type Props = {
  live?: LiveSession;
  idea?: Idea;
  challenge?: Challenge;
  portfolio: Portfolio;
  hasReview: boolean;
};

/** Level-aware Home sections: Market lesson / Brand Hunt, Happening now, practice strip, review nudge. */
export function HomeExtras({ live, idea, challenge, portfolio, hasReview }: Props) {
  const level = useLevel();
  const youth = isYouth(level);

  return (
    <>
      {/* Market lesson of the day — or Brand Hunt for young learners */}
      {youth ? (
        <>
          <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Play &amp; learn</h2>
          <Card tone="green" className="rounded-card-lg">
            <div className="text-[11px] font-extrabold text-green tracking-[0.3px] uppercase">Family game</div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[34px] leading-none" aria-hidden>🏠</span>
              <div className="flex-1">
                <div className="text-[18px] font-black text-ink leading-[1.25]">Brand Hunt</div>
                <div className="text-[12.5px] font-bold text-ink-3 mt-[2px]">Which companies made the things in your kitchen?</div>
              </div>
            </div>
            <ButtonLink href="/learn/games/family-brand-hunt" variant="green" size="md" className="mt-3">Play together</ButtonLink>
          </Card>
        </>
      ) : (
        <>
          <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Market Lesson of the Day</h2>
          <Card tone="green" className="rounded-card-lg">
            <div className="text-[11px] font-extrabold text-green tracking-[0.3px] uppercase">NVDA · +4.2% today</div>
            <div className="text-[19px] font-black text-ink leading-[1.25] mt-1">Why is NVIDIA up 4.2% today?</div>
            <div className="text-[12.5px] font-bold text-ink-3 mt-[4px]">Learn 3 key concepts in under 5 minutes.</div>
            <div className="flex items-center gap-3 mt-3">
              <ButtonLink href="/markets/news/n1" variant="green" size="md">Start Lesson</ButtonLink>
              <Link href="/kai?context=symbol:NVDA" className="inline-flex items-center gap-1 text-[12.5px] font-extrabold text-purple-2">
                <KaiSpark size={12} /> Ask Kai →
              </Link>
            </div>
          </Card>
        </>
      )}

      {/* Happening now */}
      <div className="flex items-center justify-between mt-4 mb-2">
        <h2 className="text-[15px] font-black text-ink">Happening Now</h2>
        <Link href="/live" className="text-[12px] font-extrabold text-green">See All</Link>
      </div>
      <Card className="py-[6px] px-4">
        {live && (
          <Link href={`/live/${live.id}`} className="block">
            <Row>
              <Avatar name={live.instructor.replace("Coach ", "")} color="bg-coral" size={34} />
              <span className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-extrabold text-ink truncate">{youth ? "Live class right now" : `Live Room: ${live.title}`}</span>
                <span className="block text-[11.5px] font-bold text-ink-3">with {live.instructor} · {live.watching} watching</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-[6px] bg-green px-2 py-[3px] text-[10px] font-black text-cream-text">● LIVE</span>
            </Row>
          </Link>
        )}
        {idea && (
          <Link href={`/club/idea/${idea.id}`} className="block">
            <Row>
              <span className="w-[34px] h-[34px] rounded-full bg-purple-tint flex items-center justify-center text-[16px]" aria-hidden>💡</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-extrabold text-ink truncate">New idea: {idea.title.split(":")[0]}</span>
                <span className="block text-[11.5px] font-bold text-ink-3">By {idea.author} · 💬 {idea.comments}</span>
              </span>
              <ChevronRight className="text-ink-4" />
            </Row>
          </Link>
        )}
        {challenge && (
          <Row last>
            <span className="w-[34px] h-[34px] rounded-full bg-orange-tint flex items-center justify-center text-[16px]" aria-hidden>🏆</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13.5px] font-extrabold text-ink truncate">Weekly Challenge</span>
              <span className="block text-[11.5px] font-bold text-ink-3 truncate">{challenge.title}</span>
            </span>
            <Link href="/family/challenge" className="h-[30px] px-3 inline-flex items-center rounded-[10px] bg-orange-tint text-orange-3 text-[12px] font-black">Join</Link>
          </Row>
        )}
      </Card>

      {/* Practice strip */}
      <Link href="/practice" className="block mt-3">
        <Card className="flex items-center gap-3 px-4 py-3">
          <span className="w-9 h-9 rounded-[12px] bg-orange-tint flex items-center justify-center text-[16px]" aria-hidden>📊</span>
          <span className="flex-1">
            <span className="block text-[13.5px] font-black text-ink">Practice Portfolio</span>
            <span className="block text-[11.5px] font-bold text-ink-3">{youth ? "Pretend money — real learning" : "Virtual money · real market"}</span>
          </span>
          <span className="text-right">
            <span className="block text-[14px] font-black text-ink">${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className={`block text-[11.5px] font-extrabold ${portfolio.dayChangePct >= 0 ? "text-green-2" : "text-red"}`}>
              {portfolio.dayChangePct >= 0 ? "+" : ""}{portfolio.dayChangePct.toFixed(2)}%
            </span>
          </span>
        </Card>
      </Link>

      {/* Review nudge */}
      {hasReview && (
        <Link href="/learn/review" className="block mt-3">
          <Card tone="purple" className="flex items-center gap-3 px-4 py-3">
            <span className="text-[20px] leading-none" aria-hidden>🧠</span>
            <span className="flex-1">
              <span className="block text-[13.5px] font-black text-ink">Review time</span>
              <span className="block text-[11.5px] font-bold text-purple-2">{youth ? "3 words to remember — 2 minutes" : "3 concepts are fading · 2-minute review"}</span>
            </span>
            <ChevronRight className="text-purple-2" />
          </Card>
        </Link>
      )}
    </>
  );
}

/** "Family League" vs "Family Team" title, level-aware. */
export function LeagueTitle() {
  const level = useLevel();
  return (
    <h2 className="text-[15px] font-black text-ink">
      {isYouth(level) ? "Family Team" : "Family League"} <span className="text-[11px] font-bold text-ink-4 ml-1">All-time</span>
    </h2>
  );
}

export function StreakCopy() {
  const level = useLevel();
  return <div className="text-[12px] font-bold text-orange-2">{isYouth(level) ? "Keep your streak going!" : "Keep it up! You're on fire."}</div>;
}
