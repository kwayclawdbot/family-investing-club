"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ExplainerStep as ExplainerSpec, MatchPairsStep as MatchSpec, MultipleChoiceStep as McSpec, PredictionStep as PredictSpec, RealWorldStep as RealSpec, Register, StepComponentProps, StepResult, TrueFalseStep as TfSpec } from "@/lib/learn/schema";
import { learnApi } from "@/lib/live/client-learn";
import { cx } from "@/components/ui";
import { Eyebrow, FeedbackNote, GuideLine, OptionButton, PrimaryButton, shuffled, type OptionState } from "./engine-ui";

/* ── Explainer — Continue to advance; beats render as headline + spoken line ── */
export function ExplainerStep({ spec, onResolve }: StepComponentProps<ExplainerSpec>) {
  const beats = spec.beats?.length ? spec.beats : null;
  const [beat, setBeat] = useState(0);
  const last = !beats || beat >= beats.length - 1;
  return (
    <div className="fic-section flex-1 flex flex-col">
      {spec.label && <Eyebrow>{spec.label}</Eyebrow>}
      {spec.heading && <h1 className={cx("text-[22px] font-black text-ink leading-[1.3] text-pretty", spec.label && "mt-[6px]")}>{spec.heading}</h1>}
      {spec.figure && (
        <div className="mt-3 rounded-[16px] border border-gold/60 bg-gold-tint px-4 py-3">
          <div className="text-[18px] font-black text-ink">{spec.figure.kind === "quote" ? `“${spec.figure.value}”` : spec.figure.value}</div>
          {spec.figure.caption && <div className="text-[11.5px] font-bold text-ink-3 mt-[2px]">{spec.figure.caption}</div>}
        </div>
      )}
      {beats ? (
        <div className="mt-4">
          {beats[beat].headline && <div className="text-[18px] font-black text-ink">{beats[beat].headline}</div>}
          {beats[beat].key && <div className="mt-2 text-[24px] font-black text-green">{beats[beat].key!.value}<span className="block text-[11.5px] font-bold text-ink-3">{beats[beat].key!.caption}</span></div>}
          <p className="mt-2 text-[15px] font-semibold text-ink-2 leading-[1.6]">{beats[beat].say}</p>
          <div className="mt-3 flex gap-[5px]" aria-hidden>{beats.map((_, k) => <span key={k} className={cx("flex-1 h-[5px] rounded-[3px]", k <= beat ? "bg-green-2" : "bg-line-3")} />)}</div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {spec.body.map((p, i) => <p key={i} className="text-[15px] font-semibold text-ink-2 leading-[1.6]">{p}</p>)}
        </div>
      )}
      <div className="mt-auto pt-6">
        <PrimaryButton onClick={() => (last ? onResolve({}) : setBeat((b) => b + 1))}>{last ? "Got it → Continue" : "Next"}</PrimaryButton>
      </div>
    </div>
  );
}

/* ── ChoiceCore — mastery loop shared by multiple_choice + true_false ──
   wrong → Kai explains → re-ask a reshuffled variant → resolve only once corrected (or revealed). */
type Phase = "first" | "explaining" | "reask" | "revealed" | "done";
function ChoiceCore({ options, correctIndex, explanation, reinforce, register, onResolve, feedbackFor, reaskLabel = "Let's try that again.", letters = true, xpNote, seed }: {
  options: string[]; correctIndex: number; explanation?: string; reinforce?: string; register: Register; onResolve: (r: StepResult) => void;
  feedbackFor?: (i: number) => { text: string; kai?: boolean } | null; reaskLabel?: string; letters?: boolean; xpNote?: string; seed: number;
}) {
  const [phase, setPhase] = useState<Phase>("first");
  const [selected, setSelected] = useState<number | null>(null);
  const [firstTry, setFirstTry] = useState(false);
  const [lastWrong, setLastWrong] = useState<number | null>(null);
  const baseOrder = useMemo(() => options.map((_, i) => i), [options]);
  const reaskOrder = useMemo(() => { const o = shuffled(baseOrder, seed); return o.every((v, i) => v === baseOrder[i]) && o.length > 1 ? [...o].reverse() : o; }, [baseOrder, seed]);
  const order = phase === "reask" ? reaskOrder : baseOrder;
  const answering = phase === "first" || phase === "reask";

  function check() {
    if (selected === null) return;
    if (selected === correctIndex) { if (phase === "first") setFirstTry(true); setPhase("done"); return; }
    setLastWrong(selected);
    if (phase === "first") setPhase("explaining"); else setPhase("revealed");
  }
  const wrongNote = lastWrong !== null ? feedbackFor?.(lastWrong) ?? null : null;
  const stateFor = (i: number): OptionState => {
    if (answering) return selected === i ? "selected" : "idle";
    if (i === correctIndex && (phase === "done" || phase === "revealed")) return "correct";
    if (i === lastWrong && phase !== "done") return "wrong";
    return "dim";
  };

  return (
    <>
      <div className="flex flex-col gap-[10px] mt-[18px]" role="radiogroup" aria-label="Answers">
        {order.map((optIdx) => <OptionButton key={`${phase}-${optIdx}`} label={options[optIdx]} index={optIdx} letter={letters} state={stateFor(optIdx)} disabled={!answering} onClick={() => setSelected(optIdx)} />)}
      </div>
      <div className="mt-auto pt-5 flex flex-col gap-3">
        {answering && (
          <>
            {phase === "reask" && <GuideLine register={register}>{reaskLabel}</GuideLine>}
            <PrimaryButton onClick={check} disabled={selected === null}>Check answer{xpNote ? ` · ${xpNote}` : ""}</PrimaryButton>
          </>
        )}
        {phase === "explaining" && (
          <FeedbackNote kind="wrong" title="Not quite" action={<PrimaryButton tone="red" onClick={() => { setSelected(null); setPhase("reask"); }}>Try again</PrimaryButton>}>
            {wrongNote?.text ?? explanation ?? "Read the question once more — the answer is in the wording."}
          </FeedbackNote>
        )}
        {phase === "revealed" && (
          <FeedbackNote kind="info" title={`The answer: ${options[correctIndex]}`} action={<PrimaryButton onClick={() => onResolve({ correct: true, firstTry: false })}>Got it → Continue</PrimaryButton>}>
            {explanation}
          </FeedbackNote>
        )}
        {phase === "done" && (
          <FeedbackNote kind="correct" title={firstTry ? (register === "kid" ? "Yes! 🎉" : "Correct 🎉") : "That's it"} action={<PrimaryButton onClick={() => onResolve({ correct: true, firstTry })}>Continue</PrimaryButton>}>
            {firstTry ? reinforce ?? explanation : explanation ?? reinforce}
          </FeedbackNote>
        )}
      </div>
    </>
  );
}

export function MultipleChoiceStep({ spec, register, onResolve, xpNote }: StepComponentProps<McSpec>) {
  return (
    <div className="fic-section flex-1 flex flex-col">
      {spec.label && <Eyebrow tone="purple">{spec.label}</Eyebrow>}
      <h1 className={cx("text-[22px] font-black text-ink leading-[1.3] text-pretty", spec.label && "mt-[6px]")}>{spec.question}</h1>
      <ChoiceCore options={spec.options} correctIndex={spec.correctIndex} explanation={spec.explanation} reinforce={spec.reinforce} register={register} onResolve={onResolve} feedbackFor={(i) => spec.wrongFeedback?.[i] ?? null} xpNote={xpNote} seed={spec.question.length * 7 + spec.options.length} />
    </div>
  );
}

export function TrueFalseStep({ spec, register, onResolve, xpNote }: StepComponentProps<TfSpec>) {
  const options = [spec.trueLabel ?? "True", spec.falseLabel ?? "False"];
  return (
    <div className="fic-section flex-1 flex flex-col">
      <Eyebrow tone="purple">True or false?</Eyebrow>
      <h1 className="mt-2 text-[22px] font-black text-ink leading-[1.3] text-pretty">{spec.statement}</h1>
      <ChoiceCore options={options} correctIndex={spec.answer ? 0 : 1} explanation={spec.explanation} reinforce={spec.reinforce} register={register} onResolve={onResolve} reaskLabel="Read it once more, then decide." letters={false} xpNote={xpNote} seed={spec.statement.length} />
    </div>
  );
}

/* ── Match pairs — tap left, then its match; a wrong link explains once, never resets ── */
export function MatchPairsStep({ spec, register, onResolve, xpNote }: StepComponentProps<MatchSpec>) {
  const n = spec.pairs.length;
  const rightOrder = useMemo(() => shuffled(spec.pairs.map((_, i) => i), n * 13 + spec.prompt.length), [spec.pairs, spec.prompt.length, n]);
  const [left, setLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(() => new Set());
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [explained, setExplained] = useState(false);
  const done = matched.size === n;

  function pickRight(i: number) {
    if (left === null || matched.has(i) || done) return;
    if (i === left) { const next = new Set(matched); next.add(i); setMatched(next); setLeft(null); setWrong(null); }
    else { setMistakes((m) => m + 1); setWrong(i); setExplained(true); window.setTimeout(() => setWrong(null), 600); }
  }
  const cell = "rounded-[14px] border-[1.5px] px-3 py-[11px] text-left text-[13.5px] font-extrabold leading-[1.3] transition motion-reduce:transition-none";
  return (
    <div className="fic-section flex-1 flex flex-col">
      <Eyebrow tone="purple">Match the pairs</Eyebrow>
      <h1 className="mt-2 text-[20px] font-black text-ink leading-[1.3] text-pretty">{spec.prompt}</h1>
      <div className="mt-4 grid grid-cols-2 gap-[8px]">
        <div className="flex flex-col gap-[8px]">
          {spec.pairs.map((p, i) => (
            <button key={i} type="button" disabled={matched.has(i) || done} aria-pressed={left === i} onClick={() => setLeft(i)} className={cx(cell, matched.has(i) ? "bg-green-tint border-green-2 text-green" : left === i ? "bg-orange-tint border-orange text-ink" : "bg-card border-line text-ink")}>{p.left}</button>
          ))}
        </div>
        <div className="flex flex-col gap-[8px]">
          {rightOrder.map((orig) => (
            <button key={orig} type="button" disabled={matched.has(orig) || done || left === null} onClick={() => pickRight(orig)} className={cx(cell, matched.has(orig) ? "bg-green-tint border-green-2 text-green" : wrong === orig ? "bg-[#FBE9E4] border-red text-red" : left === null ? "bg-card border-line text-ink-3" : "bg-card border-line text-ink")}>{spec.pairs[orig].right}</button>
          ))}
        </div>
      </div>
      <div className="mt-auto pt-5 flex flex-col gap-3">
        {!done && explained && <GuideLine register={register}>{spec.explanation ?? "Not that one — think about what each side means, then try another match."}</GuideLine>}
        {!done && !explained && <p className="text-center text-[12px] font-bold text-ink-4">Tap a word on the left, then its match on the right{xpNote ? ` · ${xpNote}` : ""}</p>}
        {done && (
          <FeedbackNote kind="correct" title={mistakes === 0 ? "All matched — first try 🎉" : "All matched"} action={<PrimaryButton onClick={() => onResolve({ correct: true, firstTry: mistakes === 0 })}>Continue</PrimaryButton>}>{spec.reinforce ?? spec.explanation}</FeedbackNote>
        )}
      </div>
    </div>
  );
}

/* ── Prediction → reveal (never punished; the reveal teaches) ── */
export function PredictionStep({ spec, register, onResolve }: StepComponentProps<PredictSpec>) {
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const correct = picked === spec.outcomeValue;
  const guide = spec.guideOn && picked === spec.guideOn.value ? spec.guideOn.line : correct ? "You called it." : "Good call to think it through — here's what really happened.";
  const paras = spec.reveal.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="fic-section flex-1 flex flex-col">
      <Eyebrow tone="purple">{spec.label ?? "Make a prediction"}</Eyebrow>
      <h1 className="mt-2 text-[22px] font-black text-ink leading-[1.3] text-pretty">{spec.question}</h1>
      <div className="mt-[18px] flex flex-col gap-[10px]" role="radiogroup" aria-label="Predictions">
        {spec.options.map((o, i) => (
          <OptionButton key={o.value} label={o.label} index={i} disabled={revealed} state={revealed ? (o.value === spec.outcomeValue ? "correct" : o.value === picked ? "wrong" : "dim") : picked === o.value ? "selected" : "idle"} onClick={() => setPicked(o.value)} />
        ))}
      </div>
      <div className="mt-auto pt-5 flex flex-col gap-3">
        {!revealed ? (
          <PrimaryButton tone="orange" onClick={() => setRevealed(true)} disabled={picked === null}>Lock it in → Reveal</PrimaryButton>
        ) : (
          <>
            <GuideLine register={register}>{guide}</GuideLine>
            <FeedbackNote kind="info" title={spec.reveal.headline} action={<PrimaryButton onClick={() => onResolve({ correct, firstTry: correct })}>Continue</PrimaryButton>}>
              {paras.map((p, i) => <p key={i} className={i ? "mt-2" : ""}>{p}</p>)}
            </FeedbackNote>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Real world — leave the lesson, do the thing, come back and verify the real artifact ── */
export function RealWorldStep({ spec, register, onResolve }: StepComponentProps<RealSpec>) {
  const [checking, setChecking] = useState(false);
  const [notYet, setNotYet] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ticker = spec.ticker.toUpperCase();
  const href = spec.action === "save_watchlist" ? `/discover/${ticker}?add=watchlist` : `/discover/${ticker}`;
  const check = useCallback(async () => {
    if (checking || confirmed) return;
    setChecking(true); setNotYet(false); setError(null);
    const r = await learnApi.realWorld(spec.action, ticker);
    setChecking(false);
    if (!r.ok) { setError(r.error); return; }
    if (r.done) setConfirmed(true); else setNotYet(true);
  }, [checking, confirmed, spec.action, ticker]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible" && !confirmed) void check(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [check, confirmed]);
  return (
    <div className="fic-section flex-1 flex flex-col">
      <Eyebrow tone="green">Real world · {spec.company} ({ticker})</Eyebrow>
      <h1 className="mt-2 text-[21px] font-black text-ink leading-[1.3] text-pretty">{spec.prompt}</h1>
      <div className="mt-4 rounded-[16px] border border-line bg-card px-4 py-[14px]">
        <div className="text-[11.5px] font-black text-green uppercase">What to do</div>
        <p className="mt-1 text-[13.5px] font-bold text-ink-2 leading-[1.5]">{spec.action === "save_watchlist" ? `Open ${spec.company} and add it to your family watchlist, then come back here.` : `Open ${spec.company}'s page, read the quote, and record what you think — then come back.`}</p>
        <Link href={href} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-[40px] items-center rounded-[12px] bg-orange px-[18px] text-[13.5px] font-black text-cream-text shadow-[0_3px_0_#C96D25]">{spec.cta} ↗</Link>
      </div>
      <div className="mt-auto pt-5 flex flex-col gap-3">
        {confirmed ? (
          <FeedbackNote kind="correct" title={register === "kid" ? "You did it! 🎉" : "Done ✓"} action={<PrimaryButton onClick={() => onResolve({})}>Continue</PrimaryButton>}>{spec.successText}</FeedbackNote>
        ) : (
          <>
            {notYet && <GuideLine register={register}>{spec.action === "save_watchlist" ? `I don't see ${ticker} on your family watchlist yet. Add it on the page that opened, then tap “I did it”.` : `I don't see a note on ${ticker} yet. Record your take on its page, then tap “I did it”.`}</GuideLine>}
            {error && <p className="text-[12px] font-bold text-red">{error}</p>}
            <PrimaryButton onClick={check} disabled={checking}>{checking ? "Checking…" : "I did it — check"}</PrimaryButton>
            <button type="button" onClick={() => onResolve({})} className="text-[13px] font-extrabold text-ink-3">Skip for now</button>
          </>
        )}
      </div>
    </div>
  );
}
