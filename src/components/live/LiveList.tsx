"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LiveSession } from "@/lib/types";
import { Avatar, cx } from "@/components/ui";
import { EmptyState } from "@/components/ui/extras";
import { dayTile, dateLabel } from "./format";

const TABS = ["Live Now", "Upcoming", "Recordings"] as const;
type Tab = (typeof TABS)[number];

function useReminders(sessions: LiveSession[]) {
  const [remind, setRemind] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const r: Record<string, boolean> = {};
      for (const s of sessions) if (localStorage.getItem(`fic.remind.${s.id}`) === "1") r[s.id] = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      setRemind(r);
    } catch { /* storage unavailable */ }
  }, [sessions]);
  function toggle(id: string) {
    const v = !remind[id];
    setRemind((r) => ({ ...r, [id]: v }));
    try { if (v) localStorage.setItem(`fic.remind.${id}`, "1"); else localStorage.removeItem(`fic.remind.${id}`); } catch { /* ignore */ }
  }
  return { remind, toggle };
}

const initial = (name: string) => name.replace("Coach ", "").slice(0, 1).toUpperCase();
const levelLabel = (l: LiveSession["level"]) => (l === "All" ? "All levels" : l === "Explorer" ? "Beginner-friendly" : l);

function LiveCard({ s, pathTitle }: { s: LiveSession; pathTitle?: string }) {
  return (
    <div className="mt-3 rounded-[18px] border border-line bg-card px-4 py-[15px]">
      <div className="flex items-center gap-2">
        <span className="rounded-[8px] bg-red px-[10px] py-[3px] text-[10px] font-black text-cream-text">● LIVE</span>
        <span className="text-[11px] font-extrabold text-ink-3">{s.watching} watching</span>
      </div>
      <div className="mt-[9px] text-[17px] font-black text-ink">{s.title}</div>
      <div className="mt-[2px] text-[12.5px] font-bold text-ink-3">with {s.instructor} · {levelLabel(s.level)}{pathTitle ? ` · linked to ${pathTitle}` : ""}</div>
      <div className="mt-3 flex items-center gap-[10px]">
        <Avatar name={initial(s.instructor)} color="bg-coral" size={34} />
        <span className="flex-1 text-[11.5px] font-bold text-ink-3">&ldquo;{s.blurb}&rdquo;</span>
        <Link href={`/live/${s.id}`} className="rounded-[12px] bg-orange px-[18px] py-[9px] text-[13px] font-black text-cream-text shadow-[0_3px_0_#C96D25] active:translate-y-[2px] active:shadow-none transition">Join</Link>
      </div>
    </div>
  );
}

function UpcomingRows({ list, remind, toggle }: { list: LiveSession[]; remind: Record<string, boolean>; toggle: (id: string) => void }) {
  if (!list.length) return <div className="mt-3"><EmptyState emoji="📅" title="Nothing scheduled" body="New sessions land here every week." /></div>;
  return (
    <div className="rounded-[16px] border border-line bg-card px-4 py-[2px]">
      {list.map((s, i) => {
        const t = dayTile(s.startsAt);
        const on = !!remind[s.id];
        return (
          <div key={s.id} className={cx("flex items-center gap-3 py-[11px]", i < list.length - 1 && "border-b border-paper-2")}>
            <div className="w-[46px] rounded-[11px] border border-line bg-paper py-[6px] text-center shrink-0">
              <div className="text-[10px] font-black text-orange-2">{t.day}</div>
              <div className="text-[13px] font-black text-ink">{t.time}</div>
            </div>
            <Link href={`/live/${s.id}`} className="flex-1 min-w-0">
              <div className="text-[13.5px] font-extrabold text-ink leading-[1.3]">{s.title}</div>
              <div className="text-[11px] font-bold text-ink-3">{s.instructor} · {levelLabel(s.level)}</div>
            </Link>
            <button type="button" aria-pressed={on} onClick={() => toggle(s.id)} className={cx("rounded-[10px] px-[11px] py-[6px] text-[11px] font-black shrink-0 border-[1.5px] transition", on ? "bg-green-tint border-green-2 text-green" : "border-green-2 text-green")}>{on ? "✓ Set" : "Remind"}</button>
          </div>
        );
      })}
    </div>
  );
}

function RecordingRow({ s, resumePct }: { s: LiveSession; resumePct?: number }) {
  const left = resumePct ? Math.round(s.minutes * (1 - resumePct / 100)) : s.minutes;
  return (
    <Link href={`/live/${s.id}`} className="flex items-center gap-3 rounded-[16px] border border-line bg-card px-4 py-[13px]">
      <div className="w-[84px] h-[52px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "repeating-linear-gradient(45deg,#3E3A30 0 8px,#4A4538 8px 16px)" }} aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFCF5"><path d="M8 5v14l11-7z" /></svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-extrabold text-ink leading-[1.3]">{s.title} (recording)</div>
        {resumePct ? (
          <div className="mt-[7px] h-[5px] rounded-[3px] bg-line-2 overflow-hidden"><div className="h-full rounded-[3px] bg-orange" style={{ width: `${resumePct}%` }} /></div>
        ) : null}
        <div className="mt-1 text-[10.5px] font-bold text-ink-3">{resumePct ? `${left} min left` : `${s.minutes} min · ${dateLabel(s.startsAt)}`} · covers: {s.concepts.map((c) => c.toUpperCase()).join(", ")}</div>
      </div>
    </Link>
  );
}

/** Artboard 22 — Live & Classes: Live Now (live card + this week + continue watching) · Upcoming · Recordings. */
export function LiveList({ sessions, pathTitles }: { sessions: LiveSession[]; pathTitles: Record<string, string> }) {
  const [tab, setTab] = useState<Tab>("Live Now");
  const { remind, toggle } = useReminders(sessions);
  const live = sessions.filter((s) => s.status === "live");
  const upcoming = sessions.filter((s) => s.status === "upcoming");
  const recorded = sessions.filter((s) => s.status === "recorded");

  return (
    <>
      <div className="flex gap-[7px] mt-3" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cx("rounded-[10px] px-[15px] py-[7px] text-[12.5px] transition", tab === t ? "bg-green-2 text-cream-text font-black" : "bg-card border border-line text-ink-3 font-extrabold")}>{t}</button>
        ))}
      </div>

      {tab === "Live Now" && (
        <>
          {live.length ? live.map((s) => <LiveCard key={s.id} s={s} pathTitle={s.pathSlug ? pathTitles[s.pathSlug] : "Stock Market 101"} />) : <div className="mt-3"><EmptyState emoji="🎥" title="Nothing live right now" body="The next session is below — set a reminder." /></div>}
          <h2 className="mt-[14px] mb-[6px] text-[15px] font-black text-ink">Upcoming this week</h2>
          <UpcomingRows list={upcoming} remind={remind} toggle={toggle} />
          {recorded[0] && (
            <>
              <h2 className="mt-[14px] mb-[6px] text-[15px] font-black text-ink">Continue watching</h2>
              <RecordingRow s={recorded[0]} resumePct={62} />
            </>
          )}
        </>
      )}

      {tab === "Upcoming" && <div className="mt-3"><UpcomingRows list={upcoming} remind={remind} toggle={toggle} /></div>}

      {tab === "Recordings" && (
        <div className="mt-3 flex flex-col gap-[10px]">
          {recorded.length ? recorded.map((s, i) => <RecordingRow key={s.id} s={s} resumePct={i === 0 ? 62 : undefined} />) : <EmptyState emoji="📼" title="No recordings yet" />}
        </div>
      )}
    </>
  );
}
