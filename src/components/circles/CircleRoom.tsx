"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cx } from "@/components/ui";
import { ChevronLeft } from "@/components/ui/icons";
import { BarChip, RingAvatar } from "@/components/community/BarChip";
import { CircleRing } from "./CircleRing";
import type { Circle, CircleMessage } from "@/lib/fixtures/v12-social";
import { fmtPeople } from "@/lib/fixtures/v12-social";
import { openSheet } from "@/components/sheets/bus";

type Mine = { id: string; text: string; at: number };

/** Circle — a 30-day room (canvas v11, board 14): countdown, company context, chat with artifacts, Kai catch-up. */
export function CircleRoom({ c, messages, quote }: { c: Circle; messages: CircleMessage[]; quote: { price: number; changePct: number } | null }) {
  const key = `fic.circle.${c.id}`;
  const [joined, setJoined] = useState(true);
  const [mine, setMine] = useState<Mine[]>([]);
  const [draft, setDraft] = useState("");
  const [catchUp, setCatchUp] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      setMine(JSON.parse(localStorage.getItem(key) || "[]"));
      const j = localStorage.getItem(`fic.circle.joined.${c.id}`); if (j !== null) setJoined(j === "1");
    } catch { /* storage unavailable */ }
  }, [key, c.id]);
  const send = () => {
    const t = draft.trim(); if (!t) return;
    const next = [...mine, { id: `m${Date.now()}`, text: t, at: Date.now() }];
    setMine(next); setDraft("");
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const toggleJoin = () => { const v = !joined; setJoined(v); try { localStorage.setItem(`fic.circle.joined.${c.id}`, v ? "1" : "0"); } catch { /* ignore */ } };
  const price = quote ? `$${quote.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;

  return (
    <div className="flex flex-col min-h-full pt-[14px] pb-3">
      <div className="flex items-center gap-[11px]">
        <Link href="/home" aria-label="Back" className="text-ink-2"><ChevronLeft size={20} /></Link>
        <CircleRing c={c} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-black text-ink">{c.name} Circle</div>
          <div className="text-[9.5px] font-extrabold text-orange-2">⏳ {c.daysLeft} days left · {fmtPeople(c.people)} people · then archives to the {c.symbol ?? "theme"} page</div>
        </div>
        <button type="button" onClick={toggleJoin} aria-pressed={joined} className={cx("rounded-[10px] px-3 py-[6px] text-[10.5px] font-black", joined ? "bg-green-2 text-cream-text" : "bg-card border border-line text-green")}>{joined ? "Joined ✓" : "Join"}</button>
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

      <div className="mt-[10px] flex flex-col gap-[9px]">
        {messages.map((m) => {
          if (m.kind === "mine") return <div key={m.id} className="flex justify-end"><div className="bg-green-2 rounded-[13px_3px_13px_13px] px-3 py-2 max-w-[82%] text-[12px] font-semibold text-cream-text leading-[1.4]">{m.text}</div></div>;
          if (m.kind === "kai") return (
            <div key={m.id} className="flex gap-2">
              <RingAvatar initial="K" bg="bg-purple" ring="white" size={28} />
              <div className="bg-purple-tint border border-purple-line rounded-[3px_13px_13px_13px] px-3 py-2 max-w-[82%]">
                <div className="text-[10px] font-black text-purple-2">Kai ✦ · circle summary</div>
                <div className="text-[11.5px] font-semibold text-ink-2 leading-[1.45] mt-[2px]">{m.text} <button type="button" onClick={() => setCatchUp((v) => !v)} className="font-black text-ink">{catchUp ? "Less ↑" : "Catch up in 60 sec →"}</button></div>
                {catchUp && <p className="mt-2 text-[11px] font-semibold text-ink-2 leading-[1.5] border-t border-purple-line pt-2">{m.detail}</p>}
              </div>
            </div>
          );
          return (
            <div key={m.id} className="flex gap-2">
              <RingAvatar initial={m.author.initial} bg={m.author.bg} ring={m.author.belt} size={28} />
              <div className="bg-card border border-line rounded-[3px_13px_13px_13px] px-3 py-2 max-w-[82%]">
                <div className="text-[10px] font-black text-ink flex items-center gap-1">{m.author.name} {m.author.belt && <BarChip color={m.author.belt} label={m.author.beltLabel ?? ""} />}</div>
                <div className="text-[12px] font-semibold text-ink leading-[1.4] mt-[2px]">{m.text.split(/(@\w+)/).map((s, i) => s.startsWith("@") ? <span key={i} className="text-purple-2 font-black">{s}</span> : s)}</div>
                {m.chart && (
                  <div className="mt-1 flex items-center gap-[7px] bg-[#FBF6EA] rounded-[9px] px-[9px] py-[6px]">
                    <svg width="70" height="16" viewBox="0 0 70 16" preserveAspectRatio="none" className="shrink-0"><polyline fill="none" stroke={m.chart.color} strokeWidth="2" points={m.chart.points.map((y, i) => `${i * 14},${y}`).join(" ")} /></svg>
                    <span className="text-[9px] font-extrabold text-ink-2">{m.chart.label}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {mine.map((m) => <div key={m.id} className="flex justify-end"><div className="bg-green-2 rounded-[13px_3px_13px_13px] px-3 py-2 max-w-[82%] text-[12px] font-semibold text-cream-text leading-[1.4]">{m.text}</div></div>)}
      </div>

      <div className="mt-auto pt-3">
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-[9px] bg-card border-[1.5px] border-line rounded-[14px] px-[14px] py-[8px]">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message the circle…" aria-label="Message the circle" className="flex-1 min-w-0 bg-transparent text-[12px] font-bold text-ink placeholder:text-ink-4 outline-none" />
          <button type="button" aria-label="Attach a pick" onClick={() => openSheet("pick", { symbol: c.symbol })} className="text-[12px]">▲</button>
          <button type="button" aria-label="Attach a chart" onClick={() => setDraft((d) => (d ? d + " " : "") + `📈 ${c.symbol ?? c.name} chart`)} className="text-[12px]">📈</button>
          <button type="submit" aria-label="Send" className="w-7 h-7 rounded-full bg-green-2 text-white flex items-center justify-center text-[12px] font-black">↑</button>
        </form>
      </div>
    </div>
  );
}
