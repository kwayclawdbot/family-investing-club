"use client";
import Link from "next/link";
import { useState } from "react";
import type { Challenge, Group } from "@/lib/types";
import { Button, ButtonLink, ProgressBar, Segmented, Tag, cx } from "@/components/ui";
import { EmptyState, StatTile } from "@/components/ui/extras";
import { CheckIcon, ChevronRight } from "@/components/ui/icons";
import { cardCls } from "./cards";
import { useStored } from "./storage";

const KIND_TONE: Record<Challenge["kind"], "green" | "orange" | "purple"> = { individual: "green", family: "orange", class: "purple" };

export function ChallengesList({ challenges }: { challenges: Challenge[] }) {
  const [tab, setTab] = useState("Family");
  const [joined, setJoined] = useStored<Record<string, boolean>>("fic.challenges.joined", {});
  const kind = tab.toLowerCase() as Challenge["kind"];
  const list = challenges.filter((c) => c.kind === kind);
  return (
    <div className="pb-6">
      <Segmented items={["Individual", "Family", "Class"]} value={tab} onChange={setTab} tone="green" className="mt-1" />
      {list.length === 0 ? (
        <div className="mt-4"><EmptyState emoji="🏆" title="No challenges here yet" body="Join a class or group to see its challenges." action="Find a group" href="/club/groups" /></div>
      ) : (
        list.map((c) => {
          const on = joined[c.id] ?? c.progress > 0;
          return (
            <Link key={c.id} href={`/club/challenges/${c.id}`} className={cardCls}>
              <div className="flex items-center gap-2">
                <Tag tone={KIND_TONE[c.kind]}>{c.kind}</Tag>
                <span className="ml-auto text-[11px] font-extrabold text-ink-4">due {c.due}</span>
              </div>
              <div className="mt-2 text-[15px] font-black text-ink leading-[1.3]">{c.title}</div>
              <div className="mt-1 text-[12.5px] font-semibold text-ink-3 leading-[1.45]">{c.blurb}</div>
              <ProgressBar value={c.progress} className="mt-3" color={c.kind === "family" ? "bg-orange" : "bg-green-2"} />
              <div className="mt-2 flex items-center gap-3 text-[11.5px] font-extrabold text-ink-3">
                <span>{c.progress}%</span>
                <span>⭐ +{c.xp} XP</span>
                <span>👥 {c.participants}</span>
                <button
                  onClick={(e) => { e.preventDefault(); setJoined((j) => ({ ...j, [c.id]: !on })); }}
                  className={cx("ml-auto h-[30px] px-3 rounded-[10px] text-[12px] font-black", on ? "bg-green-tint text-green" : "bg-green-2 text-cream-text")}
                >
                  {on ? "✓ Joined" : "Join"}
                </button>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}

export function ChallengeDetail({ c, group }: { c: Challenge; group?: Group }) {
  const [done, setDone] = useStored<boolean[]>(`fic.challenge.${c.id}`, c.steps.map((_, i) => i < Math.round((c.progress / 100) * c.steps.length)));
  const count = done.filter(Boolean).length;
  const pct = Math.round((count / c.steps.length) * 100);
  const complete = count === c.steps.length;
  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 mt-1">
        <Tag tone={KIND_TONE[c.kind]}>{c.kind} challenge</Tag>
        <span className="text-[11px] font-extrabold text-ink-4">due {c.due}</span>
      </div>
      <h1 className="mt-2 text-[22px] font-black text-ink leading-[1.25]">{c.title}</h1>
      <p className="mt-2 text-[13.5px] font-semibold text-ink-2 leading-[1.5]">{c.blurb}</p>

      <div className="mt-3 flex gap-2">
        <StatTile value={`${pct}%`} label="done" tone="green" />
        <StatTile value={`+${c.xp}`} label="XP" tone="orange" />
        <StatTile value={c.participants} label="joined" />
      </div>

      <div className="mt-4 text-[11px] font-extrabold text-ink-3 tracking-[0.3px] uppercase">Steps</div>
      <ol className="mt-2 bg-card border border-line rounded-card px-4 py-1">
        {c.steps.map((s, i) => (
          <li key={s} className={cx("flex items-center gap-3 py-3", i < c.steps.length - 1 && "border-b border-paper-2")}>
            <button
              role="checkbox"
              aria-checked={done[i]}
              onClick={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
              className={cx("w-7 h-7 rounded-[9px] border-2 flex items-center justify-center shrink-0 transition", done[i] ? "bg-green-2 border-green-2 text-cream-text" : "border-line-3 text-transparent")}
            >
              <CheckIcon size={14} />
            </button>
            <span className="w-5 text-[11px] font-black text-ink-4">{i + 1}</span>
            <span className={cx("flex-1 text-[13.5px] font-extrabold", done[i] ? "text-ink-3 line-through" : "text-ink")}>{s}</span>
          </li>
        ))}
      </ol>
      <ProgressBar value={pct} className="mt-3" color={c.kind === "family" ? "bg-orange" : "bg-green-2"} height={8} />

      {complete && (
        <div className="mt-3 bg-green-tint border border-green-line rounded-card px-4 py-3 text-[13px] font-extrabold text-green">
          🎉 Challenge complete — +{c.xp} XP when you post your result.
        </div>
      )}

      {group && (
        <Link href={`/club/groups/${group.id}`} className="mt-4 flex items-center gap-3 bg-card border border-line rounded-card px-4 py-3">
          <span className="w-9 h-9 rounded-[11px] bg-paper-2 flex items-center justify-center text-[18px]">{group.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] font-extrabold text-ink-4 uppercase">Linked group</div>
            <div className="text-[13.5px] font-black text-ink truncate">{group.name}</div>
          </div>
          <ChevronRight className="text-ink-4" />
        </Link>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <ButtonLink href="/club/new" full variant={complete ? "primary" : "secondary"}>Post your result</ButtonLink>
        {c.kind === "individual" && c.id === "diversify-under-constraints" && <ButtonLink href="/practice" full variant="secondary">Open Practice</ButtonLink>}
        {c.kind === "family" && <Button variant="ghost" size="md" full onClick={() => setDone(c.steps.map(() => false))}>Reset for the family</Button>}
      </div>
    </div>
  );
}
