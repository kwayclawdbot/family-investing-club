"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LessonData } from "@/lib/learn/types";
import type { StepSpec, StepResult } from "@/lib/learn/schema";
import { LEARN_XP, SCORED_TYPES, isGradedStep } from "@/lib/learn/schema";
import { isAllowedLessonOrigin, isBridgeMessage } from "@/lib/learn/legacy";
import { learnApi } from "@/lib/live/client-learn";
import { cx } from "@/components/ui";
import { FeedbackNote, KaiRow, LessonHeader, OptionButton, PrimaryButton } from "./engine-ui";
import { ExplainerStep, MatchPairsStep, MultipleChoiceStep, PredictionStep, RealWorldStep, TrueFalseStep } from "./steps";
import { AnatomyStep, AnnotatedValuesStep, BuildCandleStep, CompareStep, FlipCardsStep, ProcessStep, RatioExplorerStep, TakeawaysStep } from "./sections";

/**
 * The lesson player: the real FTA content, in FIC's shell.
 *
 * Two paths, one chrome. A lesson with `steps` runs the ported step engine (explainer → question →
 * prediction → real-world), saving `lesson_step_progress` as it goes so a member resumes where they
 * left off. Everything else is a legacy video (`video_provider`), where an `html` bundle talks back
 * over FTA's postMessage bridge. Both finish the same way: the lesson's quiz, then `/api/learn/complete`
 * banks the XP once.
 */
type Phase = "content" | "quiz" | "done";

export function LessonView({ lesson }: { lesson: LessonData }) {
  const router = useRouter();
  const steps = lesson.stepped?.steps ?? null;
  const total = steps?.length ?? 0;
  const [i, setI] = useState(() => Math.min(lesson.resumeStep, Math.max(0, total - 1)));
  const [phase, setPhase] = useState<Phase>("content");
  const [score, setScore] = useState({ correct: 0, scored: 0 });
  const [xp, setXp] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const backHref = `/learn/path/${lesson.courseSlug}`;
  // FTA's `html` lessons are whole interactive courses, not clips — they get the screen, not a
  // 16:9 well. Everything else keeps the padded reading column.
  const fullBleed = phase === "content" && !steps && lesson.videoProvider === "html";

  const pct = phase === "done" ? 100 : total ? Math.round((i / total) * 100) : lesson.progress.pct;

  /** Bank the lesson once the content (and quiz, if any) is behind us. */
  const finish = useCallback(async () => {
    setPhase("done");
    const r = await learnApi.complete(lesson.id, { stepTotal: total || undefined });
    if (r.ok) setXp(r.alreadyBanked ? 0 : r.xp);
    else setError(r.error);
    router.refresh();
  }, [lesson.id, total, router]);

  const afterContent = useCallback(() => {
    if (lesson.quiz) { setPhase("quiz"); return; }
    void finish();
  }, [lesson.quiz, finish]);

  /* ── stepped path ─────────────────────────────────────────────── */
  const onResolve = useCallback(async (spec: StepSpec, r: StepResult) => {
    if (SCORED_TYPES.has(spec.type)) setScore((s) => ({ correct: s.correct + (r.firstTry ? 1 : 0), scored: s.scored + 1 }));
    if (spec.skill && isGradedStep(spec.type)) void learnApi.mastery(spec.skill, !!r.firstTry);
    const next = i + 1;
    if (next < total) {
      setI(next);
      void learnApi.step(lesson.id, next);
      void learnApi.progress(lesson.id, Math.round((next / total) * 100));
      return;
    }
    void learnApi.step(lesson.id, total);
    afterContent();
  }, [i, total, lesson.id, afterContent]);

  if (lesson.locked) {
    return (
      <div className="min-h-full flex flex-col px-[18px] pt-[14px] pb-6">
        <LessonHeader backHref={backHref} pct={0} />
        <div className="mt-10 rounded-[18px] border border-line bg-card px-5 py-8 text-center">
          <div className="text-[26px]">🔒</div>
          <div className="mt-2 text-[15px] font-black text-ink">{lesson.title}</div>
          <p className="mt-2 text-[12.5px] font-bold text-ink-3 leading-[1.5]">{lesson.locked}</p>
          <Link href="/profile/billing" className="mt-4 inline-block rounded-[12px] bg-green text-cream-text px-4 py-2 text-[13px] font-black">See plans</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("flex flex-col", fullBleed ? "h-full pt-[14px]" : "min-h-full px-[18px] pt-[14px] pb-6")}>
      <div className={fullBleed ? "px-[18px]" : undefined}><LessonHeader backHref={backHref} pct={pct} right={<span className="text-[10.5px] font-extrabold text-ink-3">{lesson.courseTitle} · {lesson.lessonNo}/{lesson.lessonTotal}</span>} /></div>

      {phase === "content" && (steps ? (
        <StepHost key={steps[i]?.id ?? i} spec={steps[i]} register={lesson.register} xpNote={i === 0 ? `+${lesson.xp} XP` : undefined} onResolve={onResolve} />
      ) : (
        <VideoLesson lesson={lesson} onDone={afterContent} fullBleed={fullBleed} />
      ))}

      {phase === "quiz" && lesson.quiz && (
        <QuizRunner quiz={lesson.quiz} engine={score.scored ? score : null} onDone={() => void finish()} />
      )}

      {phase === "done" && (
        <div className="flex-1 flex flex-col">
          <div className="mt-6 rounded-[18px] border border-green-line bg-green-tint px-5 py-7 text-center">
            <div className="text-[30px]">🎉</div>
            <div className="mt-2 text-[18px] font-black text-ink">{lesson.title} — done</div>
            {xp !== null && <div className="mt-1 text-[13px] font-black text-green">{xp > 0 ? `+${xp} XP banked` : "Already banked — no double XP"}</div>}
            {error && <div role="alert" className="mt-1 text-[12px] font-bold text-coral">{error}</div>}
            {score.scored > 0 && <div className="mt-1 text-[11.5px] font-bold text-ink-3">{score.correct} of {score.scored} first try</div>}
          </div>
          {!!lesson.resources.length && <Resources lesson={lesson} />}
          <div className="mt-auto pt-6 flex flex-col gap-2">
            {lesson.next
              ? <PrimaryButton onClick={() => router.push(`/lesson/${lesson.next!.id}`)}>Next: {lesson.next.title}</PrimaryButton>
              : <PrimaryButton onClick={() => router.push(backHref)}>Back to the course</PrimaryButton>}
            <Link href="/learn" className="text-center text-[13px] font-extrabold text-ink-3">Learn home</Link>
          </div>
        </div>
      )}
    </div>
  );
}

/** One step, routed to its component. */
function StepHost({ spec, register, xpNote, onResolve }: { spec: StepSpec; register: LessonData["register"]; xpNote?: string; onResolve: (spec: StepSpec, r: StepResult) => void }) {
  const done = (r: StepResult) => onResolve(spec, r);
  const p = { register, xpNote, onResolve: done };
  switch (spec.type) {
    case "explainer": return <ExplainerStep spec={spec} {...p} />;
    case "multiple_choice": return <MultipleChoiceStep spec={spec} {...p} />;
    case "true_false": return <TrueFalseStep spec={spec} {...p} />;
    case "match_pairs": return <MatchPairsStep spec={spec} {...p} />;
    case "prediction": return <PredictionStep spec={spec} {...p} />;
    case "real_world": return <RealWorldStep spec={spec} {...p} />;
    // FTA University section vocabulary — see components/lesson/sections.tsx
    case "anatomy": return <AnatomyStep spec={spec} {...p} />;
    case "compare": return <CompareStep spec={spec} {...p} />;
    case "process": return <ProcessStep spec={spec} {...p} />;
    case "annotated_values": return <AnnotatedValuesStep spec={spec} {...p} />;
    case "flip_cards": return <FlipCardsStep spec={spec} {...p} />;
    case "build_candle": return <BuildCandleStep spec={spec} {...p} />;
    case "ratio_explorer": return <RatioExplorerStep spec={spec} {...p} />;
    case "takeaways": return <TakeawaysStep spec={spec} {...p} />;
    default: return <div className="flex-1 flex items-center justify-center text-[12.5px] font-bold text-ink-3">This step type isn&apos;t supported yet.</div>;
  }
}

/** Legacy viewer for the ~90 non-stepped lessons: an embedded video or an FTA html bundle. */
function VideoLesson({ lesson, onDone, fullBleed = false }: { lesson: LessonData; onDone: () => void; fullBleed?: boolean }) {
  const [watched, setWatched] = useState(lesson.progress.status === "completed");
  const frame = useRef<HTMLIFrameElement>(null);
  const src = useMemo(() => {
    const id = lesson.videoId;
    if (!id) return null;
    switch (lesson.videoProvider) {
      case "youtube": return id.startsWith("http") ? id : `https://www.youtube.com/embed/${id}`;
      case "bunny": return id.startsWith("http") ? id : `https://iframe.mediadelivery.net/embed/${id}`;
      case "mux": return id.startsWith("http") ? id : `https://stream.mux.com/${id}.m3u8`;
      default: return id;
    }
  }, [lesson.videoId, lesson.videoProvider]);

  // FTA's html bundles report progress over postMessage; anything else marks itself watched on play.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!isAllowedLessonOrigin(e.origin) || !isBridgeMessage(e.data)) return;
      if (e.data.event === "section") {
        const p = e.data.payload as { pct?: number } | undefined;
        if (typeof p?.pct === "number") void learnApi.progress(lesson.id, Math.max(0, Math.min(99, Math.round(p.pct))));
      }
      if (e.data.event === "complete") { setWatched(true); onDone(); }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [lesson.id, onDone]);

  useEffect(() => { void learnApi.progress(lesson.id, Math.max(lesson.progress.pct, 5)); }, [lesson.id, lesson.progress.pct]);

  // An html bundle is the lesson: it gets the whole screen, edge to edge, with only the slim
  // header above it and one action pinned below. A clip keeps its 16:9 well and the reading column.
  if (fullBleed) {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        {src ? (
          <iframe ref={frame} src={src} title={lesson.title} allow="autoplay; microphone; fullscreen" allowFullScreen
            className="flex-1 min-h-0 w-full border-0 bg-paper" />
        ) : (
          <p className="m-auto px-8 text-center text-[12.5px] font-bold text-ink-3">This lesson has no content attached yet.</p>
        )}
        <div className="shrink-0 border-t border-line bg-paper px-[18px] py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <PrimaryButton onClick={() => { setWatched(true); onDone(); }}>
            {watched ? "Continue" : lesson.quiz ? "Finished → take the quiz" : "Mark complete"}
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="mt-2 text-[21px] font-black text-ink leading-[1.25]">{lesson.title}</h1>
      <div className="text-[10.5px] font-extrabold text-ink-3">{lesson.moduleTitle} · {lesson.estMinutes} min</div>
      {lesson.description && <p className="mt-2 text-[13.5px] font-semibold text-ink-2 leading-[1.55]">{lesson.description}</p>}
      {src ? (
        <div className="mt-3 rounded-[16px] overflow-hidden border border-line bg-ink" style={{ aspectRatio: "16 / 9" }}>
          <iframe ref={frame} src={src} title={lesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen className="w-full h-full" />
        </div>
      ) : (
        <p className="mt-4 rounded-[14px] border border-line bg-card px-4 py-6 text-center text-[12.5px] font-bold text-ink-3">This lesson has no video attached yet.</p>
      )}
      {!!lesson.resources.length && <Resources lesson={lesson} />}
      <div className="mt-auto pt-5 flex flex-col gap-3">
        <KaiRow lessonId={lesson.id} />
        <PrimaryButton onClick={() => { setWatched(true); onDone(); }}>{watched ? "Continue" : lesson.quiz ? "I've watched it → quiz" : "Mark complete"}</PrimaryButton>
      </div>
    </div>
  );
}

/** The lesson's real quiz (`quizzes.questions`), graded server-side by /api/learn/quiz. */
function QuizRunner({ quiz, engine, onDone }: { quiz: NonNullable<LessonData["quiz"]>; engine: { correct: number; scored: number } | null; onDone: () => void }) {
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<(number | null)[]>(() => quiz.questions.map(() => null));
  const [result, setResult] = useState<{ score: number; passed: boolean; xp: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const q = quiz.questions[n];
  const last = n === quiz.questions.length - 1;

  const submit = async () => {
    setBusy(true); setError(null);
    const r = engine
      ? await learnApi.quizFromEngine(quiz.id, { score: Math.round((engine.correct / Math.max(1, engine.scored)) * 100), correct: engine.correct, total: engine.scored })
      : await learnApi.quiz(quiz.id, picked);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setResult({ score: r.score, passed: r.passed, xp: r.xp });
  };

  if (result) {
    return (
      <div className="flex-1 flex flex-col">
        <FeedbackNote kind={result.passed ? "correct" : "info"} title={result.passed ? `Passed · ${result.score}%` : `${result.score}% — needs ${quiz.passingScore}%`}
          action={<PrimaryButton onClick={onDone}>Continue</PrimaryButton>}>
          {result.passed ? `Quiz banked${result.xp ? ` · +${result.xp} XP` : ""}.` : "You can retake it any time — the lesson still counts."}
        </FeedbackNote>
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col">
      <div className="mt-2 text-[10.5px] font-black text-purple-2">QUIZ · {n + 1} of {quiz.questions.length}</div>
      <h1 className="mt-1 text-[21px] font-black text-ink leading-[1.3]">{q.question}</h1>
      <div className="mt-[18px] flex flex-col gap-[10px]" role="radiogroup" aria-label="Answers">
        {q.options.map((o, k) => (
          <OptionButton key={k} label={o} index={k} state={picked[n] === k ? "selected" : "idle"} onClick={() => setPicked((p) => p.map((v, j) => (j === n ? k : v)))} />
        ))}
      </div>
      <div className="mt-auto pt-5 flex flex-col gap-2">
        {error && <p role="alert" className="text-[12px] font-bold text-coral">{error}</p>}
        <PrimaryButton disabled={picked[n] === null || busy} onClick={() => (last ? void submit() : setN(n + 1))}>{last ? (busy ? "Scoring…" : "Finish quiz") : "Next question"}</PrimaryButton>
      </div>
    </div>
  );
}

function Resources({ lesson }: { lesson: LessonData }) {
  return (
    <div className="mt-4">
      <div className="text-[10.5px] font-black text-ink-3">RESOURCES</div>
      <div className="mt-1 rounded-[14px] border border-line bg-card px-[14px] py-[2px]">
        {lesson.resources.map((r, i) => {
          const href = r.externalUrl ?? r.fileUrl;
          const body = (
            <>
              <span className="text-[15px]">{r.type === "worksheet" ? "📄" : r.type === "video" ? "▶" : "🔗"}</span>
              <span className="flex-1 min-w-0"><span className="block text-[12.5px] font-extrabold text-ink truncate">{r.title}</span>{r.description && <span className="block text-[10px] font-bold text-ink-3 truncate">{r.description}</span>}</span>
            </>
          );
          const cls = cx("flex items-center gap-[10px] py-[10px]", i < lesson.resources.length - 1 && "border-b border-paper-2");
          return href
            ? <a key={r.id} href={href} target="_blank" rel="noreferrer" className={cls}>{body}<span className="text-ink-4">↗</span></a>
            : <div key={r.id} className={cls}>{body}</div>;
        })}
      </div>
    </div>
  );
}
