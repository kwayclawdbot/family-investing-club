"use client";
import Link from "next/link";
import { useState } from "react";
import type { ChartDrill } from "@/lib/types";
import { Button, ButtonLink, Card, cx } from "@/components/ui";
import { ConceptChip } from "@/components/ui/extras";
import { ChevronLeft } from "@/components/ui/icons";

/**
 * Artboard 18 — Chart Sprint recognition drill. History in green with the support level (series low, orange dashed)
 * and prior high (grey dashed) drawn in; the revealed future is orange.
 */
function DrillChart({ series, reveal, show }: { series: number[]; reveal: number[]; show: boolean }) {
  const W = 330, H = 150, pad = 10;
  const all = show ? [...series, ...reveal] : series;
  const n = series.length + reveal.length;
  const min = Math.min(...all), max = Math.max(...all), span = max - min || 1;
  const y = (v: number) => pad + (1 - (v - min) / span) * (H - pad * 2);
  const pt = (v: number, i: number) => `${((i / (n - 1)) * W).toFixed(1)},${y(v).toFixed(1)}`;
  const hist = series.map(pt).join(" ");
  const fut = show ? [series[series.length - 1], ...reveal].map((v, k) => pt(v, series.length - 1 + k)).join(" ") : "";
  const support = y(Math.min(...series)), high = y(Math.max(...series));
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      <line x1={0} x2={W} y1={support} y2={support} stroke="#E58234" strokeWidth={1.5} strokeDasharray="5 4" />
      <line x1={0} x2={W} y1={high} y2={high} stroke="#B9AE94" strokeWidth={1.2} strokeDasharray="3 4" />
      <polyline fill="none" stroke="#4C8C4A" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" points={hist} vectorEffect="non-scaling-stroke" />
      {show && <polyline fill="none" stroke="#E58234" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" points={fut} vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

export function ChartPractice({ drills }: { drills: ChartDrill[] }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const d = drills[i];
  const done = i >= drills.length;

  function reveal() {
    if (picked === null) return;
    setRevealed(true);
    if (picked === d.answerIdx) setCorrect((c) => c + 1);
  }
  function next() { setI(i + 1); setPicked(null); setRevealed(false); }
  function restart() { setI(0); setPicked(null); setRevealed(false); setCorrect(0); }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center pt-12 pb-6 px-1">
        <div className="text-[56px] leading-none" aria-hidden>📈</div>
        <h1 className="mt-3 text-[24px] font-black text-ink">Sprint complete</h1>
        <p className="text-[14px] font-bold text-ink-3 mt-1">{correct} of {drills.length} correct</p>
        <div className="mt-4 inline-flex items-center rounded-[20px] bg-orange-tint px-4 py-2 text-[14px] font-black text-orange-2">🏅 +{correct * 10} XP</div>
        <p className="mt-4 text-[12.5px] font-bold text-ink-3 leading-[1.5] px-3">Charts show what happened, not what will happen. The skill is reading the situation — then sizing your decision to what you don&apos;t know.</p>
        <div className="flex flex-col gap-2 mt-8 w-full">
          <Button onClick={restart} variant="green" full>Play again</Button>
          <ButtonLink href="/learn/games" variant="secondary" full>Back to the Arcade</ButtonLink>
        </div>
      </div>
    );
  }

  const isRight = picked === d.answerIdx;
  const pct = ((i + (revealed ? 1 : 0)) / drills.length) * 100;
  return (
    <div className="flex flex-col min-h-full pt-[14px] pb-[24px]">
      <div className="flex items-center gap-[14px]">
        <Link href="/learn/games" aria-label="Back" className="text-ink-3"><ChevronLeft size={22} /></Link>
        <div className="flex-1 h-[10px] rounded-[6px] bg-line overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-[6px] bg-green-2 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.max(pct, 6)}%` }} />
        </div>
        <span className="text-[12px] font-black text-ink-3">{i + 1}/{drills.length}</span>
      </div>

      <div className="mt-[18px] flex items-center justify-between gap-2">
        <h1 className="text-[19px] font-black text-ink">Chart Sprint</h1>
        <span className="rounded-[9px] bg-orange-tint px-[11px] py-1 text-[10.5px] font-black text-orange-2 uppercase whitespace-nowrap">Level {i + 4} · {d.concept}</span>
      </div>

      <Card className="mt-3 px-[10px] pt-[14px] pb-2">
        <DrillChart series={d.series} reveal={d.reveal} show={revealed} />
        <div className="flex justify-between px-[6px] pt-1 text-[10px] font-extrabold text-ink-4">
          <span className="text-orange-2">— support (tested 3×)</span>
          <span>— prior high</span>
        </div>
      </Card>

      <p className="mt-[14px] text-[17px] font-black text-ink leading-[1.35]">{d.prompt}</p>

      <div className="flex flex-col gap-[9px] mt-[14px]" role="radiogroup">
        {d.options.map((o, k) => {
          const sel = picked === k;
          const showRight = revealed && k === d.answerIdx;
          const showWrong = revealed && sel && !isRight;
          return (
            <button key={o} type="button" role="radio" aria-checked={sel} disabled={revealed} onClick={() => setPicked(k)}
              className={cx("rounded-[14px] px-4 py-[13px] text-left text-[14.5px] font-extrabold text-ink transition",
                showRight || (sel && !revealed) ? "bg-green-tint border-2 border-green-2" : showWrong ? "bg-[#F8E1DC] border-2 border-red" : "bg-card border-[1.5px] border-line")}>
              {o}
            </button>
          );
        })}
      </div>

      {revealed && (
        <Card tone={isRight ? "green" : "orange"} className="mt-[14px]">
          <div className={cx("text-[13px] font-black", isRight ? "text-green" : "text-orange-3")}>{isRight ? "✓ Good read" : "Not quite"}</div>
          <p className="mt-1 text-[13.5px] font-bold text-ink leading-[1.5]">{d.explanation}</p>
          <div className="mt-3"><ConceptChip label={d.concept} definition={d.explanation} lessonHref="/learn/path/stock-market-101" /></div>
        </Card>
      )}

      <div className="mt-auto pt-5">
        {revealed ? (
          <button onClick={next} className="w-full rounded-[16px] bg-green-2 py-[15px] text-center text-[15px] font-black text-cream-text shadow-[0_3px_0_#3A6B3E] active:translate-y-[2px] active:shadow-none transition">{i + 1 < drills.length ? "Next chart" : "Finish sprint"}</button>
        ) : (
          <button onClick={reveal} disabled={picked === null} className="w-full rounded-[16px] bg-green-2 py-[15px] text-center text-[15px] font-black text-cream-text shadow-[0_3px_0_#3A6B3E] disabled:opacity-50 disabled:shadow-none active:translate-y-[2px] active:shadow-none transition">Reveal Outcome</button>
        )}
      </div>
    </div>
  );
}
