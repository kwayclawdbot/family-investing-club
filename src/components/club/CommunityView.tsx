"use client";
import Link from "next/link";
import type { ClubPost, Community } from "@/lib/types";
import { cx } from "@/components/ui";
import { BellIcon } from "@/components/ui/icons";
import { ClubToggle, MemberAvatar, StanceTag } from "./club-shared";
import { IdeaCard, PollCard, QuestionCard, sampleQuestion } from "./cards";
import { useStored } from "./storage";

const avatarColor = ["bg-coral", "bg-purple", "bg-green-3"];
const memberHref: Record<string, string> = { "Sarah J.": "/club/members/sarah-j", "Michael T.": "/club/members/michael-t" };

/** Artboard 07 (canonical) + 12 — the public FIC network layer. */
export function CommunityView({ c, feed, groupIds }: { c: Community; feed: ClubPost[]; groupIds: string[] }) {
  const [followed, setFollowed] = useStored<string[]>("fic.follow.ideas", []);
  const [joined, setJoined] = useStored<string[]>("fic.groups.public", []);
  const idea = c.trendingIdeas[0];
  const isF = followed.includes(idea.id);
  return (
    <div className="pb-6">
      <div className="flex items-center justify-between pt-[14px]">
        <h1 className="text-[21px] font-black text-ink">Club</h1>
        <Link href="/profile/notifications" aria-label="Notifications" className="text-ink-4"><BellIcon /></Link>
      </div>
      <ClubToggle active="community" />
      <div className="mt-[11px] text-center text-[11px] font-extrabold text-ink-3">🌍 What is the FIC network thinking?</div>

      <div className="mt-[9px] bg-card border border-line rounded-[16px] px-[15px] py-3">
        <div className="flex justify-between">
          <span className="text-[12px] font-black text-orange">🔥 TRENDING IDEAS</span>
          <Link href="/club/idea/nuclear-next-decade" className="text-[10.5px] font-extrabold text-purple-2">All ›</Link>
        </div>
        <div className="mt-[7px] flex items-center gap-[10px]">
          <Link href={`/club/idea/${idea.id}`} className="flex-1 min-w-0">
            <div className="text-[13.5px] font-black text-ink">{idea.title}</div>
            <div className="text-[10.5px] font-bold text-ink-3">{idea.author} · {idea.status} · {idea.following + (isF ? 1 : 0)} following · {idea.symbols.join(" ")}</div>
          </Link>
          <button aria-pressed={isF} onClick={() => setFollowed(isF ? followed.filter((x) => x !== idea.id) : [...followed, idea.id])} className={cx("rounded-[10px] px-[11px] py-[6px] text-[10.5px] font-black border-[1.5px] border-purple", isF ? "bg-purple text-cream-text" : "text-purple-2")}>{isF ? "Following" : "Follow"}</button>
        </div>
      </div>

      <div className="mt-[9px] bg-card border border-line rounded-[16px] px-[15px] py-3">
        <span className="text-[12px] font-black text-green">▲ POPULAR PICKS TODAY</span>
        <div className="flex gap-2 mt-2">
          {c.popularPicks.map((p) => (
            <Link key={p.symbol} href={`/discover/${p.symbol}`} className="flex-1 bg-paper border border-line rounded-[12px] px-[11px] py-[9px] min-w-0">
              <div className={cx("text-[11px] font-black", p.stance === "buy" ? "text-green" : "text-orange-2")}>{p.symbol} · {p.stance.toUpperCase()}</div>
              <div className="text-[10px] font-bold text-ink-3 mt-[2px] truncate">&quot;{p.quote}&quot; · {p.agree}{p.stance === "buy" ? " agree" : ""}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-[9px] bg-card border border-line rounded-[16px] px-[15px] py-3">
        <span className="text-[12px] font-black text-purple-2">🏛 PUBLIC CLUBS</span>
        {c.publicClubs.map((g, i) => {
          const isJ = joined.includes(g.id);
          const view = groupIds.includes(g.id);
          return (
            <div key={g.id} className="flex items-center gap-[10px] mt-2">
              <span className={cx("w-8 h-8 rounded-[11px] flex items-center justify-center text-[15px]", i === 0 ? "bg-[#FFFDF4]" : "bg-orange-tint")}>{g.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-extrabold text-ink">{g.name} · {g.members >= 1000 ? `${(g.members / 1000).toFixed(1)}k` : `${g.members} members`}</div>
                <div className="text-[10px] font-bold text-ink-3">{g.blurb}</div>
              </div>
              {i === 0 ? (
                <button aria-pressed={isJ} onClick={() => setJoined(isJ ? joined.filter((x) => x !== g.id) : [...joined, g.id])} className={cx("rounded-[9px] px-[11px] py-[5px] text-[10px] font-black", isJ ? "bg-green-2 text-cream-text" : "bg-purple text-cream-text")}>{isJ ? "Joined ✓" : "Join"}</button>
              ) : (
                <Link href={view ? `/club/groups/${g.id}` : "/club/groups"} className="rounded-[9px] px-[11px] py-[5px] text-[10px] font-black border-[1.5px] border-purple text-purple-2">View</Link>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-[9px] mt-[9px]">
        <div className="flex-1 bg-card border border-line rounded-[14px] px-3 py-[10px]">
          <div className="text-[10.5px] font-black text-ink-3">🔍 MOST RESEARCHED</div>
          <div className="text-[11.5px] font-extrabold text-ink mt-1 flex flex-wrap gap-x-1">
            {c.mostResearched.map((m, i) => (
              <span key={m.symbol}><Link href={`/discover/${m.symbol}`}>{m.symbol}</Link>{i < c.mostResearched.length - 1 ? " ·" : ""}</span>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-card border border-line rounded-[14px] px-3 py-[10px]">
          <div className="text-[10.5px] font-black text-ink-3">👥 PEOPLE TO FOLLOW</div>
          <div className="flex items-center mt-1">
            {c.peopleToFollow.map((p, i) => (
              <Link key={p.id} href={`/club/members/${p.id}`} aria-label={p.name} style={{ marginLeft: i ? -6 : 0 }} className="flex">
                <MemberAvatar m={{ initial: p.initial, color: avatarColor[i % 3] }} size={22} />
              </Link>
            ))}
            <Link href="/club/groups" className="text-[10.5px] font-extrabold text-purple-2 ml-[6px]">12 ›</Link>
          </div>
        </div>
      </div>

      {c.live && (
        <Link href={`/live/${c.live.id}`} className="mt-[9px] bg-card border border-line rounded-[14px] px-[14px] py-[11px] flex items-center gap-[10px]">
          <span className="bg-red text-cream-text rounded-[7px] px-2 py-[2px] text-[9.5px] font-black">● LIVE</span>
          <span className="flex-1 text-[12px] font-extrabold text-ink">{c.live.title} · {c.live.inRoom} in the room</span>
          <span className="text-[11px] font-black text-purple-2">Join ›</span>
        </Link>
      )}

      {c.publicPicks.map((pk) => (
        <div key={pk.id} className="mt-[9px] bg-card border border-line rounded-[16px] px-[15px] py-3">
          <div className="flex gap-[10px]">
            <MemberAvatar m={{ initial: pk.author.charAt(0), color: "bg-purple" }} />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-bold text-[#4A4436]"><Link href={`/club/members/${pk.authorId}`} className="font-black">{pk.author}</Link> · Public Pick · {pk.ago}</div>
              <div className="mt-[5px] flex items-center gap-2 flex-wrap">
                <StanceTag symbol={pk.symbol} stance={pk.stance} />
                <span className="text-[11.5px] font-bold text-ink-2">&quot;{pk.reason.replace(/\.$/, "").toLowerCase()}&quot; · {pk.horizon} horizon</span>
              </div>
              <div className="mt-[5px] text-[10.5px] font-extrabold text-ink-3">👍 {pk.agree} agree · 🤔 {pk.notSure}</div>
            </div>
          </div>
        </div>
      ))}

      <div className="mt-4 text-[11px] font-black text-ink-3">LATEST FROM THE NETWORK</div>
      {feed.map((post, i) =>
        post.kind === "idea" ? <IdeaCard key={i} idea={post.idea} authorHref={memberHref[post.idea.author]} />
        : post.kind === "portfolio" ? null
        : <PollCard key={i} {...post} authorHref={memberHref[post.author]} />
      )}
      <QuestionCard q={sampleQuestion} />
      <p className="mt-4 text-center text-[11px] font-bold text-ink-4">Community ideas are for learning and discussion — not personalized advice.</p>
    </div>
  );
}
