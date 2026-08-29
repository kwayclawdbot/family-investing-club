"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cx } from "@/components/ui";
import { ChevronLeft } from "@/components/ui/icons";
import { BarChip, RingAvatar } from "@/components/community/BarChip";
import { CircleRing } from "./CircleRing";
import { fmtPeople } from "@/lib/format";
import { clubApi } from "@/lib/live/client-club";
import type { CircleRoomView } from "@/lib/live/community";
import { openSheet } from "@/components/sheets/bus";

const STANCES = [
  { id: "bear", label: "Bear", cls: "bg-coral-tint text-coral-2 border-coral-line" },
  { id: "neutral", label: "Neutral", cls: "bg-paper-2 text-ink-2 border-line" },
  { id: "bull", label: "Bull", cls: "bg-green-tint text-green border-green-line" },
] as const;
type Stance = (typeof STANCES)[number]["id"];

/** Circle — a 30-day room around one event. Notes, the join and the stance split are real
 *  `club_circles` rows; the room is read-only once it expires (it archives to the company page). */
export function CircleRoom({ room, quote }: { room: CircleRoomView; quote: { price: number; changePct: number } | null }) {
  const router = useRouter();
  const { circle: c, notes, split } = room;
  const [joined, setJoined] = useState(c.joined);
  const [draft, setDraft] = useState("");
  const [stance, setStance] = useState<Stance | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [echo, setEcho] = useState<{ id: string; text: string }[]>([]);

  const toggleJoin = async () => {
    const next = !joined;
    setJoined(next); setError(null);
    const r = await clubApi.joinCircle(c.id, next);
    if (!r.ok) { setJoined(!next); setError(r.error); return; }
    router.refresh();
  };
  const send = async () => {
    const t = draft.trim(); if (!t || busy) return;
    setBusy(true); setError(null);
    const r = await clubApi.circleNote(c.id, t, stance);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setEcho((x) => [...x, { id: `s${Date.now()}`, text: t }]);
    setDraft(""); setStance(null); router.refresh();
  };
  const price = quote ? `$${quote.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;
  const voices = split.bear + split.neutral + split.bull;
  const canPost = joined && c.open && !room.kidBlocked;

  return (
    <div className="flex flex-col min-h-full pt-[14px] pb-3">
      <div className="flex items-center gap-[11px]">
        <Link href="/home" aria-label="Back" className="text-ink-2"><ChevronLeft size={20} /></Link>
        <CircleRing c={c} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-black text-ink">{c.name} Circle</div>
          <div className="text-[9.5px] font-extrabold text-orange-2">
            {c.open ? `⏳ ${c.daysLeft} days left · ${fmtPeople(c.people)} ${c.people === 1 ? "person" : "people"} · then archives to the ${c.symbol ?? "theme"} page` : `Closed · archived to the ${c.symbol ?? "theme"} page`}
          </div>
        </div>
        {c.open && (
          <button type="button" onClick={() => void toggleJoin()} aria-pressed={joined} className={cx("rounded-[10px] px-3 py-[6px] text-[10.5px] font-black", joined ? "bg-green-2 text-cream-text" : "bg-card border border-line text-green")}>{joined ? "Joined ✓" : "Join"}</button>
        )}
      </div>

      {c.symbol && (
        <Link href={`/discover/${c.symbol}`} className="mt-[9px] flex items-center gap-[10px] bg-card border border-line rounded-[13px] px-[13px] py-[9px]">
          <span className="w-[30px] h-[30px] rounded-[9px] bg-green-tint flex items-center justify-center text-[8.5px] font-black text-green">{c.symbol}</span>
          <span className="flex-1 min-w-0">
            <span className="block text-[11.5px] font-black text-ink">{price ?? "—"} {quote && <span className={quote.changePct >= 0 ? "text-[#3A8C4A]" : "text-red"}>{quote.changePct >= 0 ? "▲" : "▼"}{Math.abs(quote.changePct).toFixed(1)}%</span>} · {c.context}</span>
            <span className="block text-[9px] font-extrabold text-ink-3">{c.consensus}</span>
          </span>
          <span className="text-[9.5px] font-black text-purple-2 whitespace-nowrap">Company page ›</span>
        </Link>
      )}

      {voices > 0 && (
        <div className="mt-[9px] bg-card border border-line rounded-[13px] px-[13px] py-[9px]">
          <div className="flex items-center justify-between text-[9.5px] font-black text-ink-3"><span>WHERE THE ROOM STANDS</span><span>{voices} {voices === 1 ? "voice" : "voices"}</span></div>
          <div className="mt-[6px] flex h-[7px] rounded-[4px] overflow-hidden bg-paper-2">
            {([["bull", "#4C8C4A"], ["neutral", "#C9BC9E"], ["bear", "#C96A57"]] as const).map(([k, col]) => (
              split[k] ? <span key={k} style={{ width: `${(split[k] / voices) * 100}%`, background: col }} /> : null
            ))}
          </div>
          <div className="mt-[5px] text-[9.5px] font-extrabold text-ink-3">{split.bull} bull · {split.neutral} neutral · {split.bear} bear — the latest note from each member</div>
        </div>
      )}

      <div className="mt-[10px] flex flex-col gap-[9px]">
        {notes.length === 0 && echo.length === 0 && (
          <p className="py-10 text-center text-[12.5px] font-bold text-ink-3">{c.open ? "No notes yet — open the conversation." : "This circle closed without notes."}</p>
        )}
        {notes.map((n) => n.mine ? (
          <div key={n.id} className="flex justify-end"><div className="bg-green-2 rounded-[13px_3px_13px_13px] px-3 py-2 max-w-[82%] text-[12px] font-semibold text-cream-text leading-[1.4]">{n.text}</div></div>
        ) : (
          <div key={n.id} className="flex gap-2">
            <RingAvatar initial={n.author.initial} bg={n.author.color} ring={n.author.belt} size={28} />
            <div className="bg-card border border-line rounded-[3px_13px_13px_13px] px-3 py-2 max-w-[82%]">
              <div className="text-[10px] font-black text-ink flex items-center gap-1">
                {n.author.name}
                {n.author.belt && <BarChip color={n.author.belt} label={n.author.beltLabel ?? ""} />}
                {n.stance && <span className="text-ink-4 font-extrabold">· {n.stance}</span>}
                <span className="text-ink-4 font-extrabold">· {n.ago}</span>
              </div>
              <div className="text-[12px] font-semibold text-ink leading-[1.4] mt-[2px]">{n.text.split(/(@\w+)/).map((s, i) => s.startsWith("@") ? <span key={i} className="text-purple-2 font-black">{s}</span> : s)}</div>
            </div>
          </div>
        ))}
        {echo.map((m) => <div key={m.id} className="flex justify-end"><div className="bg-green-2 rounded-[13px_3px_13px_13px] px-3 py-2 max-w-[82%] text-[12px] font-semibold text-cream-text leading-[1.4]">{m.text}</div></div>)}
      </div>

      <div className="mt-auto pt-3">
        {error && <p role="alert" className="mb-[6px] text-[11px] font-bold text-coral px-1">{error}</p>}
        {canPost ? (
          <>
            <div className="flex gap-[6px] mb-[7px]">
              {STANCES.map((s) => (
                <button key={s.id} type="button" onClick={() => setStance((v) => (v === s.id ? null : s.id))} aria-pressed={stance === s.id}
                  className={cx("rounded-[9px] border px-[10px] py-[4px] text-[10px] font-black", stance === s.id ? s.cls : "bg-card border-line text-ink-3")}>{s.label}</button>
              ))}
              <span className="ml-auto self-center text-[9px] font-extrabold text-ink-4">a stance updates your place in the split</span>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex items-center gap-[9px] bg-card border-[1.5px] border-line rounded-[14px] px-[14px] py-[8px]">
              <input value={draft} onChange={(e) => { setDraft(e.target.value); if (error) setError(null); }} placeholder="Add a note to the circle…" aria-label="Add a note to the circle" className="flex-1 min-w-0 bg-transparent text-[12px] font-bold text-ink placeholder:text-ink-4 outline-none" />
              <button type="button" aria-label="Attach a pick" onClick={() => openSheet("pick", { symbol: c.symbol })} className="text-[12px]">▲</button>
              <button type="submit" aria-label="Send" disabled={busy || !draft.trim()} className="w-7 h-7 rounded-full bg-green-2 text-white flex items-center justify-center text-[12px] font-black disabled:opacity-40">↑</button>
            </form>
          </>
        ) : (
          <p className="text-center text-[11px] font-extrabold text-ink-3 py-2">
            {!c.open ? "This circle has closed — read-only." : room.kidBlocked ? "Kids can read a circle but not post in it." : "Join the circle to add a note."}
          </p>
        )}
      </div>
    </div>
  );
}
