"use client";
import Link from "next/link";
import { useState } from "react";
import type { Question } from "@/lib/types";
import { ChevronLeft, CloseIcon, KaiSpark } from "@/components/ui/icons";

/** Artboard 21 — EXPLAIN stage: lesson video + quick check, per lesson. Only if-7 has one today. */
const EXPLAIN: Record<string, { path: string; lessonNo: number; title: string; goal: string; minutes: number; video: string; check: { q: string; options: string[]; answerIdx: number; why: string } }> = {
  "if-7": {
    path: "Investing Foundations", lessonNo: 7, title: "Why do stock prices move?", goal: "Explain supply & demand", minutes: 8, video: "2:14",
    check: { q: "Who actually sets a stock's price?", options: ["The company", "Buyers & sellers", "The exchange"], answerIdx: 1, why: "Buyers and sellers do — the company and the exchange only host the trade." },
  },
};

type Phase = "explain" | "answer" | "correct" | "wrong" | "done";
const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function LessonPlayer({ lessonId, questions }: { lessonId: string; questions: Question[] }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const explain = EXPLAIN[lessonId];
  const [phase, setPhase] = useState<Phase>(explain ? "explain" : "answer");
  const [earned, setEarned] = useState(0);
  const [quick, setQuick] = useState<number | null>(null);
  const totalXp = questions.reduce((a, b) => a + b.xp, 0);

  const q = questions[i];
  const total = questions.length;
  const progress = 10 + ((i + (phase === "answer" ? 0 : 1)) / total) * 90;

  function check() {
    if (picked === null) return;
    if (picked === q.answerIdx) {
      setEarned((e) => e + q.xp);
      setPhase("correct");
    } else {
      setPhase("wrong");
    }
  }
  function next() {
    if (i + 1 >= total) {
      setPhase("done");
      return;
    }
    setI(i + 1);
    setPicked(null);
    setPhase("answer");
  }

  if (phase === "done") return <Celebration xp={earned} lessonId={lessonId} />;

  if (phase === "explain" && explain) {
    const c = explain.check;
    const quickRight = quick === c.answerIdx;
    return (
      <div className="flex-1 flex flex-col px-5 pt-[18px] pb-[44px]">
        <div className="flex items-center gap-[14px]">
          <Link href="/learn" aria-label="Back to path" className="text-ink-3"><ChevronLeft size={22} /></Link>
          <div className="flex-1 h-[10px] rounded-[6px] bg-line overflow-hidden" role="progressbar" aria-valuenow={10} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-[6px] bg-green-2" style={{ width: "10%" }} />
          </div>
          <span className="text-[12px] font-black text-ink-3">⭐ +{totalXp}</span>
        </div>
        <div className="mt-4 text-[11.5px] font-extrabold text-orange tracking-[0.3px] uppercase">{explain.path} · Lesson {explain.lessonNo}</div>
        <h1 className="mt-1 text-[21px] font-black text-ink">{explain.title}</h1>
        <div className="flex gap-[7px] mt-[9px]">
          <span className="rounded-[9px] bg-purple-tint px-[11px] py-1 text-[10.5px] font-extrabold text-purple-2 uppercase">Goal: {explain.goal}</span>
          <span className="rounded-[9px] bg-card border border-line px-[11px] py-1 text-[10.5px] font-extrabold text-ink-3">⏱ {explain.minutes} MIN</span>
        </div>

        {/* Lesson video — placeholder frame; playback arrives with the video LMS */}
        <div className="relative mt-3 h-[190px] rounded-[16px] flex items-center justify-center" style={{ background: "repeating-linear-gradient(45deg,#3E3A30 0 10px,#4A4538 10px 20px)" }} aria-label={`Lesson video · ${explain.video}`}>
          <span className="absolute top-[10px] left-3 font-mono text-[10px] text-[#B9AE94]">lesson video · {explain.video}</span>
          <span className="w-14 h-14 rounded-full bg-[rgba(250,243,229,0.92)] flex items-center justify-center" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#2E2A21"><path d="M8 5v14l11-7z" /></svg>
          </span>
          <div className="absolute bottom-3 left-3 right-3 h-[5px] rounded-[3px] bg-[rgba(250,243,229,0.3)]"><div className="h-full w-[38%] rounded-[3px] bg-orange" /></div>
        </div>

        <div className="mt-3 rounded-[16px] border border-line bg-card px-4 py-[14px]">
          <div className="text-[11.5px] font-black text-green uppercase">Quick check · after the video</div>
          <div className="mt-[6px] text-[14.5px] font-extrabold text-ink">{c.q}</div>
          <div className="flex gap-2 mt-[10px]" role="radiogroup">
            {c.options.map((o, k) => (
              <button key={o} type="button" role="radio" aria-checked={quick === k} onClick={() => setQuick(k)}
                className={`flex-1 rounded-[11px] px-[6px] py-[9px] text-center text-[12px] font-extrabold text-ink transition ${quick === k ? (k === c.answerIdx ? "bg-green-tint border-2 border-green-2 font-black" : "bg-[#FBE9E4] border-2 border-red") : "bg-paper border-[1.5px] border-line"}`}>
                {o}
              </button>
            ))}
          </div>
          {quick !== null && <p className={`mt-2 text-[12px] font-bold ${quickRight ? "text-green" : "text-red"}`}>{quickRight ? "✓ Right — " : "Not quite — "}{c.why}</p>}
        </div>

        <Link href={`/kai?context=lesson:${lessonId}`} className="mt-[10px] flex items-center gap-[10px] rounded-[14px] border border-line bg-card px-[14px] py-[11px]">
          <span className="w-[26px] h-[26px] rounded-[9px] bg-purple text-white flex items-center justify-center"><KaiSpark size={13} /></span>
          <span className="text-[12.5px] font-bold text-ink-2">Ask <b className="text-purple-2">Kai</b> about this lesson — it knows exactly where you are.</span>
        </Link>

        <div className="mt-auto pt-5">
          <button onClick={() => setPhase("answer")} disabled={quick === null}
            className="w-full rounded-[16px] bg-green-2 py-[15px] text-center text-[15px] font-black text-cream-text shadow-[0_3px_0_#3A6B3E] disabled:opacity-50 disabled:shadow-none active:translate-y-[2px] active:shadow-none transition">
            Continue → Apply It
          </button>
        </div>
      </div>
    );
  }

  const answered = phase !== "answer";

  return (
    <div className="flex-1 flex flex-col px-5 pt-[18px] pb-[44px]">
      {/* top bar */}
      <div className="flex items-center gap-[14px]">
        <Link href="/learn" aria-label="Close lesson" className="text-ink-3">
          <CloseIcon size={20} />
        </Link>
        <div className="flex-1 h-[10px] rounded-[6px] bg-line overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-[6px] bg-green-2 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.max(progress, 8)}%` }} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[14px] leading-none">⭐</span>
          <span className="text-[13px] font-black text-ink-3">+{q.xp}</span>
        </div>
      </div>


      {/* concept chip */}
      <div className="mt-[22px] self-start inline-flex items-center gap-[6px] bg-purple-tint rounded-[20px] px-3 py-[5px]">
        <span className="w-[7px] h-[7px] rounded-full bg-purple" />
        <span className="text-[11.5px] font-extrabold text-purple-2 uppercase">Concept · {q.concept}</span>
      </div>

      <h1 className="mt-3 text-[22px] font-black text-ink leading-[1.3] text-pretty">{q.prompt}</h1>

      {/* options */}
      <div className="flex flex-col gap-[10px] mt-[22px]" role="radiogroup" aria-label="Answers">
        {q.options.map((opt, idx) => {
          const selected = picked === idx;
          const isAnswer = idx === q.answerIdx;
          let cls = "bg-card border-[1.5px] border-line shadow-[0_2px_0_#EFE4CF]";
          let badge = "bg-line-2 text-ink-3";
          if (!answered && selected) {
            cls = "bg-green-tint border-2 border-green-2 shadow-[0_2px_0_#C9DCBD]";
            badge = "bg-green-2 text-white";
          } else if (answered && isAnswer) {
            cls = "bg-green-tint border-2 border-green-2 shadow-[0_2px_0_#C9DCBD]";
            badge = "bg-green-2 text-white";
          } else if (answered && selected && !isAnswer) {
            cls = "bg-[#FBE9E4] border-2 border-red shadow-[0_2px_0_#E8C9C1]";
            badge = "bg-red text-white";
          }
          return (
            <button
              key={opt}
              role="radio"
              aria-checked={selected}
              disabled={answered}
              onClick={() => setPicked(idx)}
              className={`text-left rounded-[16px] px-4 py-[15px] flex items-center gap-3 transition active:scale-[0.99] motion-reduce:transition-none ${cls}`}
            >
              <span className={`w-[26px] h-[26px] rounded-[8px] flex items-center justify-center text-[13px] font-black shrink-0 ${badge}`}>
                {LETTERS[idx]}
              </span>
              <span className="text-[15.5px] font-extrabold text-ink">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* footer */}
      <div className="mt-auto pt-6">
        {phase === "answer" && (
          <>
            <Link
              href={`/kai?context=lesson:${lessonId}`}
              className="flex items-center gap-2 mb-3 bg-card border border-line rounded-[14px] px-[14px] py-[10px]"
            >
              <span className="w-[26px] h-[26px] rounded-[9px] bg-purple text-white flex items-center justify-center">
                <KaiSpark size={13} />
              </span>
              <span className="text-[12.5px] font-bold text-ink-2">
                Stuck? Ask <b className="text-purple-2">Kai</b> for a hint — it won&apos;t cost XP.
              </span>
            </Link>
            <button
              onClick={check}
              disabled={picked === null}
              className="w-full bg-green-2 rounded-[16px] py-4 text-center text-[16px] font-black text-cream-text shadow-[0_3px_0_#3A6B3E] disabled:opacity-50 disabled:shadow-none active:translate-y-[2px] active:shadow-none transition motion-reduce:transition-none"
            >
              Check Answer
            </button>
          </>
        )}

        {phase === "correct" && (
          <div className="bg-green-tint border-2 border-green-2 rounded-[18px] p-4">
            <div className="flex items-center justify-between">
              <div className="text-[16px] font-black text-green">Correct! 🎉</div>
              <span className="text-[13px] font-black text-green">+{q.xp} XP</span>
            </div>
            <p className="mt-1 text-[13px] font-semibold text-[#4A4436] leading-[1.5]">{q.explanation}</p>
            <button
              onClick={next}
              className="mt-3 w-full bg-green-2 rounded-[14px] py-[14px] text-[15px] font-black text-cream-text shadow-[0_3px_0_#3A6B3E]"
            >
              {i + 1 >= total ? "Finish lesson" : "Continue"}
            </button>
          </div>
        )}

        {phase === "wrong" && (
          <div className="bg-[#FBE9E4] border-2 border-red rounded-[18px] p-4">
            <div className="text-[16px] font-black text-red">Not quite</div>
            <p className="mt-1 text-[13px] font-bold text-ink">
              Correct answer: <span className="text-green">{q.options[q.answerIdx]}</span>
            </p>
            <p className="mt-1 text-[13px] font-semibold text-[#4A4436] leading-[1.5]">{q.explanation}</p>
            <button
              onClick={next}
              className="mt-3 w-full bg-red rounded-[14px] py-[14px] text-[15px] font-black text-cream-text shadow-[0_3px_0_#A8503F]"
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Celebration({ xp, lessonId }: { xp: number; lessonId: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 text-center">
      <div className="text-[64px] leading-none motion-safe:animate-[pop_.5s_ease-out]">🎉</div>
      <style>{`@keyframes pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}`}</style>
      <h1 className="mt-4 text-[26px] font-black text-ink">Lesson complete!</h1>
      <p className="mt-1 text-[14px] font-bold text-ink-3">You just made the market a little less mysterious.</p>

      <div className="mt-6 w-full flex gap-[9px]">
        <div className="flex-1 bg-card border border-line rounded-[13px] py-3 text-center">
          <div className="text-[20px] font-black text-orange">+{xp} XP</div>
          <div className="text-[10px] font-extrabold text-ink-3">EARNED</div>
        </div>
        <div className="flex-1 bg-card border border-line rounded-[13px] py-3 text-center">
          <div className="text-[20px] font-black text-ink">🔥 12</div>
          <div className="text-[10px] font-extrabold text-ink-3">STREAK KEPT</div>
        </div>
      </div>

      <div className="mt-6 w-full flex flex-col gap-[10px]">
        <Link
          href={`/lesson/${lessonId}`}
          className="w-full bg-orange rounded-[16px] py-4 text-[16px] font-black text-cream-text shadow-[0_3px_0_#C96D25]"
        >
          Next lesson →
        </Link>
        <Link href="/learn" className="w-full bg-card border border-line rounded-[16px] py-4 text-[15px] font-black text-ink">
          Back to path
        </Link>
      </div>
    </div>
  );
}
