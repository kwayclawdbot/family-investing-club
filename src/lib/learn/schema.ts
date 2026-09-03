/**
 * Lesson step schema — ported from FTA `src/lib/learn/schema.ts` (Learning World §1).
 *
 * `lessons.steps` (jsonb) holds either the full envelope `{ schema, title, steps, … }` or a bare
 * step array. Non-null → the stepped engine; null → the legacy video/html viewer. Every string is
 * authored content — there is no LLM in this flow. Audio fields are carried through untouched so a
 * lesson authored with narration still parses; FIC renders them as captions only.
 */

export const LESSON_SCHEMA_VERSION = 1 as const;

/** Who the copy is written for. Derived from the profile (age_group wins, then role). */
export type Register = "kid" | "teen" | "adult";

export type SkillId = string;

export interface AudioAsset { url: string; durationMs: number; say: string }
export type StepAudio = Record<string, AudioAsset>;

export interface ExplainerBeat {
  id: string;
  say: string;
  headline?: string;
  key?: { value: string; caption?: string };
  illustration?: LessonIllustration;
  playWalk?: boolean;
  audio?: AudioAsset;
}

/**
 * The eyebrow above a section — the teaching move it is making, in the member's words.
 * Ported from the FTA University lesson format, where the label is what gives a long lesson
 * its rhythm: the reader always knows whether they are being told, shown, or tested.
 */
export type SectionLabel =
  | "CORE CONCEPT" | "INTERACTIVE" | "KEY DISTINCTION" | "PROCESS" | "LIVE EXAMPLE"
  | "DATA VISUALIZATION" | "PRACTICE" | "EXERCISE" | "DEEPER INSIGHT" | "KNOWLEDGE CHECK" | "WRAP UP";

export interface BaseStep { id: string; type: string; skill?: SkillId; audio?: StepAudio; label?: SectionLabel }

/** One candle, in prices. Every candle-shaped section draws from this. */
export interface CandleSpec { open: number; high: number; low: number; close: number }
export type CandlePart = "open" | "high" | "low" | "close" | "body" | "upper_wick" | "lower_wick";

/* ── INTERACTIVE — tap each labelled part of a candle to learn what it is ── */
export interface AnatomyStep extends BaseStep {
  type: "anatomy";
  heading: string;
  caption?: string;
  candle: CandleSpec;
  hotspots: { part: CandlePart; title: string; body: string }[];
}

/* ── KEY DISTINCTION — two things held side by side ── */
export interface CompareStep extends BaseStep {
  type: "compare";
  heading: string;
  intro?: string;
  columns: { title: string; tone: "green" | "red" | "neutral"; candle?: CandleSpec; points: string[] }[];
  note?: string;
}

/* ── PROCESS — a sequence you run every time, revealed one move at a time ── */
export interface ProcessStep extends BaseStep {
  type: "process";
  heading: string;
  intro?: string;
  moves: { title: string; body: string }[];
  closing?: string;
}

/* ── LIVE EXAMPLE — a real quote, each number tappable for what it means ── */
export interface AnnotatedValuesStep extends BaseStep {
  type: "annotated_values";
  heading: string;
  subject: string;
  candle: CandleSpec;
  values: { part: CandlePart; label: string; value: string; meaning: string }[];
  caption?: string;
}

/* ── PRACTICE — flip to learn ── */
export interface FlipCardsStep extends BaseStep {
  type: "flip_cards";
  heading: string;
  intro?: string;
  cards: { front: string; back: string }[];
}

/* ── EXERCISE — build a candle to a spec, hands on the controls ── */
export interface BuildCandleStep extends BaseStep {
  type: "build_candle";
  heading: string;
  prompt: string;
  target: CandleSpec;
  tolerance?: number;
  hint?: string;
  success: string;
}

/* ── DEEPER INSIGHT — a slider that moves through a spectrum, commentary following it ── */
export interface RatioExplorerStep extends BaseStep {
  type: "ratio_explorer";
  heading: string;
  intro?: string;
  /** Bands are read in order; the first whose `upTo` is >= the current body share wins. */
  bands: { upTo: number; title: string; body: string; tone: "green" | "red" | "neutral" }[];
}

/* ── WRAP UP — what to carry out of the lesson ── */
export interface TakeawaysStep extends BaseStep {
  type: "takeaways";
  heading: string;
  points: string[];
  closing?: string;
}

export interface ExplainerStep extends BaseStep {
  type: "explainer";
  heading?: string;
  body: string[];
  figure?: { kind: "stat" | "quote"; value: string; caption?: string };
  illustration?: LessonIllustration;
  beats?: ExplainerBeat[];
}

export interface LessonSceneSpec {
  kind: "price_event";
  caption?: string;
  points: number[];
  eventIndex: number;
  eventLabel?: string;
  endLabel?: string;
}

export interface OrderBookIllustration {
  kind: "order_book";
  mode: "ladder" | "before_after" | "walk_up";
  bids: string[];
  asks: string[];
  spreadLabel?: string;
  showSpread?: boolean;
  after?: { bids: string[]; asks: string[]; label?: string };
  beforeLabel?: string;
  walkPrices?: string[];
  caption?: string;
}
export type LessonIllustration = OrderBookIllustration;

export interface MultipleChoiceStep extends BaseStep {
  type: "multiple_choice";
  question: string;
  framing?: string;
  scene?: LessonSceneSpec;
  options: string[];
  correctIndex: number;
  explanation?: string;
  wrongFeedback?: ({ text: string; kai?: boolean } | null)[];
  reinforce?: string;
}

export interface TrueFalseStep extends BaseStep {
  type: "true_false";
  statement: string;
  answer: boolean;
  explanation?: string;
  reinforce?: string;
  trueLabel?: string;
  falseLabel?: string;
}

export interface MatchPairsStep extends BaseStep {
  type: "match_pairs";
  prompt: string;
  pairs: { left: string; right: string }[];
  explanation?: string;
  reinforce?: string;
}

export interface PredictionStep extends BaseStep {
  type: "prediction";
  question: string;
  options: { label: string; value: string }[];
  outcomeValue: string;
  illustration?: LessonIllustration;
  reveal: { headline: string; body: string; scene?: LessonSceneSpec };
  guideOn?: { value: string; line: string };
}

export type RealWorldAction = "save_watchlist" | "research_ticker";

export interface RealWorldStep extends BaseStep {
  type: "real_world";
  action: RealWorldAction;
  ticker: string;
  company: string;
  prompt: string;
  cta: string;
  successText: string;
}

export type StepSpec =
  | ExplainerStep | MultipleChoiceStep | TrueFalseStep | MatchPairsStep | PredictionStep | RealWorldStep
  | AnatomyStep | CompareStep | ProcessStep | AnnotatedValuesStep | FlipCardsStep | BuildCandleStep
  | RatioExplorerStep | TakeawaysStep;
export type StepType = StepSpec["type"];

export interface LessonJSON {
  schema: typeof LESSON_SCHEMA_VERSION;
  title: string;
  skills: SkillId[];
  difficulty: number;
  audience: Register[];
  duration_minutes: number;
  xp: number;
  guide?: { intro?: string; outro?: string };
  audio?: StepAudio;
  steps: StepSpec[];
}

/** What a step reports back when the member has resolved it. */
export interface StepResult { correct?: boolean; firstTry?: boolean; skill?: SkillId }

export interface StepComponentProps<T extends StepSpec = StepSpec> {
  spec: T;
  register: Register;
  xpNote?: string;
  onResolve: (result: StepResult) => void;
}

/** Graded step types produce a correct/incorrect signal (prediction is a reveal, never punished). */
export function isGradedStep(type: string): boolean {
  return type === "multiple_choice" || type === "true_false" || type === "match_pairs" || type === "prediction";
}
/** Scored types feed the lesson score + quiz_attempts; prediction is excluded on purpose. */
export const SCORED_TYPES = new Set<string>(["multiple_choice", "true_false", "match_pairs"]);

export function isSteppedLesson(steps: unknown): steps is StepSpec[] {
  return Array.isArray(steps) && steps.length > 0;
}

/** Parse a `lessons.steps` value into a LessonJSON (full envelope or bare array). Null when unusable. */
export function parseLessonSteps(raw: unknown, fallback: { title: string; xp: number }): LessonJSON | null {
  if (!raw) return null;
  if (typeof raw === "object" && raw !== null && "steps" in raw && isSteppedLesson((raw as { steps: unknown }).steps)) {
    const env = raw as Partial<LessonJSON> & { steps: StepSpec[] };
    return {
      schema: LESSON_SCHEMA_VERSION,
      title: env.title ?? fallback.title,
      skills: env.skills ?? [],
      difficulty: env.difficulty ?? 1,
      audience: env.audience ?? ["adult", "teen", "kid"],
      duration_minutes: env.duration_minutes ?? 4,
      xp: env.xp ?? fallback.xp,
      guide: env.guide,
      audio: env.audio,
      steps: env.steps,
    };
  }
  if (isSteppedLesson(raw)) {
    return { schema: LESSON_SCHEMA_VERSION, title: fallback.title, skills: [], difficulty: 1, audience: ["adult", "teen", "kid"], duration_minutes: 4, xp: fallback.xp, steps: raw };
  }
  return null;
}

/** FTA `deriveRegister`: the explicit age band wins, then role, else adult. */
export function deriveRegister(p: { age_group?: string | null; role?: string | null } | null | undefined): Register {
  const age = (p?.age_group ?? "").toLowerCase();
  if (age === "kids") return "kid";
  if (age === "teens") return "teen";
  if (age === "adults") return "adult";
  const role = (p?.role ?? "").toLowerCase();
  if (role === "teen") return "teen";
  if (role === "child") return "kid";
  return "adult";
}

/** FTA XP amounts (src/lib/xp.ts) — the single source of truth for every learn action. */
export const LEARN_XP = { LESSON: 50, QUIZ_PASS: 30, QUIZ_PERFECT_BONUS: 20, FLASHCARDS: 20, RSVP: 5, RECORDING: 5, PRACTICE_ORDER: 10 } as const;
export const QUIZ_PASS_PCT = 70;
