"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LiveItem } from "@/lib/learn/types";
import { learnApi } from "@/lib/live/client-learn";
import { cx } from "@/components/ui";
import { TopBar } from "@/components/shell/TopBar";

/**
 * A live class or its recording. The recordings are real files: `live_sessions.recording_kind`
 * decides the player, and an uploaded one arrives as a fresh signed URL from the private
 * `class-recordings` bucket (see `getLiveItem`). This screen used to be a black box with a play
 * triangle and the note "when the FTA live engine is wired" — the engine was already here.
 */
export function SessionView({ item }: { item: LiveItem }) {
  const router = useRouter();
  const [rsvped, setRsvped] = useState(item.rsvped);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const when = new Date(item.startsAt);
  const rec = item.recording;

  const toggleRsvp = async () => {
    if (busy) return;
    const next = !rsvped;
    setBusy(true); setRsvped(next); setError(null);
    const r = await learnApi.rsvp(item.id, next);
    setBusy(false);
    if (!r.ok) { setRsvped(!next); setError(r.error); return; }
    router.refresh();
  };

  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/live" title={item.status === "live" ? "Live now" : item.status === "upcoming" ? "Upcoming" : "Recording"} />
      <div className="px-[18px] pb-6">
        {/* ── the player ── */}
        {rec?.kind === "youtube" && rec.embedUrl ? (
          <div className="rounded-[18px] overflow-hidden border border-line bg-ink" style={{ aspectRatio: "16 / 9" }}>
            <iframe src={rec.embedUrl} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen className="w-full h-full" />
          </div>
        ) : rec?.url ? (
          rec.kind === "upload" ? (
            <video controls playsInline preload="metadata" src={rec.url} className="w-full rounded-[18px] border border-line bg-ink" style={{ aspectRatio: "16 / 9" }} />
          ) : (
            <a href={rec.url} target="_blank" rel="noreferrer" className="rounded-[18px] bg-[#2E2A21] flex flex-col items-center justify-center text-center gap-2" style={{ aspectRatio: "16 / 9" }}>
              <span className="w-14 h-14 rounded-full bg-cream-text/15 flex items-center justify-center" aria-hidden><svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFCF5"><path d="M8 5v14l11-7z" /></svg></span>
              <span className="text-[12.5px] font-black text-cream-text">Open the recording ↗</span>
            </a>
          )
        ) : item.status === "live" && item.joinUrl ? (
          <div className="rounded-[18px] bg-[#2E2A21] aspect-video flex flex-col items-center justify-center text-center px-6 gap-2">
            <span className="inline-flex items-center rounded-[8px] bg-red px-[10px] py-[3px] text-[10px] font-black text-cream-text">● LIVE</span>
            {!!item.viewers && <span className="text-[11px] font-extrabold text-[#D9CDB2]">{item.viewers} watching</span>}
            <a href={item.joinUrl} target="_blank" rel="noreferrer" className="mt-2 rounded-[12px] bg-red text-cream-text px-5 py-[10px] text-[13px] font-black">Join the class ↗</a>
          </div>
        ) : (
          <div className="rounded-[18px] border border-line bg-card aspect-video flex flex-col items-center justify-center text-center px-6">
            <span className="text-[26px]">{item.status === "upcoming" ? "📅" : "🎥"}</span>
            <p className="mt-2 text-[12.5px] font-bold text-ink-3 leading-[1.5]">
              {item.status === "upcoming" ? "Not started yet — RSVP and it lands in your notifications." : "No recording posted for this session."}
            </p>
          </div>
        )}

        <h1 className="mt-4 text-[21px] font-black text-ink leading-[1.25]">{item.title}</h1>
        <div className="mt-1 text-[11px] font-extrabold text-ink-3">
          {when.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · {item.minutes} min · {item.host}{item.hostTitle ? ` · ${item.hostTitle}` : ""}
        </div>
        {item.blurb && <p className="mt-3 text-[13.5px] font-semibold text-ink-2 leading-[1.55]">{item.blurb}</p>}

        {!!item.tickers.length && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {item.tickers.map((t) => <Link key={t} href={`/discover/${t}`} className="rounded-[9px] bg-green-tint text-green px-[9px] py-[3px] text-[11px] font-black">${t}</Link>)}
          </div>
        )}

        {item.assignment && (
          <div className="mt-4 rounded-[14px] border border-orange-line bg-orange-tint px-4 py-3">
            <div className="text-[10px] font-black text-orange-2">ASSIGNMENT</div>
            <p className="mt-1 text-[12.5px] font-bold text-ink-2 leading-[1.5]">{item.assignment}</p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {item.worksheetUrl && (
            <a href={item.worksheetUrl} target="_blank" rel="noreferrer" className="flex items-center gap-[10px] rounded-[14px] border border-line bg-card px-4 py-3">
              <span className="text-[15px]">📄</span><span className="flex-1 text-[12.5px] font-extrabold text-ink">Worksheet</span><span className="text-ink-4">↗</span>
            </a>
          )}
          {item.status === "upcoming" && (
            <button type="button" onClick={() => void toggleRsvp()} disabled={busy}
              className={cx("h-[46px] rounded-[14px] text-[13.5px] font-black", rsvped ? "bg-card border-[1.5px] border-green-2 text-green" : "bg-green-2 text-cream-text shadow-[0_3px_0_#3A6B3E]")}>
              {rsvped ? "You're going ✓" : "RSVP · +5 XP"}
            </button>
          )}
          {!!item.rsvpCount && <p className="text-center text-[11px] font-bold text-ink-4">{item.rsvpCount} {item.rsvpCount === 1 ? "person is" : "people are"} going</p>}
          {error && <p role="alert" className="text-center text-[12px] font-bold text-coral">{error}</p>}
        </div>
      </div>
    </div>
  );
}
