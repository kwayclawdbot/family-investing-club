"use client";
import { useState } from "react";
import Link from "next/link";
import { crash } from "@/lib/fixtures/v13-learn";

/** Scenario · Market crash (prototype v2 `scenario`): breaking-news header, Simbot, three calls, based on March 2020. */
export function CrashScenario() {
  const [i, setI] = useState(1); const [pick, setPick] = useState<number | null>(null); const [log, setLog] = useState<string[]>([]);
  const st = crash.steps[i]; const last = i === crash.steps.length - 1;
  const commit = () => { if (pick === null) return; setLog((l) => [...l, st.choices[pick].label]); if (last) return; setI(i + 1); setPick(null); };
  const tone = (t: string, on: boolean) => on ? (t === "good" ? "bg-green-tint border-green-2" : t === "bad" ? "bg-[#FBEDE9] border-[#E5B8AE]" : "bg-orange-tint border-orange") : "bg-card border-line";
  return (
    <div className="pt-[14px] pb-8">
      <div className="flex items-center justify-between"><Link href="/learn?tab=practice" className="text-ink-2 text-[18px]">‹</Link><span className="text-[10.5px] font-black text-ink-3">Step {i + 1} of {crash.steps.length}</span><span className="text-[10px] font-black text-purple-2">SCENARIO · MARKET CRASH</span></div>
      <div className="mt-3 rounded-[16px] bg-[#2E2A21] px-4 py-[14px]">
        <div className="flex items-center justify-between"><span className="text-[10px] font-black text-[#E5B8AE]">⚠ {st.breaking}</span><span className="text-[11px] font-black text-[#E5B8AE]">{st.spx}</span></div>
        <div className="mt-[6px] text-[14.5px] font-black text-cream-text leading-[1.35]">{st.copy}</div>
        <svg width="100%" viewBox="0 0 330 60" aria-hidden><path d={`M0,10 L60,18 L120,14 L180,${20 + i * 6} L240,${30 + i * 5} L330,${34 + i * 4}`} fill="none" stroke="#C96A57" strokeWidth="2.5" /></svg>
      </div>
      <div className="mt-[10px] flex gap-[9px]"><span className="w-[30px] h-[30px] rounded-full bg-purple text-white text-[11px] font-black flex items-center justify-center border-[2.5px] border-[#C9BC9E] shadow-[0_0_0_2px_#FFFDF7] shrink-0">S</span>
        <div className="flex-1 bg-purple-tint border border-purple-line rounded-[3px_13px_13px_13px] px-3 py-[9px]"><div className="text-[9.5px] font-black text-purple-2">SIMBOT</div><div className="text-[11.5px] font-semibold text-[#4A4436] leading-[1.45] mt-[1px]">{st.simbot}</div></div></div>
      <div className="flex flex-col gap-2 mt-[11px]">{st.choices.map((c, k) => (
        <button key={c.label} onClick={() => setPick(k)} className={`rounded-[14px] border-[1.5px] px-[14px] py-3 text-left ${tone(c.tone, pick === k)}`}><div className="text-[12.5px] font-extrabold text-ink">{c.label}</div>{c.sub && <div className="text-[10px] font-bold text-ink-3 mt-[2px]">{c.sub}</div>}</button>))}</div>
      <div className="mt-3 text-center text-[10px] font-bold text-ink-4">Based on March 2020 · you&apos;ll see what actually happened next</div>
      {last && log.length >= crash.steps.length - 1 ? <Link href="/learn?tab=practice" className="mt-3 block w-full h-[52px] rounded-[16px] bg-green text-cream-text text-[15px] font-black text-center leading-[52px]">Finish · +25 XP</Link>
        : <button onClick={commit} disabled={pick === null} className="mt-3 w-full h-[52px] rounded-[16px] bg-orange text-cream-text text-[15px] font-black disabled:opacity-50">Commit · see day {crash.steps[Math.min(i + 1, crash.steps.length - 1)].day}</button>}
    </div>
  );
}
