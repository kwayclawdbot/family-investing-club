"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LiveSession } from "@/lib/types";
import { Avatar, Card, Segmented, Tag } from "@/components/ui";
import { EmptyState, Toggle } from "@/components/ui/extras";
import { whenLabel, dateLabel } from "./format";

const TABS = ["Live Now", "Upcoming", "Recordings"];

export function LiveList({ sessions }: { sessions: LiveSession[] }) {
  const [tab, setTab] = useState(TABS[0]);
  const [remind, setRemind] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const r: Record<string, boolean> = {};
      for (const s of sessions) if (localStorage.getItem(`fic.remind.${s.id}`) === "1") r[s.id] = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      setRemind(r);
    } catch { /* storage unavailable */ }
  }, [sessions]);
  function toggle(id: string, v: boolean) {
    setRemind((r) => ({ ...r, [id]: v }));
    try { if (v) localStorage.setItem(`fic.remind.${id}`, "1"); else localStorage.removeItem(`fic.remind.${id}`); } catch { /* ignore */ }
  }
  const status = tab === "Live Now" ? "live" : tab === "Upcoming" ? "upcoming" : "recorded";
  const list = sessions.filter((s) => s.status === status);

  return (
    <>
      <Segmented items={TABS} value={tab} onChange={setTab} className="mt-3" />
      <div className="flex flex-col gap-3 mt-4">
        {list.length === 0 && <EmptyState emoji="🎥" title={status === "live" ? "Nothing live right now" : "Nothing scheduled"} body="Check Upcoming for the next session." />}
        {list.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center gap-3">
              <Avatar name={s.instructor.replace("Coach ", "")} color="bg-coral" size={40} />
              <div className="flex-1 min-w-0">
                <Link href={`/live/${s.id}`} className="block text-[14.5px] font-black text-ink leading-[1.3]">{s.title}</Link>
                <div className="text-[11.5px] font-bold text-ink-3 mt-[2px]">
                  {s.instructor} · {status === "recorded" ? `${s.minutes} min · ${dateLabel(s.startsAt)}` : status === "upcoming" ? whenLabel(s.startsAt) : `${s.watching} watching`}
                </div>
              </div>
              {status === "live" && <span className="inline-flex items-center rounded-[6px] bg-green px-2 py-[3px] text-[10px] font-black text-cream-text">● LIVE</span>}
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Tag tone={s.level === "Explorer" ? "orange" : "muted"}>{s.level === "All" ? "All levels" : s.level}</Tag>
              {s.concepts.map((c) => <Tag key={c} tone="green">{c}</Tag>)}
            </div>
            <div className="flex items-center justify-between mt-3">
              {status === "upcoming" ? (
                <label className="flex items-center gap-2 text-[12.5px] font-extrabold text-ink-2">
                  <Toggle checked={!!remind[s.id]} onChange={(v) => toggle(s.id, v)} label={`Remind me: ${s.title}`} /> Remind me
                </label>
              ) : <span className="text-[12px] font-bold text-ink-3">{s.minutes} min</span>}
              <Link href={`/live/${s.id}`} className={`h-[32px] px-[14px] inline-flex items-center rounded-[10px] text-[12.5px] font-black ${status === "live" ? "bg-orange text-cream-text" : "bg-green text-cream-text"}`}>
                {status === "live" ? "Join" : status === "upcoming" ? "Details" : "Watch"}
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
