"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cx } from "@/components/ui";
import { BellIcon, SearchIcon } from "@/components/ui/icons";
import { BarChip, RingAvatar } from "@/components/community/BarChip";
import { CirclesRail } from "@/components/circles/CircleRing";
import { circles, mainFeed, type FeedPost } from "@/lib/fixtures/v12-social";
import { privateFeed } from "@/lib/fixtures/v12-social";
import { openSheet } from "@/components/sheets/bus";
import { Composer } from "./Composer";
import type { BeltColor } from "@/lib/types";

type LocalPost = { id: string; text: string; audience: string; at: number; artifact?: string; poll?: string[] };
function readPosts(): LocalPost[] { try { return JSON.parse(localStorage.getItem("fic.posts") || "[]"); } catch { return []; } }

/** Home v4 (canvas v11, board 12): one job — what is FIC talking about right now. */
export function HomeV4({ belt, clubName, initialFeed, openProposal }: { belt: BeltColor; clubName: string; initialFeed: "main" | "private"; openProposal: { id: string; text: string; voted: number; eligible: number; hoursLeft: number } | null }) {
  const [feed, setFeed] = useState<"main" | "private">(initialFeed);
  const [mine, setMine] = useState<LocalPost[]>([]);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [sentMain, setSentMain] = useState<{ text: string; at: number }[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setMine(readPosts());
    const on = () => setMine(readPosts());
    window.addEventListener("fic:posts", on);
    return () => window.removeEventListener("fic:posts", on);
  }, []);

  return (
    <div className="pb-6 pt-[14px]">
      {/* top bar: wordmark · search · bell · me */}
      <div className="flex items-center gap-[9px]">
        <span className="w-8 h-8 rounded-[10px] bg-green-2 text-cream-text font-black text-[12px] flex items-center justify-center">FIC</span>
        <span className="flex-1" />
        <Link href="/search" aria-label="Search" className="w-[33px] h-[33px] rounded-full bg-card border border-line flex items-center justify-center text-ink-2"><SearchIcon size={15} /></Link>
        <Link href="/profile/notifications" aria-label="Notifications" className="relative w-[33px] h-[33px] rounded-full bg-card border border-line flex items-center justify-center text-ink-2">
          <BellIcon size={15} /><span className="absolute top-[5px] right-[6px] w-[7px] h-[7px] rounded-full bg-orange border-[1.5px] border-white" />
        </Link>
        <Link href="/profile" aria-label="Me"><RingAvatar initial="K" bg="bg-green-2" ring={belt} size={33} /></Link>
      </div>

      {/* circles rail */}
      <CirclesRail items={circles} onPropose={
        <button type="button" onClick={() => setProposeOpen(true)} className="flex flex-col items-center gap-[3px] w-14 shrink-0">
          <span className="w-14 h-14 rounded-full border-2 border-dashed border-[#D9CDB2] flex items-center justify-center text-ink-4 text-[20px] font-extrabold">＋</span>
          <span className="text-[9px] font-extrabold text-ink-4">Propose</span>
        </button>
      } />

      {/* Main | Private switch */}
      <div className="mt-[10px] flex items-center justify-between">
        <span className="text-[14px] font-black text-ink">{feed === "main" ? "Main Feed" : clubName}</span>
        <button type="button" role="switch" aria-checked={feed === "private"} aria-label="Show private club feed" onClick={() => setFeed((f) => (f === "main" ? "private" : "main"))} className="inline-flex items-center gap-[7px]">
          <span className={cx("text-[10px] font-black", feed === "main" ? "text-green" : "text-ink-4")}>MAIN</span>
          <span className={cx("relative w-10 h-[23px] rounded-[13px] transition", feed === "main" ? "bg-[#DCD2BC]" : "bg-green-2")}>
            <span className={cx("absolute top-[2.5px] w-[18px] h-[18px] rounded-full bg-[#FFFDF7] shadow-[0_1px_3px_rgba(46,42,33,0.3)] transition-all", feed === "main" ? "left-[3px]" : "left-[19px]")} />
          </span>
          <span className={cx("text-[10px] font-extrabold", feed === "private" ? "text-green" : "text-ink-4")}>🔒 PRIVATE</span>
        </button>
      </div>

      {feed === "main" ? (
        <div className="mt-[6px]">
          {sentMain.map((m, i) => <MinePost key={`sent-${i}`} p={{ id: `sent-${i}`, text: m.text, audience: "main", at: m.at }} belt={belt} />)}
          {mine.filter((p) => p.audience === "main").map((p) => <MinePost key={p.id} p={p} belt={belt} />)}
          {mainFeed.map((p, i) => <Post key={p.id} p={p} last={i === mainFeed.length - 1} />)}
          {/* The composer is the point of a conversation-first Home — it belongs on BOTH feeds. */}
          <Composer audience="main" clubName={clubName} onLocalEcho={(t) => setSentMain((x) => [{ text: t, at: Date.now() }, ...x])} />
        </div>
      ) : (
        <PrivateFeed clubName={clubName} proposal={openProposal} mine={mine.filter((p) => p.audience === "private")} belt={belt} />
      )}

      {proposeOpen && <ProposeCircleSheet onClose={() => setProposeOpen(false)} />}
    </div>
  );
}

/** $TICKER mentions tap to the company page. */
function Cash({ t }: { t: string }) {
  const parts = t.split(/(\$[A-Z]{1,5})/g);
  return <>{parts.map((x, i) => /^\$[A-Z]{1,5}$/.test(x) ? <Link key={i} href={`/discover/${x.slice(1)}`} className="text-green font-black">{x}</Link> : <span key={i}>{x}</span>)}</>;
}

function Author({ a }: { a: FeedPost extends infer T ? (T extends { author: infer A } ? A : never) : never }) {
  const x = a as { name: string; initial: string; bg: string; belt: BeltColor | null; beltLabel?: string };
  return (
    <div className="flex items-center gap-2">
      <RingAvatar initial={x.initial} bg={x.bg} ring={x.belt} size={30} />
      <span className="text-[12.5px] font-black text-ink">{x.name}</span>
      {x.belt && <BarChip color={x.belt} label={x.beltLabel ?? ""} />}
    </div>
  );
}

function Post({ p, last }: { p: FeedPost; last: boolean }) {
  const [liked, setLiked] = useState(false);
  const [voted, setVoted] = useState<number | null>(null);
  const row = cx("py-[10px]", !last && "border-b border-[#F1E8D4]");
  if (p.kind === "kai") {
    return (
      <div className={row}>
        <div className="flex items-center gap-2">
          <RingAvatar initial="K" bg="bg-purple" ring="white" size={30} />
          <span className="text-[12.5px] font-black text-purple-2">Kai ✦</span>
          <span className="rounded-[7px] bg-purple-tint text-purple-2 px-[7px] py-[1px] text-[8.5px] font-black">SUMMARY</span>
          <span className="text-[9.5px] font-extrabold text-ink-4">· {p.ago}</span>
        </div>
        <p className="mt-[5px] text-[12px] font-semibold text-ink-2 leading-[1.5]">{p.text} <Link href={`/circle/${p.circleId}`} className="text-purple-2 font-extrabold">Join the circle →</Link></p>
      </div>
    );
  }
  if (p.kind === "clubvote") {
    return (
      <div className={row}>
        <div className="flex items-center gap-2"><RingAvatar initial={p.initial} bg="bg-green-2" ring={null} size={30} /><span className="text-[12.5px] font-black text-ink">{p.club}</span><span className="rounded-[6px] border border-line px-[6px] py-[1px] text-[8.5px] font-black text-ink-3">PUBLIC</span><span className="text-[9.5px] font-extrabold text-ink-4">· {p.ago}</span></div>
        <div className="mt-[7px] flex items-center gap-3 bg-[#FBF6EA] border border-[#EFE4CF] rounded-[12px] px-3 py-[9px]">
          <span className="w-[46px] h-[46px] rounded-full border-[4px] border-green-2 flex items-center justify-center text-[12px] font-black text-green shrink-0">{p.pct}%</span>
          <span className="flex-1"><span className="block text-[12.5px] font-black text-ink"><Cash t={p.question} /></span><span className="block text-[10px] font-extrabold text-ink-3">{p.voted} of {p.eligible} voted · closes in {p.closesIn}</span></span>
          <Link href={`/discover/${p.symbol}`} className="rounded-[9px] bg-purple-2 text-cream-text px-3 py-[6px] text-[10px] font-black">Vote</Link>
        </div>
      </div>
    );
  }
  if (p.kind === "circleref") {
    return (
      <div className={row}>
        <div className="flex items-center gap-2"><Author a={p.author} /><span className="text-[9.5px] font-extrabold text-ink-4">· {p.ago}</span></div>
        <p className="mt-[5px] text-[12.5px] font-semibold text-ink leading-[1.45]"><Cash t={p.text} /></p>
        <Link href={`/circle/${p.circleId}`} className="mt-[6px] flex items-center gap-[9px] bg-[#FBF6EA] border border-[#EFE4CF] rounded-[11px] px-[11px] py-2">
          <span className="text-[16px]">📊</span><span className="flex-1 text-[11px] font-black text-ink">{p.circleLabel} <span className="text-ink-3 font-extrabold">· {p.people} in · {p.daysLeft}d left</span></span><span className="text-[11px] font-black text-green">Join ›</span>
        </Link>
      </div>
    );
  }
  if (p.kind === "promotion") {
    return (
      <div className={row}>
        <div className="flex items-center gap-2"><Author a={p.author} /><span className="rounded-[6px] bg-paper-2 px-[6px] py-[1px] text-[8.5px] font-black text-ink-3">{p.scope}</span><span className="text-[9.5px] font-extrabold text-ink-4">· {p.ago}</span></div>
        <div className="mt-[6px] flex items-center gap-[9px] bg-[#FBEFC9] rounded-[11px] px-[11px] py-2 text-[12px] font-bold text-ink"><span className="w-8 h-[10px] rounded-[3px] bg-[#E9B949]" />Promoted to <b className="font-black">{p.toBelt}</b> · {p.xp} XP <span className="ml-auto">🎉</span></div>
      </div>
    );
  }
  if (p.kind === "poll") {
    return (
      <div className={row}>
        <div className="flex items-center gap-2"><Author a={p.author} /><span className="text-[9.5px] font-extrabold text-ink-4">· {p.ago}</span></div>
        <p className="mt-[5px] text-[12.5px] font-semibold text-ink leading-[1.45]">{p.question}</p>
        <div className="mt-[6px] flex flex-col gap-1">
          {p.options.map((o, i) => (
            <button key={o.label} type="button" onClick={() => setVoted(i)} aria-pressed={voted === i} className="relative bg-paper-2 rounded-[9px] overflow-hidden text-left">
              <span className="absolute inset-y-0 left-0 bg-purple-line" style={{ width: `${o.pct}%` }} />
              <span className={cx("relative flex justify-between px-[11px] py-[6px] text-[11px] font-extrabold text-ink", voted === i && "font-black")}>{voted === i ? "✓ " : ""}{o.label}<span>{o.pct}%</span></span>
            </button>
          ))}
        </div>
        <div className="mt-[5px] text-[9.5px] font-extrabold text-ink-3">{p.votes.toLocaleString()} votes · from the <Link href={`/circle/${p.circleId}`} className="text-orange-2 font-black">{p.circleLabel}</Link> circle</div>
      </div>
    );
  }
  return (
    <div className={row}>
      <div className="flex items-center gap-2"><Author a={p.author} /><span className="text-[9.5px] font-extrabold text-ink-4">· {p.ago}</span></div>
      <p className="mt-[5px] text-[12.5px] font-semibold text-ink leading-[1.45]"><Cash t={p.text} /></p>
      {p.pick && (
        <Link href={`/discover/${p.pick.symbol}`} className="mt-[6px] flex items-center gap-[9px] bg-[#FBF6EA] border border-[#EFE4CF] rounded-[11px] px-[11px] py-2">
          <span className="w-[30px] h-[30px] rounded-[9px] bg-line-2 flex items-center justify-center text-[8.5px] font-black text-ink-2">{p.pick.symbol}</span>
          <span className="flex-1 text-[11px] font-black text-ink">{p.pick.name} · {p.pick.stance} <span className="text-[#3A8C4A]">+{p.pick.sincePct}% since pick</span> <span className="text-ink-3 font-extrabold">· ✓ verified owner</span></span>
          <svg width="60" height="16" viewBox="0 0 60 16" preserveAspectRatio="none" className="shrink-0"><polyline fill="none" stroke="#4C8C4A" strokeWidth="2" points={p.pick.spark.map((y, i) => `${i * 12},${y}`).join(" ")} /></svg>
        </Link>
      )}
      <div className="mt-[6px] flex gap-[14px] text-[10px] font-extrabold text-ink-3">
        <span>💬 {p.replies}</span>
        <button type="button" onClick={() => setLiked((v) => !v)} aria-pressed={liked} className={liked ? "text-green" : undefined}>👍 {p.likes + (liked ? 1 : 0)}</button>
        <span>🔁 {p.reposts}</span>
        <button type="button" onClick={() => openSheet("compose", { audience: "main", reply: p.author.name })} className="ml-auto text-purple-2">@mention · reply →</button>
      </div>
    </div>
  );
}

function MinePost({ p, belt }: { p: LocalPost; belt: BeltColor }) {
  return (
    <div className="py-[10px] border-b border-[#F1E8D4]">
      <div className="flex items-center gap-2"><RingAvatar initial="K" bg="bg-green-2" ring={belt} size={30} /><span className="text-[12.5px] font-black text-ink">Kway</span><BarChip color={belt} label={belt[0].toUpperCase() + belt.slice(1)} /><span className="text-[9.5px] font-extrabold text-ink-4">· just now</span></div>
      <p className="mt-[5px] text-[12.5px] font-semibold text-ink leading-[1.45]">{p.text}</p>
      {p.artifact && <span className="mt-[6px] inline-flex rounded-[9px] bg-[#FBF6EA] border border-[#EFE4CF] px-[10px] py-[5px] text-[10.5px] font-black text-ink-2">{p.artifact}</span>}
      {p.poll && <div className="mt-[6px] flex flex-col gap-1">{p.poll.map((o) => <span key={o} className="bg-paper-2 rounded-[9px] px-[11px] py-[6px] text-[11px] font-extrabold text-ink">{o}</span>)}</div>}
      <div className="mt-[6px] flex gap-[14px] text-[10px] font-extrabold text-ink-3"><span>💬 0</span><span>👍 0</span><span>🔁 0</span></div>
    </div>
  );
}

function PrivateFeed({ clubName, proposal, mine, belt }: { clubName: string; proposal: { id: string; text: string; voted: number; eligible: number; hoursLeft: number } | null; mine: LocalPost[]; belt: BeltColor }) {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div className="mt-[6px] relative">
      <div className="flex items-center gap-2 bg-card border border-line rounded-[13px] px-3 py-2">
        <span className="flex -space-x-2">{[["K", "bg-green-2"], ["D", "bg-[#B08968]"], ["A", "bg-green-3"]].map(([i, c]) => <span key={i} className={cx("w-7 h-7 rounded-full text-white text-[10px] font-black flex items-center justify-center border-2 border-[#FFFDF7]", c)}>{i}</span>)}</span>
        <span className="flex-1"><span className="block text-[12.5px] font-black text-ink">{clubName}</span><span className="block text-[10px] font-extrabold text-green">● 3 online</span></span>
        <Link href="/club" className="text-[11px] font-black text-green">Club page ›</Link>
      </div>
      <div className="mt-2 flex flex-col gap-[9px]">
        {privateFeed.slice(0, 3).map((m) => <PrivateBubble key={m.id} m={m} />)}
        {proposal && (
          <div className="flex items-center gap-[10px] bg-purple-tint border border-purple-line rounded-[13px] px-[13px] py-[9px]">
            <span className="text-[15px]">🗳</span>
            <span className="flex-1"><span className="block text-[11.5px] font-black text-ink"><Cash t={`Vote open: $CEG 4% → 8%`} /></span><span className="block text-[10px] font-extrabold text-ink-3">{proposal.voted}/{proposal.eligible} in · {proposal.hoursLeft}h left · waiting on you</span></span>
            <Link href={`/club/vote/${proposal.id}`} className="rounded-[9px] bg-purple-2 text-cream-text px-3 py-[6px] text-[10px] font-black">Vote</Link>
          </div>
        )}
        {privateFeed.slice(3).map((m) => <PrivateBubble key={m.id} m={m} />)}
        {mine.map((p) => <MinePost key={p.id} p={p} belt={belt} />)}
        {sent.map((t, i) => <div key={i} className="flex justify-end"><div className="max-w-[82%] bg-green-tint border border-green-line rounded-[13px_3px_13px_13px] px-3 py-2 text-[12px] font-semibold text-ink"><Cash t={t} /></div></div>)}
      </div>
      {/* Real club chat: /api/club/chat writes a chat_messages row (was a local-only echo). */}
      <Composer audience="private" clubName={clubName} onLocalEcho={(t) => setSent((x) => [...x, t])} />
    </div>
  );
}

function PrivateBubble({ m }: { m: (typeof privateFeed)[number] }) {
  if (m.mine) return <div className="flex justify-end"><div className="max-w-[82%] bg-green-tint border border-green-line rounded-[13px_3px_13px_13px] px-3 py-2"><div className="text-[12px] font-semibold text-ink"><Cash t={m.text} /></div></div></div>;
  return (
    <div className="flex gap-2">
      <RingAvatar initial={m.initial} bg={m.bg} ring={m.belt} size={28} />
      <div className="max-w-[82%]">
        <div className="bg-card border border-line rounded-[3px_13px_13px_13px] px-3 py-2">
          <div className="text-[10px] font-black text-ink">{m.name}{m.grad ? " 🎓" : ""} <span className="text-ink-4 font-extrabold">· {m.time}</span></div>
          <div className="text-[12px] font-semibold text-ink leading-[1.4] mt-[2px]"><Cash t={m.text} /></div>
          {m.artifact && <Link href={m.artifact.href} className="mt-[6px] flex items-center gap-2 bg-[#FBF6EA] rounded-[9px] px-[9px] py-[6px]"><span className="rounded-[6px] bg-line-2 px-[6px] py-[1px] text-[8.5px] font-black text-ink-2">{m.artifact.symbol}</span><span className="flex-1"><span className="block text-[11px] font-black text-ink">{m.artifact.title}</span><span className="block text-[9.5px] font-extrabold text-ink-3">{m.artifact.sub}</span></span><span className="text-[10.5px] font-black text-green">Open ›</span></Link>}
        </div>
      </div>
    </div>
  );
}

function ProposeCircleSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const save = () => { try { const cur = JSON.parse(localStorage.getItem("fic.circles.proposed") || "[]"); localStorage.setItem("fic.circles.proposed", JSON.stringify([...cur, { name, at: Date.now() }])); } catch { /* ignore */ } setDone(true); };
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" role="dialog" aria-label="Propose a circle">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[#2E2A21]/40" />
      <div className="relative bg-[#FFFDF7] rounded-t-[26px] px-5 pt-[13px] pb-8 shadow-[0_-10px_34px_rgba(46,42,33,0.3)]">
        <div className="w-10 h-[5px] rounded-[3px] bg-[#D9CDB2] mx-auto" />
        <div className="mt-[14px] text-[14px] font-black text-ink">Propose a circle</div>
        <p className="text-[10.5px] font-bold text-ink-3 mt-[2px]">Circles are 30-day rooms around one event or theme. Editorial, Kai, Black Belts and ticker spikes open them — proposals get reviewed within a day.</p>
        {done ? (
          <div className="mt-4 rounded-[13px] bg-green-tint border border-green-line px-4 py-3 text-[12px] font-black text-green">Proposed “{name}” · you’ll be notified if it opens.</div>
        ) : (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Costco Earnings · Sep 25" className="mt-3 w-full h-11 rounded-[12px] border border-line bg-card px-3 text-[13px] font-bold text-ink placeholder:text-ink-4 outline-none focus:border-green" />
            <button type="button" disabled={name.trim().length < 3} onClick={save} className="mt-3 w-full h-11 rounded-[13px] bg-orange text-cream-text text-[13px] font-black disabled:opacity-50">Propose</button>
          </>
        )}
      </div>
    </div>
  );
}
