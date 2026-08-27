"use client";
import { useState } from "react";
import Link from "next/link";
import type { ChartDrill } from "@/lib/types";

/** Chart Rush · trend spotting (prototype v2 `chartdrill`): one chart, two big calls, Kai hint, lock in for XP. */
export function ChartRush({ drills }: { drills: ChartDrill[] }) {
  const [i, setI] = useState(0); const [pick, setPick] = useState<number | null>(null); const [locked, setLocked] = useState(false); const [streak, setStreak] = useState(6); const [xp, setXp] = useState(0);
  const d = drills[i % drills.length]; const round = 8 + i;
  const pts = d.series; const min = Math.min(...pts), max = Math.max(...pts); const W = 330, H = 120;
  const path = pts.map((v, k) => `${k === 0 ? "M" : "L"}${(k / (pts.length - 1)) * W},${H - ((v - min) / (max - min || 1)) * (H - 16) - 8}`).join(" ");
  const support = H - ((min - min) / (max - min || 1)) * (H - 16) - 8;
  const opts = [{ t: "📈 Bounce up", s: "buyers defend support", good: d.answerIdx === 0, cls: "bg-green-tint border-green-2 text-green" }, { t: "📉 Break down", s: "third test fails", good: d.answerIdx !== 0, cls: "bg-card border-[#E5B8AE] text-red" }];
  const lock = () => { if (pick === null) return; setLocked(true); const ok = opts[pick].good; setStreak((s) => (ok ? s + 1 : 0)); if (ok) setXp((x) => x + 10); };
  const next = () => { setI((k) => k + 1); setPick(null); setLocked(false); };
  return (
    <div className="pt-[14px] pb-8">
      <div className="flex items-center justify-between"><Link href="/learn?tab=practice" className="text-ink-2 text-[18px]">‹</Link><span className="text-[11px] font-black text-ink-2">{round}/15 · 🔥 {streak} streak</span><span className="text-[11px] font-black text-gold">⭐ +{xp}</span></div>
      <div className="mt-3 text-[10px] font-black text-orange-2 tracking-[0.3px]">CHART RUSH · TREND SPOTTING</div>
      <div className="mt-[9px] text-[20px] font-black text-ink leading-[1.3]">{i === 0 ? "Support held twice. What's the likely next move?" : d.prompt}</div>
      <div className="mt-[11px] bg-card border border-line rounded-[16px] px-[11px] py-[13px]">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-hidden><line x1="0" y1={support} x2={W} y2={support} stroke="#E58234" strokeDasharray="4 4" /><path d={path} fill="none" stroke="#3A6B3E" strokeWidth="2.5" strokeLinejoin="round" />{locked && <path d={d.reveal.map((v, k) => `${k === 0 ? "M" : "L"}${W - 40 + (k / (d.reveal.length - 1)) * 40},${H - ((v - min) / (max - min || 1)) * (H - 16) - 8}`).join(" ")} fill="none" stroke="#E58234" strokeWidth="2.5" />}</svg>
        <div className="flex justify-between px-[6px] text-[9px] font-bold text-ink-4"><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div>
      </div>
      <div className="flex gap-[10px] mt-[14px]">{opts.map((o, k) => (
        <button key={o.t} disabled={locked} onClick={() => setPick(k)} className={`flex-1 rounded-[15px] border-2 p-[15px] text-center ${pick === k ? o.cls : "bg-card border-line text-ink"}`}><div className="text-[15px] font-black">{o.t}</div><div className="text-[9.5px] font-bold text-ink-2 mt-[2px]">{o.s}</div></button>))}</div>
      <div className="mt-[11px] rounded-[12px] border border-purple-line bg-purple-tint px-3 py-[9px] flex items-center gap-2 text-[11px] font-bold text-ink-2"><span className="text-purple-2 font-black">✦</span>{locked ? d.explanation : `@Kai: "The more times support holds, the more traders watch it…"`}</div>
      {locked ? <button onClick={next} className="mt-4 w-full h-[52px] rounded-[16px] bg-green text-cream-text text-[15px] font-black">{opts[pick!].good ? "Correct · +10 XP" : "Not this time"} · Next chart →</button>
        : <button onClick={lock} disabled={pick === null} className="mt-4 w-full h-[52px] rounded-[16px] bg-orange text-cream-text text-[15px] font-black disabled:opacity-50">Lock it in · +10 XP</button>}
    </div>
  );
}
