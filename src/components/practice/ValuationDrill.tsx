"use client";
import Link from "next/link";
import { useState } from "react";
import { valuationRounds } from "@/lib/content/valuation-drill";

/** "Practice valuation: cheap or expensive?" — 6 rounds, real companies' P/E vs their sector. */
export function ValuationDrill() {
  const [i, setI] = useState(0); const [score, setScore] = useState(0); const [ans, setAns] = useState<null | "cheap" | "fair" | "expensive">(null);
  const r = valuationRounds[i]; const done = i >= valuationRounds.length;
  if (done) { try { const b = Number(localStorage.getItem("fic.best.valuation") || 0); if (score > b) localStorage.setItem("fic.best.valuation", String(score)); } catch {} return (
    <div className="pt-8 text-center"><div className="text-[40px]">🎯</div><h2 className="text-[22px] font-black text-ink mt-2">{score} / {valuationRounds.length}</h2><p className="text-[12px] font-bold text-ink-3 mt-1">+15 XP · practice only, never mixed with real returns</p><Link href="/practice" className="inline-flex mt-5 h-[46px] px-6 items-center rounded-[14px] bg-green text-cream-text font-black">Back to Practice</Link></div>); }
  const choose = (v: "cheap" | "fair" | "expensive") => { if (ans) return; setAns(v); if (v === r.answer) setScore((s) => s + 1); };
  return (
    <div className="pt-[14px] pb-6">
      <div className="flex justify-between text-[11px] font-black text-ink-3"><span>ROUND {i + 1} OF {valuationRounds.length}</span><span>score {score}</span></div>
      <div className="mt-3 bg-card border border-line rounded-[16px] px-4 py-4 text-center">
        <div className="text-[11px] font-black text-green">{r.symbol}</div><div className="text-[16px] font-black text-ink">{r.name}</div>
        <div className="mt-3 flex justify-center gap-6"><div><div className="text-[26px] font-black text-ink">{r.pe}×</div><div className="text-[9px] font-bold text-ink-3">P/E</div></div><div><div className="text-[26px] font-black text-ink-3">{r.sectorPe}×</div><div className="text-[9px] font-bold text-ink-3">{r.sector.toUpperCase()} AVG</div></div></div>
      </div>
      <p className="mt-4 text-[13.5px] font-black text-ink">Cheap, fair or expensive vs its sector?</p>
      <div className="mt-2 grid grid-cols-3 gap-2">{(["cheap", "fair", "expensive"] as const).map((v) => <button key={v} onClick={() => choose(v)} className={`h-[44px] rounded-[12px] text-[12px] font-black border ${ans ? (v === r.answer ? "bg-green-tint border-green-2 text-green" : v === ans ? "bg-[#F7E9E5] border-red text-red" : "bg-card border-line text-ink-3") : "bg-card border-line text-ink"}`}>{v[0].toUpperCase() + v.slice(1)}</button>)}</div>
      {ans && <div className="mt-3 rounded-[14px] bg-paper-2 px-4 py-3"><p className="text-[12px] font-bold text-ink-2 leading-[1.5]">{r.why}</p><button onClick={() => { setI(i + 1); setAns(null); }} className="mt-3 w-full h-[44px] rounded-[12px] bg-green-2 text-cream-text font-black">Next</button></div>}
    </div>
  );
}
