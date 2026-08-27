"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { openSheet } from "@/components/sheets/SheetHost";

/** Lesson — one immersive concept, zero chrome (v12 board 04). */
export function ValuationLesson() {
  const router = useRouter();
  const [pick, setPick] = useState<number | null>(null);
  const [state, setState] = useState<"ask" | "right" | "wrong">("ask");
  const opts = ["Investors expect earnings to grow fast", "The stock is guaranteed to fall", "It earns 60× more than rivals"];
  const check = () => { if (pick === null) return; setState(pick === 0 ? "right" : "wrong"); };
  const finish = () => { try { localStorage.setItem("fic.lesson.valuation", "done"); } catch {} router.push("/learn"); };
  return (
    <div className="relative min-h-full px-[18px] pt-[calc(14px+env(safe-area-inset-top))] pb-[110px]">
      <div className="flex items-center gap-3"><button aria-label="Close" onClick={() => router.push("/learn")} className="text-ink-2 text-[18px]">✕</button><div className="flex-1 flex gap-1">{[1, 1, 1, 0, 0].map((f, i) => <span key={i} className={`flex-1 h-[6px] rounded-[6px] ${f ? "bg-green-2" : "bg-line"}`} />)}</div><span className="text-[12px] font-black text-ink-3">⭐ +20</span></div>
      <span className="inline-block mt-4 rounded-[18px] bg-purple-tint px-3 py-1 text-[10.5px] font-black text-purple-2">CONCEPT · VALUATION</span>
      <h1 className="mt-2 text-[23px] font-black text-ink leading-tight">What is a P/E ratio?</h1>
      <div className="mt-3 bg-card border border-line rounded-[18px] px-4 py-4">
        <p className="text-[13px] font-bold text-[#4A4436] leading-[1.55]">If a lemonade stand earns <b className="text-ink">$10 a year</b> and sells for <b className="text-ink">$200</b>, you&apos;re paying <b className="text-ink">20×</b> its yearly earnings.</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="text-center"><div className="text-[22px] font-black text-ink">$200</div><div className="text-[9px] font-bold text-ink-3">PRICE</div></div><span className="text-[18px] font-black text-ink-4">÷</span>
          <div className="text-center"><div className="text-[22px] font-black text-ink">$10</div><div className="text-[9px] font-bold text-ink-3">EARNINGS</div></div><span className="text-[18px] font-black text-ink-4">=</span>
          <div className="text-center rounded-[12px] bg-green-tint px-3 py-1"><div className="text-[22px] font-black text-green">20×</div><div className="text-[9px] font-black text-green">P/E</div></div>
        </div>
      </div>
      <p className="mt-4 text-[13.5px] font-black text-ink">NVDA trades at 60×. What does that tell you?</p>
      <div className="mt-2 flex flex-col gap-2">{opts.map((o, i) => <button key={o} disabled={state !== "ask"} onClick={() => setPick(i)} className={`text-left rounded-[14px] px-3 py-3 flex items-center gap-3 border ${pick === i ? "bg-green-tint border-green-2" : "bg-card border-line"}`}><span className={`w-7 h-7 rounded-[8px] text-[12px] font-black flex items-center justify-center ${pick === i ? "bg-green-2 text-white" : "bg-line-2 text-ink-3"}`}>{"ABC"[i]}</span><span className="text-[13px] font-bold text-ink">{o}</span></button>)}</div>
      <button onClick={() => openSheet("kai", { context: "lesson:valuation" })} className="mt-3 w-full rounded-[11px] bg-purple-tint px-3 py-2 text-left text-[10.5px] font-black text-purple-2">✦ @Kai explain this more simply</button>
      {state !== "ask" && <div className={`mt-3 rounded-[14px] px-4 py-3 ${state === "right" ? "bg-green-tint" : "bg-[#F7E9E5]"}`}><div className="text-[13px] font-black text-ink">{state === "right" ? "Right — a high P/E means investors expect fast growth." : "Not quite. A high P/E means investors expect earnings to grow fast — it isn't a prediction of a fall, and it isn't a profit multiple vs rivals."}</div><div className="text-[11px] font-bold text-ink-3 mt-1">{state === "right" ? "+20 XP · concept unlocked for the CEG vote" : "No XP lost — try to explain it to someone at dinner."}</div></div>}
      <div className="absolute left-[18px] right-[18px] bottom-[44px]">
        {state === "ask" ? <button disabled={pick === null} onClick={check} className="w-full h-[52px] rounded-[16px] bg-green-2 text-cream-text text-[15px] font-black disabled:opacity-50">Check Answer</button> : <button onClick={finish} className="w-full h-[52px] rounded-[16px] bg-green text-cream-text text-[15px] font-black">Continue</button>}
      </div>
    </div>
  );
}
