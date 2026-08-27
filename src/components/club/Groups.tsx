"use client";
import Link from "next/link";
import { useState } from "react";
import type { Group, Challenge, Member, Idea } from "@/lib/types";
import { Avatar, Segmented, Tag, cx } from "@/components/ui";
import { EmptyState } from "@/components/ui/extras";
import { ChevronRight } from "@/components/ui/icons";
import { IdeaCard, QuestionCard, sampleQuestion, cardCls } from "./cards";
import { useStored, useLevel } from "./storage";

const KIND_LABEL: Record<Group["kind"], string> = { family: "Family", class: "Class", topic: "Topic", org: "Organization" };
const KIND_TONE: Record<Group["kind"], "orange" | "purple" | "green" | "muted"> = { family: "orange", class: "purple", topic: "green", org: "muted" };

function useJoined() {
  const [over, setOver] = useStored<Record<string, boolean>>("fic.groups", {});
  const joined = (g: Group) => over[g.id] ?? g.joined;
  const toggle = (g: Group) => setOver((o) => ({ ...o, [g.id]: !joined(g) }));
  return { joined, toggle };
}

function JoinButton({ g, joined, onToggle, youth }: { g: Group; joined: boolean; onToggle: () => void; youth: boolean }) {
  if (youth && g.kind !== "family") {
    return <span className="text-[11px] font-extrabold text-ink-4 text-right leading-tight">Ask a parent<br />to join groups</span>;
  }
  return (
    <button
      aria-pressed={joined}
      onClick={(e) => { e.preventDefault(); onToggle(); }}
      className={cx("h-[32px] px-[13px] rounded-[10px] text-[12px] font-black shrink-0", joined ? "bg-green-tint text-green" : "bg-green-2 text-cream-text")}
    >
      {joined ? "✓ Joined" : "Join"}
    </button>
  );
}

export function GroupsList({ groups }: { groups: Group[] }) {
  const [tab, setTab] = useState("Your groups");
  const { joined, toggle } = useJoined();
  const level = useLevel();
  const youth = level === "Explorer" || level === "Builder";
  const list = groups.filter((g) => (tab === "Your groups" ? joined(g) : !joined(g)));
  return (
    <div className="pb-6">
      <Segmented items={["Your groups", "Discover"]} value={tab} onChange={setTab} tone="purple" className="mt-1" />
      {list.length === 0 ? (
        <div className="mt-4"><EmptyState emoji="👥" title={tab === "Your groups" ? "No groups yet" : "You've joined them all"} body={tab === "Your groups" ? "Join a topic group or your class to learn alongside others." : "New groups appear here as the Club grows."} action={tab === "Your groups" ? "Discover groups" : undefined} href="#" /></div>
      ) : (
        list.map((g) => (
          <Link key={g.id} href={`/club/groups/${g.id}`} className={cx(cardCls, "flex items-center gap-3")}>
            <span className="w-11 h-11 rounded-[13px] bg-paper-2 flex items-center justify-center text-[22px] shrink-0">{g.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black text-ink truncate">{g.name}</span>
                <Tag tone={KIND_TONE[g.kind]}>{KIND_LABEL[g.kind]}</Tag>
              </div>
              <div className="text-[12px] font-semibold text-ink-3 truncate">{g.blurb}</div>
              <div className="text-[11px] font-bold text-ink-4 mt-[2px]">{g.members.toLocaleString()} members</div>
            </div>
            <JoinButton g={g} joined={joined(g)} onToggle={() => toggle(g)} youth={youth} />
          </Link>
        ))
      )}
      {youth && <p className="mt-3 text-[11px] font-bold text-ink-4 leading-[1.4]">Young learners can join family groups. A parent can approve other groups from Family → Members.</p>}
    </div>
  );
}

const EDUCATOR_ANSWERS = [
  { who: "Coach Tia", text: "No. A 45-year-old has 20+ working years — long enough for compounding to matter. Start with an index fund and a monthly habit." },
  { who: "Coach Marcus", text: "The best time was 20 years ago; the second best is today. Focus on savings rate first, returns second." },
  { who: "Sarah J.", text: "Late starters often invest more per month because they earn more. Time isn't the only lever." },
];

export function GroupDetail({ g, members, challenges, ideas }: { g: Group; members: Member[]; challenges: Challenge[]; ideas: Idea[] }) {
  const [tab, setTab] = useState("Feed");
  const { joined, toggle } = useJoined();
  const level = useLevel();
  const youth = level === "Explorer" || level === "Builder";
  const isFamily = g.kind === "family";
  const groupChallenges = challenges.filter((c) => (isFamily ? c.kind === "family" : g.kind === "class" ? c.kind === "class" : c.kind === "individual"));

  return (
    <div className="pb-6">
      <div className="flex items-center gap-3 mt-1">
        <span className="w-14 h-14 rounded-[16px] bg-paper-2 flex items-center justify-center text-[28px] shrink-0">{g.emoji}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-[19px] font-black text-ink leading-tight">{g.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Tag tone={KIND_TONE[g.kind]}>{KIND_LABEL[g.kind]}</Tag>
            <span className="text-[11.5px] font-bold text-ink-4">{g.members.toLocaleString()} members</span>
          </div>
        </div>
        <JoinButton g={g} joined={joined(g)} onToggle={() => toggle(g)} youth={youth} />
      </div>
      <p className="mt-2 text-[12.5px] font-semibold text-ink-3">{g.blurb}</p>

      {g.pinned.length > 0 && (
        <div className="mt-3 bg-card border border-line rounded-card px-4 py-1">
          {g.pinned.map((p, i) => (
            <div key={p} className={cx("flex items-center gap-2 py-[10px] text-[12.5px] font-extrabold text-ink", i < g.pinned.length - 1 && "border-b border-paper-2")}>
              <span aria-hidden>📌</span><span className="flex-1">{p}</span>
            </div>
          ))}
        </div>
      )}

      <Segmented items={["Feed", "Members", "Challenges"]} value={tab} onChange={setTab} tone="purple" className="mt-4" />

      {tab === "Feed" && (
        <div>
          {isFamily && (
            <>
              {groupChallenges[0] && (
                <Link href={`/club/challenges/${groupChallenges[0].id}`} className={cx(cardCls, "bg-orange-tint border-orange-line")}>
                  <div className="text-[11px] font-black text-orange-3 tracking-[0.4px]">THIS WEEK&apos;S CHALLENGE</div>
                  <div className="mt-1 text-[15px] font-black text-ink leading-[1.3]">{groupChallenges[0].title}</div>
                  <div className="mt-2 h-[7px] rounded-[4px] bg-[#F6E4CB] overflow-hidden"><div className="h-full bg-orange rounded-[4px]" style={{ width: `${groupChallenges[0].progress}%` }} /></div>
                  <div className="mt-1 text-[11px] font-extrabold text-orange-2">{groupChallenges[0].progress}% · {groupChallenges[0].participants} of us in</div>
                </Link>
              )}
              <Link href="/live/family-investing-night" className={cx(cardCls, "flex items-center gap-3")}>
                <span className="w-10 h-10 rounded-[12px] bg-purple-tint text-purple-2 flex items-center justify-center text-[18px]">🎥</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-black text-ink">Family Investing Night</div>
                  <div className="text-[11.5px] font-bold text-ink-3">Thu 7:00 PM · with Coach Marcus</div>
                </div>
                <Tag tone="purple">Upcoming</Tag>
                <ChevronRight className="text-ink-4" />
              </Link>
            </>
          )}
          {g.id === "beginners-circle" && (
            <div className={cardCls}>
              <div className="flex items-center gap-[10px]">
                <Avatar name={sampleQuestion.author} color="bg-purple" size={34} />
                <div className="flex-1">
                  <div className="text-[13.5px] font-black text-ink">{sampleQuestion.author}</div>
                  <div className="text-[11px] font-bold text-ink-4">{sampleQuestion.ago}</div>
                </div>
                <span className="bg-green-tint text-green rounded-[10px] px-[10px] py-1 text-[10.5px] font-black">QUESTION</span>
              </div>
              <div className="mt-[10px] text-[15px] font-black text-ink"><span className="text-ink-4">Q · </span>{sampleQuestion.question}</div>
              <ul className="mt-3 flex flex-col gap-3">
                {EDUCATOR_ANSWERS.map((a) => (
                  <li key={a.who} className="flex items-start gap-2">
                    <Avatar name={a.who} size={26} />
                    <div>
                      <div className="flex items-center gap-2"><span className="text-[12.5px] font-black text-ink">{a.who}</span><Tag tone="green">Educator</Tag></div>
                      <p className="mt-[3px] text-[12.5px] font-semibold text-ink-2 leading-[1.5]">{a.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/learn/path/investing-foundations" className="mt-3 inline-block text-[11px] font-extrabold text-purple-2 uppercase">Concept: Compounding →</Link>
            </div>
          )}
          {ideas.map((i) => <IdeaCard key={i.id} idea={i} authorHref="/club/members/sarah-j" />)}
          {!isFamily && g.id !== "beginners-circle" && ideas.length === 0 && (
            <div className="mt-3"><EmptyState emoji="💬" title="Quiet in here" body="Be the first to post an idea or a question." action="Post an idea" href="/club/new" /></div>
          )}
          {g.id !== "beginners-circle" && !isFamily && ideas.length > 0 && null}
          {g.id === "beginners-circle" && <QuestionCard q={{ ...sampleQuestion, id: "q-2", author: "Luis P.", ago: "1d ago", question: "What's the difference between a stock and an ETF?", answers: 2, concept: "ETFs" }} href="/learn/path/build-a-portfolio" />}
        </div>
      )}

      {tab === "Members" && (
        <div className="mt-3 bg-card border border-line rounded-card px-4 py-1">
          {members.map((m, i) => (
            <Link key={m.id} href={`/club/members/${m.id}`} className={cx("flex items-center gap-3 py-[10px]", i < members.length - 1 && "border-b border-paper-2")}>
              <Avatar name={m.name} size={34} />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-black text-ink truncate">{m.name}</div>
                <div className="text-[11px] font-bold text-ink-4">{m.role} · {m.level}</div>
              </div>
              {m.ageBadge && <Tag tone="gold">{m.ageBadge}</Tag>}
              <ChevronRight className="text-ink-4" />
            </Link>
          ))}
          <div className="py-3 text-[11.5px] font-bold text-ink-4">Showing {members.length} of {g.members.toLocaleString()} members.</div>
        </div>
      )}

      {tab === "Challenges" && (
        groupChallenges.length === 0 ? (
          <div className="mt-3"><EmptyState emoji="🏆" title="No challenges yet" body="Group challenges appear here when a member or educator creates one." /></div>
        ) : (
          groupChallenges.map((c) => (
            <Link key={c.id} href={`/club/challenges/${c.id}`} className={cardCls}>
              <div className="text-[14px] font-black text-ink">{c.title}</div>
              <div className="mt-1 text-[12px] font-semibold text-ink-3">{c.blurb}</div>
              <div className="mt-2 h-[7px] rounded-[4px] bg-line-2 overflow-hidden"><div className="h-full bg-green-2 rounded-[4px]" style={{ width: `${c.progress}%` }} /></div>
              <div className="mt-1 flex justify-between text-[11px] font-extrabold text-ink-3"><span>{c.progress}% · due {c.due}</span><span>+{c.xp} XP</span></div>
            </Link>
          ))
        )
      )}
    </div>
  );
}
