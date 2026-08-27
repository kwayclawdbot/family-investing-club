"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Community, CommunityChat, CommunityClub, CommunityLive, CommunityPost } from "@/lib/types";
import { cx } from "@/components/ui";
import { EmptyState, Toggle } from "@/components/ui/extras";
import { SearchIcon } from "@/components/ui/icons";
import { PickPost, ClubVotePost, PromotionPost } from "./posts";
import { RingAvatar } from "./BarChip";

export type Tab = "feed" | "chats" | "clubs" | "live";
const TABS: { id: Tab; label: string }[] = [{ id: "feed", label: "Feed" }, { id: "chats", label: "Chats" }, { id: "clubs", label: "Clubs" }, { id: "live", label: "Live" }];
const SUB = ["For You", "Following", "Trending"] as const;

function useStored<T>(key: string, init: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(init);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      if (raw) setV(JSON.parse(raw));
    } catch { /* storage unavailable */ }
  }, [key]);
  const set = (n: T) => { setV(n); try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* ignore */ } };
  return [v, set];
}

/** Community — the 6th destination (canvas v9, artboard 05): Feed · Chats · Clubs · Live. */
export function CommunityHub({ tab, posts, chats, clubs, live, network, groupIds }: {
  tab: Tab; posts: CommunityPost[]; chats: CommunityChat[]; clubs: CommunityClub[]; live: CommunityLive[]; network: Community; groupIds: string[];
}) {
  const [sub, setSub] = useState<(typeof SUB)[number]>("For You");
  const [follow] = useStored<string[]>("fic.follow", []);
  const [joined, setJoined] = useStored<string[]>("fic.clubs.joined", []);
  const [remind, setRemind] = useStored<string[]>("fic.remind.community", []);

  const visible = sub === "For You" ? posts : sub === "Trending" ? [...posts].sort((a, b) => score(b) - score(a)) : posts.filter((p) => "author" in p && follow.includes(p.author));

  return (
    <div className="pb-6 pt-[14px]">
      <div className="flex items-center justify-between">
        <h1 className="text-[21px] font-black text-ink">Community</h1>
        <div className="flex gap-2">
          <Link href="/search" aria-label="Search" className="w-[34px] h-[34px] rounded-full bg-card border border-line flex items-center justify-center text-ink-2"><SearchIcon size={15} /></Link>
          <Link href="/club/new" aria-label="Compose" className="w-[34px] h-[34px] rounded-[11px] bg-[#2E5233] text-cream-text flex items-center justify-center text-[15px] font-black">✎</Link>
        </div>
      </div>

      <div className="mt-[10px] flex bg-[#EFE7D6] rounded-[12px] p-[3px]" role="tablist">
        {TABS.map((t) => (
          <Link key={t.id} href={t.id === "feed" ? "/community" : `/community?tab=${t.id}`} role="tab" aria-selected={tab === t.id} className={cx("flex-1 text-center rounded-[9px] py-[7px] text-[12px]", tab === t.id ? "bg-[#2E5233] text-cream-text font-black" : "text-ink-3 font-extrabold")}>{t.label}</Link>
        ))}
      </div>

      {tab === "feed" && (
        <>
          <div className="flex gap-[7px] mt-[9px]" role="tablist">
            {SUB.map((s) => (
              <button key={s} role="tab" aria-selected={sub === s} onClick={() => setSub(s)} className={cx("rounded-[16px] px-[13px] py-[5px] text-[11px]", sub === s ? "bg-ink text-cream-text font-black" : "bg-card border border-line text-ink-3 font-extrabold")}>{s}</button>
            ))}
          </div>
          {visible.length === 0 ? (
            <div className="mt-4"><EmptyState emoji="👥" title="Nobody followed yet" body="Follow people from their profile and their picks, votes and promotions land here." action="Browse people" href="/club/members/sarah-j" /></div>
          ) : (
            <div>
              {visible.map((p) => p.kind === "pick" ? <PickPost key={p.id} p={p} /> : p.kind === "clubvote" ? <ClubVotePost key={p.id} p={p} /> : <PromotionPost key={p.id} p={p} />)}
            </div>
          )}
          <NetworkSection c={network} />
        </>
      )}

      {tab === "chats" && (
        <div className="mt-2">
          {chats.map((c, i) => {
            const href = groupIds.includes(c.id) ? `/club/groups/${c.id}` : c.id === "mensah" ? "/club" : null;
            const inner = (
              <>
                <span className="w-[38px] h-[38px] rounded-[12px] bg-paper-2 flex items-center justify-center text-[18px] shrink-0">{c.emoji}</span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2"><span className="text-[13px] font-black text-ink truncate">{c.name}</span><span className="text-[10px] font-extrabold text-ink-4">{c.members.toLocaleString()}</span><span className="ml-auto text-[10px] font-extrabold text-ink-4">{c.ago}</span></span>
                  <span className="block text-[11.5px] font-bold text-ink-3 truncate">{c.last}</span>
                </span>
                {c.unread ? <span className="w-[18px] h-[18px] rounded-full bg-orange text-cream-text text-[9.5px] font-black flex items-center justify-center shrink-0">{c.unread}</span> : null}
              </>
            );
            const cls = cx("flex items-center gap-[10px] py-[10px] w-full text-left", i < chats.length - 1 && "border-b border-[#F1E8D4]");
            return href ? <Link key={c.id} href={href} className={cls}>{inner}</Link> : <div key={c.id} className={cls}>{inner}</div>;
          })}
          <p className="mt-3 text-[11px] font-bold text-ink-4 text-center">Chat rooms open with the community engine — rooms listed here mirror your clubs and research ideas.</p>
        </div>
      )}

      {tab === "clubs" && (
        <div className="mt-3 flex flex-col gap-[10px]">
          {clubs.map((c) => {
            const j = joined.includes(c.id) || c.joined;
            return (
              <div key={c.id} className="bg-card border border-line rounded-[16px] px-[14px] py-3 flex items-center gap-3">
                <span className="w-11 h-11 rounded-[13px] bg-paper-2 flex items-center justify-center text-[20px] shrink-0">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-black text-ink">{c.name}</div>
                  <div className="text-[10.5px] font-extrabold text-ink-3">{c.members.toLocaleString()} members · {c.blurb}{c.ytdPct != null && !c.blurb.includes("YTD") ? ` · +${c.ytdPct}% YTD` : ""}</div>
                </div>
                {groupIds.includes(c.id) ? (
                  <Link href={`/club/groups/${c.id}`} className="rounded-[10px] border-[1.5px] border-line px-3 py-[7px] text-[11px] font-black text-ink-2">View</Link>
                ) : (
                  <button aria-pressed={j} onClick={() => setJoined(j ? joined.filter((x) => x !== c.id) : [...joined, c.id])} className={cx("rounded-[10px] px-3 py-[7px] text-[11px] font-black", j ? "bg-green-tint text-green" : "bg-purple text-cream-text")}>{j ? "Joined" : "Join"}</button>
                )}
              </div>
            );
          })}
          <Link href="/club/create" className="text-center text-[12px] font-black text-green py-2">Start your own club →</Link>
        </div>
      )}

      {tab === "live" && (
        <div className="mt-3">
          {live.filter((l) => l.status === "live").map((l) => (
            <Link key={l.id} href={`/live/${l.id}`} className="flex items-center gap-3 bg-card border border-line rounded-[16px] px-[14px] py-3">
              <span className="rounded-[7px] bg-[#FBE9E4] text-red text-[9.5px] font-black px-2 py-[3px]">● LIVE</span>
              <span className="flex-1 min-w-0"><span className="block text-[13.5px] font-black text-ink">{l.title}</span><span className="block text-[10.5px] font-extrabold text-ink-3">{l.host} · {l.inRoom} in the room</span></span>
              <span className="bg-orange text-cream-text rounded-[10px] px-3 py-[7px] text-[11px] font-black">Join</span>
            </Link>
          ))}
          <div className="mt-3 mb-1 text-[12px] font-black text-ink-3">UPCOMING</div>
          {live.filter((l) => l.status === "upcoming").map((l, i, arr) => {
            const on = remind.includes(l.id);
            return (
              <div key={l.id} className={cx("flex items-center gap-3 py-[10px]", i < arr.length - 1 && "border-b border-[#F1E8D4]")}>
                <span className="flex-1 min-w-0"><Link href={`/live/${l.id}`} className="block text-[13px] font-black text-ink">{l.title}</Link><span className="block text-[10.5px] font-extrabold text-ink-3">{l.when} · {l.host}</span></span>
                <span className="text-[10.5px] font-extrabold text-ink-3">Remind</span>
                <Toggle checked={on} onChange={(v) => setRemind(v ? [...remind, l.id] : remind.filter((x) => x !== l.id))} label={`Remind me: ${l.title}`} />
              </div>
            );
          })}
          <Link href="/live" className="block text-center text-[12px] font-black text-green py-3">All classes & recordings →</Link>
        </div>
      )}
    </div>
  );
}

function score(p: CommunityPost) { return p.kind === "pick" ? p.likes + p.comments : p.kind === "clubvote" ? p.voted * 10 : 5; }

/** Everything the v4 network layer had, kept below the stream. */
function NetworkSection({ c }: { c: Community }) {
  const idea = c.trendingIdeas[0];
  return (
    <div className="mt-4">
      <div className="text-[12px] font-black text-ink-3 mb-1">FROM THE NETWORK</div>
      <Link href={`/club/idea/${idea.id}`} className="flex items-center gap-[10px] py-[9px] border-b border-[#F1E8D4]">
        <span className="text-[16px]">🔥</span>
        <span className="flex-1 min-w-0"><span className="block text-[13px] font-black text-ink truncate">{idea.title}</span><span className="block text-[10.5px] font-bold text-ink-3">{idea.author} · {idea.status} · {idea.following} following · {idea.symbols.join(" ")}</span></span>
        <span className="text-ink-4 font-black">›</span>
      </Link>
      <div className="flex gap-2 py-[9px] border-b border-[#F1E8D4]">
        {c.popularPicks.map((p) => (
          <Link key={p.symbol} href={`/discover/${p.symbol}`} className="flex-1 bg-card border border-line rounded-[12px] px-3 py-2">
            <span className="block text-[12px] font-black text-ink">{p.symbol} · <span className={p.stance === "buy" ? "text-green" : "text-orange-2"}>{p.stance.toUpperCase()}</span></span>
            <span className="block text-[10px] font-bold text-ink-3">“{p.quote}” · {p.agree} agree</span>
          </Link>
        ))}
      </div>
      <div className="py-[9px] border-b border-[#F1E8D4]">
        <span className="text-[10px] font-black text-ink-3">MOST RESEARCHED</span>
        <div className="flex gap-[6px] mt-[6px] flex-wrap">
          {c.mostResearched.map((m) => (
            <Link key={m.symbol} href={`/discover/${m.symbol}`} className="rounded-[8px] bg-paper-2 px-2 py-1 text-[11px] font-black text-ink-2">{m.symbol} <span className="text-ink-4">{m.count}</span></Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 py-[9px]">
        <span className="text-[10px] font-black text-ink-3 mr-1">PEOPLE TO FOLLOW</span>
        {c.peopleToFollow.map((p, i) => (
          <Link key={p.id} href={`/club/members/${p.id}`} className={i > 0 ? "-ml-2" : ""}><RingAvatar initial={p.initial} bg={["bg-coral", "bg-purple", "bg-green-3"][i % 3]} ring={null} size={26} /></Link>
        ))}
        <Link href="/club/members/sarah-j" className="ml-auto text-[11px] font-black text-purple-2">12 ›</Link>
      </div>
    </div>
  );
}
