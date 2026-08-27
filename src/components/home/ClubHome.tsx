import Link from "next/link";
import { Avatar, ArtPlaceholder } from "@/components/ui";
import { BellIcon, ChevronRight } from "@/components/ui/icons";
import type { Club, ClubMember, ClubProposal, ResearchAssignment, ClubActivity, ClubPortfolio, Community, LiveSession, Portfolio } from "@/lib/types";

type Props = {
  club: Club;
  members: ClubMember[];
  proposal?: ClubProposal;
  research: ResearchAssignment[];
  activity: ClubActivity[];
  portfolio: ClubPortfolio;
  community: Community;
  next: { pathTitle: string; lessonNo: number; title: string; minutes: number; lessonId: string };
  live?: LiveSession;
  practice: Portfolio;
};

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Home v2 (artboard 16): club first, Learn retained below. */
export function ClubHome({ club, members, proposal, research, activity, portfolio, community, next, live, practice }: Props) {
  const voted = proposal ? proposal.votes.filter((v) => v.vote).length : 0;
  const totalVoters = members.length;
  const mine = research.find((r) => r.assigneeId === "kway" && r.status === "open");
  const together = research.filter((r) => r.status === "open").slice(0, 2);
  const trending = community.trendingIdeas[0];
  const latest = portfolio.journal[0];
  const others = members.filter((m) => !m.isYou);

  return (
    <div className="pt-[18px] pb-6">
      {/* My Club header */}
      <div className="flex items-center justify-between">
        <Link href="/club" className="flex items-center gap-[10px]">
          <span className="w-[38px] h-[38px] rounded-[13px] bg-green-2 text-cream-text font-black text-[14px] flex items-center justify-center">
            {club.shortName.replace("The ", "").slice(0, 1)}
          </span>
          <span>
            <span className="block text-[16px] font-black text-ink">{club.shortName}</span>
            <span className="block text-[10.5px] font-extrabold text-ink-3">🔒 Private · {members.length} members</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex">
            {others.map((m, i) => (
              <Avatar key={m.id} name={m.name} color={m.color} size={26} className={`border-2 border-[#FFFDF7] ${i > 0 ? "-ml-2" : ""}`} />
            ))}
          </span>
          <Link href="/club" className="border-[1.5px] border-green-2 text-green rounded-[10px] px-[10px] py-[5px] text-[10.5px] font-black">
            + Invite
          </Link>
          <Link href="/profile/notifications" aria-label="Notifications" className="w-8 h-8 rounded-full bg-card border border-line flex items-center justify-center text-ink-2">
            <BellIcon size={15} />
          </Link>
        </div>
      </div>

      {/* Needs your attention */}
      {(proposal || mine) && (
        <div className="mt-3 bg-purple-tint border border-[#DDD4F0] rounded-[16px] px-[15px] py-3">
          <div className="text-[10.5px] font-black text-purple-2">NEEDS YOUR ATTENTION</div>
          {proposal && (
            <div className="flex items-center gap-[10px] mt-2">
              <span className="text-[16px]" aria-hidden>🗳</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-extrabold text-ink">Vote: {proposal.kind === "add" ? "Add" : "Add"} {proposal.symbol} +{proposal.toWeightPct - proposal.fromWeightPct}% to club portfolio</div>
                <div className="text-[10.5px] font-bold text-ink-3">{voted} of {totalVoters} voted · ends in {proposal.endsIn}</div>
              </div>
              <Link href={`/club/vote/${proposal.id}`} className="bg-purple text-cream-text rounded-[10px] px-3 py-[6px] text-[11px] font-black">Vote</Link>
            </div>
          )}
          {mine && (
            <Link href="/club/research" className={`flex items-center gap-[10px] ${proposal ? "mt-[9px] pt-[9px] border-t border-[#E3DAF3]" : "mt-2"}`}>
              <span className="text-[16px]" aria-hidden>🔍</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-extrabold text-ink">Your research: {mine.name.split(" ")[0]} — due before Family Night</span>
                <span className="block text-[10.5px] font-bold text-ink-3">Thursday 7 PM</span>
              </span>
              <ChevronRight className="text-ink-4" />
            </Link>
          )}
        </div>
      )}

      {/* Club activity */}
      <div className="mt-3 mb-[6px] text-[14px] font-black text-ink">Club activity</div>
      <div className="bg-card border border-line rounded-[16px] px-[15px] py-1">
        {activity.slice(0, 2).map((a, i, arr) => {
          const actor = members.find((m) => m.id === a.actorId);
          return (
            <Link key={a.id} href={a.href} className={`flex items-center gap-[10px] py-[10px] ${i < arr.length - 1 ? "border-b border-paper-2" : ""}`}>
              <Avatar name={a.actor} color={actor?.color} size={30} className="border-2 border-[#FFFDF7]" />
              <span className="flex-1 text-[12.5px] font-bold text-[#4A4436] leading-[1.4]">
                <b>{a.actor}</b> {a.kind === "pick" ? (
                  <>made a Pick: <b className="text-green">{a.text.replace("made a Pick: ", "")}</b></>
                ) : (
                  a.text.replace(/(Costco|NVDA|CEG)/, "§$1§").split("§").map((part, j) => (part === "Costco" || part === "NVDA" || part === "CEG" ? <b key={j}>{part}</b> : part))
                )}
                {a.quote && <> — &quot;{a.quote}&quot;</>}
              </span>
              <span className="text-[10px] font-bold text-ink-4">{a.ago}</span>
            </Link>
          );
        })}
      </div>

      {/* Club portfolio */}
      <Link href="/club/portfolio" className="mt-[10px] bg-card border border-line rounded-[16px] px-[15px] py-3 flex items-center gap-3">
        <span className="flex-1 min-w-0">
          <span className="block text-[10.5px] font-extrabold text-ink-3">CLUB PORTFOLIO (PRACTICE)</span>
          <span className="block text-[17px] font-black text-ink">
            ${money(portfolio.value)} <span className="text-[12px] text-[#3A8C4A]">+{portfolio.ytdPct}% YTD</span>
          </span>
          {latest && <span className="block text-[10.5px] font-bold text-ink-3">Latest decision: added {latest.title.match(/[A-Z]{2,5}/)?.[0] ?? "CEG"} · from Sarah&apos;s idea</span>}
        </span>
        <svg width="70" height="30" viewBox="0 0 70 30" fill="none" aria-hidden>
          <path d="M1 24 L12 20 L22 22 L32 14 L42 16 L52 9 L62 11 L69 4" stroke="#4C8C4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      {/* Researching together · Around FIC */}
      <div className="mt-[10px] flex gap-[9px]">
        <Link href="/club/research" className="flex-1 bg-card border border-line rounded-[14px] px-[13px] py-[11px]">
          <span className="block text-[10px] font-black text-ink-3">RESEARCHING TOGETHER</span>
          <span className="block text-[12.5px] font-extrabold text-ink mt-1">
            {together.map((r) => `${r.symbol} — ${r.assignee}`).join(" · ")}
          </span>
        </Link>
        <Link href={`/club/idea/${trending?.id ?? "nuclear-next-decade"}`} className="flex-1 bg-card border border-line rounded-[14px] px-[13px] py-[11px]">
          <span className="block text-[10px] font-black text-ink-3">AROUND FIC</span>
          <span className="block text-[12.5px] font-extrabold text-ink mt-1">🔥 {trending?.title.split(":")[0]} idea · {trending?.following} following</span>
        </Link>
      </div>

      {/* Continue learning — retained, lower */}
      <Link href={`/lesson/${next.lessonId}`} className="mt-[10px] bg-card border border-line rounded-[16px] px-[15px] py-3 flex items-center gap-3">
        <ArtPlaceholder round label="" className="w-10 h-10 shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[10.5px] font-extrabold text-orange">CONTINUE LEARNING · LESSON {next.lessonNo}</span>
          <span className="block text-[13.5px] font-black text-ink">{next.title}</span>
        </span>
        <span className="bg-orange text-cream-text rounded-[11px] px-[14px] py-2 text-[12px] font-black">{next.minutes} min</span>
      </Link>

      {/* Investing night / live · practice strip */}
      <div className="mt-[10px] flex gap-[9px]">
        <Link href="/live/family-investing-night" className="flex-1 bg-orange-tint border border-orange-line rounded-[14px] px-[13px] py-[10px] flex items-center gap-2">
          <span className="text-[16px]" aria-hidden>📅</span>
          <span className="text-[11.5px] font-extrabold text-orange-2 leading-[1.35]">Family Investing Night — {club.investingNight.when} · {club.investingNight.topic}</span>
        </Link>
      </div>
      <div className="mt-[9px] flex gap-[9px]">
        {live && (
          <Link href={`/live/${live.id}`} className="flex-1 bg-card border border-line rounded-[14px] px-[13px] py-[10px] flex items-center gap-2">
            <span className="rounded-[6px] bg-green px-[6px] py-[2px] text-[9px] font-black text-cream-text">● LIVE</span>
            <span className="flex-1 text-[11.5px] font-extrabold text-ink truncate">{live.title} · {live.watching}</span>
          </Link>
        )}
        <Link href="/practice" className="flex-1 bg-card border border-line rounded-[14px] px-[13px] py-[10px]">
          <span className="block text-[10px] font-black text-ink-3">MY PRACTICE</span>
          <span className="block text-[12.5px] font-extrabold text-ink">
            ${money(practice.totalValue)} <span className={practice.dayChangePct >= 0 ? "text-[#3A8C4A]" : "text-red"}>{practice.dayChangePct >= 0 ? "+" : ""}{practice.dayChangePct.toFixed(2)}%</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
