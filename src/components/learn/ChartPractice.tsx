"use client";
import { useState } from "react";
import type { ChartDrill } from "@/lib/types";
import { Button, ButtonLink, Card, Tag, cx } from "@/components/ui";
import { ConceptChip } from "@/components/ui/extras";

const LETTERS = ["A", "B", "C", "D"];
const DIFF = ["Beginner", "Intermediate", "Advanced"];

/** Two-segment chart: history in green, revealed future in orange. */
function RevealChart({ series, reveal, show }: { series: number[]; reveal: number[]; show: boolean }) {
  const W = 330, H = 140, pad = 8;
  const all = show ? [...series, ...reveal] : series;
  const n = series.length + reveal.length;
  const min = Math.min(...all), max = Math.max(...all), span = max - min || 1;
  const pt = (v: number, i: number) => [((i / (n - 1)) * W).toFixed(1), (pad + (1 - (v - min) / span) * (H - pad * 2)).toFixed(1)] as const;
  const hist = series.map((v, i) => pt(v, i).join(",")).join(" ");
  const fut = show ? [series[series.length - 1], ...reveal].map((v, k) => pt(v, series.length - 1 + k).join(",")).join(" ") : "";
  const splitX = ((series.length - 1) / (n - 1)) * W;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className="mt-2">
      <line x1={splitX} x2={splitX} y1={0} y2={H} stroke="#E4DAC4" strokeDasharray="4 4" />
      <polyline fill="none" stroke="#4C8C4A" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" points={hist} vectorEffect="non-scaling-stroke" />
      {show && <polyline fill="none" stroke="#E58234" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" points={fut} vectorEffect="non-scaling-stroke" />}
      {!show && <text x={splitX + 6} y={16} fontSize="11" fontWeight="800" fill="#A89F8D">next?</text>}
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
      <div className="flex flex-col items-center text-center pt-10 pb-6">
        <div className="text-[56px] leading-none" aria-hidden>📈</div>
        <h1 className="mt-3 text-[24px] font-black text-ink">Drills complete</h1>
        <p className="text-[14px] font-bold text-ink-3 mt-1">{correct} of {drills.length} correct</p>
        <div className="mt-4 inline-flex items-center rounded-[20px] bg-purple-tint px-4 py-2 text-[14px] font-black text-purple-2">⭐ +{correct * 10} XP</div>
        <p className="mt-4 text-[12.5px] font-bold text-ink-3 leading-[1.5] px-4">Charts show what happened, not what will happen. The skill is reading the situation — then sizing your decision to what you don&apos;t know.</p>
        <div className="flex flex-col gap-2 mt-8 w-full">
          <Button onClick={restart} variant="green" full>Practice again</Button>
          <ButtonLink href="/learn/path/stock-market-101" variant="secondary" full>Technical analysis path</ButtonLink>
        </div>
      </div>
    );
  }

  const isRight = picked === d.answerIdx;
  return (
    <div className="pb-6">
      <div className="flex items-center justify-between mt-1">
        <div className="text-[13px] font-extrabold text-ink-3">Drill {i + 1} of {drills.length}</div>
        <Tag tone={i === 0 ? "green" : i === 1 ? "orange" : "purple"}>{DIFF[Math.min(i, 2)]}</Tag>
      </div>
      <Card className="mt-3 px-3 pt-3 pb-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[13px] font-black text-ink">{d.symbol}</span>
          <span className="text-[11px] font-extrabold text-ink-3">{revealed ? "next 2 weeks revealed" : "last 6 weeks"}</span>
        </div>
        <RevealChart series={d.series} reveal={d.reveal} show={revealed} />
      </Card>
      <p className="mt-4 text-[16px] font-black text-ink leading-[1.35]">{d.prompt}</p>
      <div className="flex flex-col gap-2 mt-3" role="radiogroup">
        {d.options.map((o, k) => {
          const sel = picked === k;
          const showRight = revealed && k === d.answerIdx;
          const showWrong = revealed && sel && !isRight;
          return (
            <button key={o} type="button" role="radio" aria-checked={sel} disabled={revealed} onClick={() => setPicked(k)}
              className={cx("flex items-center gap-3 rounded-[14px] border px-3 py-3 text-left transition", showRight ? "bg-green-tint border-green-2" : showWrong ? "bg-[#F8E1DC] border-red" : sel ? "bg-green-tint border-green-2" : "bg-card border-line")}>
              <span className={cx("w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black shrink-0", showRight || sel ? "bg-green text-cream-text" : "bg-paper-2 text-ink-3")}>{LETTERS[k]}</span>
              <span className="text-[13.5px] font-extrabold text-ink">{o}</span>
            </button>
          );
        })}
      </div>
      {revealed && (
        <Card tone={isRight ? "green" : "orange"} className="mt-4">
          <div className={cx("text-[13px] font-black", isRight ? "text-green" : "text-orange-3")}>{isRight ? "✓ Good read" : "Not quite"}</div>
          <p className="mt-1 text-[13.5px] font-bold text-ink leading-[1.5]">{d.explanation}</p>
          <div className="mt-3"><ConceptChip label={d.concept} definition={d.explanation} lessonHref="/learn/path/stock-market-101" /></div>
        </Card>
      )}
      <div className="mt-5">
        {revealed ? <Button onClick={next} variant="green" full>{i + 1 < drills.length ? "Next drill" : "Finish"}</Button> : <Button onClick={reveal} full disabled={picked === null}>Reveal</Button>}
      </div>
    </div>
  );
}
