/**
 * Lesson step schema — ported from FTA `src/lib/learn/schema.ts` (Learning World §1).
 *
 * `lessons.steps` (jsonb) holds either the full envelope `{ schema, title, steps, … }` or a bare
 * step array. Non-null → the stepped engine; null → the legacy video/html viewer. Every string is
 * authored content — there is no LLM in this flow.
 *
 * Audio is real narration, not decoration. Every `AudioAsset` is a committed static MP3 generated
 * ahead of time by `scripts/voice-lessons.mjs` from its own `say` line, so a lesson speaks the same
 * words every time and a copy edit re-renders one clip rather than the whole lesson. Cue ids are a
 * convention, not a schema: `main` is the section, `wrong-<i>` / `explanation` / `reinforce` /
 * `reask` are the question's own voice, and the lesson-level map carries `intro` and `outro`.
 * Narration is always optional — a lesson with no audio, or a member with the sound off, plays
 * exactly the same.
 */

export const LESSON_SCHEMA_VERSION = 1 as const;

/** Who the copy is written for. Derived from the profile (age_group wins, then role). */
export type Register = "kid" | "teen" | "adult";

export type SkillId = string;

export interface AudioAsset { url: string; durationMs: number; say: string }
export type StepAudio = Record<string, AudioAsset>;

/**
 * A photograph that carries the idea, not decoration. Art-directed per lesson and committed
 * under `public/lessons/<key>/`. `alt` is required because the picture is teaching: a member
 * on a screen reader has to get what the sighted member gets.
 */
export interface LessonMedia { src: string; alt: string; caption?: string }

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
  | "DATA VISUALIZATION" | "PRACTICE" | "EXERCISE" | "DEEPER INSIGHT" | "KNOWLEDGE CHECK" | "WRAP UP"
  | "ON THE CHART";

export interface BaseStep { id: string; type: string; skill?: SkillId; audio?: StepAudio; label?: SectionLabel; media?: LessonMedia }

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

/* ────────────────────────── a teaching chart ──────────────────────────
 *
 * Structure, zones, sweeps, gaps and opening ranges do not exist on one candle.
 * They exist ACROSS bars, and every one of them is a named OBJECT on the chart:
 * a swing that sits on a particular bar at a particular price, a zone with a top
 * and a bottom, a run of bars called out as one thing, a level that other days
 * respected. So a chart figure carries a real captured series plus annotations
 * that can address a BAR, a PRICE, a RANGE OF PRICES or a SPAN OF BARS — never a
 * part of a single candle.
 *
 * `validateChartFigure` is the gate, and `scripts/install-lessons.mjs` runs it
 * over every figure before it writes anything. A three-candle gap authored onto
 * one candle does not render badly; it does not install.
 */

/** One captured bar. Real historical prices, written into the lesson and frozen there. */
export interface ChartBar {
  /** Bar time as the member should read it — "09:50", "23 Jul". Drawn on the axis. */
  t: string;
  o: number; h: number; l: number; c: number;
}

/**
 * What an annotation points at.
 *  bar    — this candle
 *  span   — this run of candles, called out as one object (two or more, always)
 *  price  — this level
 *  band   — this range of prices: a zone, a gap, an opening range
 *  point  — this price ON this candle: a swing high, a swing low, a close
 */
export type ChartAnchor =
  | { at: "bar"; index: number }
  | { at: "span"; from: number; to: number }
  | { at: "price"; price: number }
  | { at: "band"; top: number; bottom: number; from?: number; to?: number }
  | { at: "point"; index: number; price: number };

/** Colour role, not colour. `up`/`down` are the candle greens and reds; the rest are annotation ink. */
export type ChartTone = "up" | "down" | "level" | "zone" | "note";

export interface ChartMark {
  id: string;
  anchor: ChartAnchor;
  /** Drawn on the chart itself. Short — it has to read at 402px. */
  chip: string;
  /** The pill under the chart. */
  name: string;
  /** The readout, once tapped. */
  title: string;
  body: string;
  tone?: ChartTone;
  /** Drills only: `reveal` marks stay hidden until the member has locked their call in. */
  phase?: "setup" | "reveal";
}

export interface ChartFigure {
  /** Always labelled. A member must know which company and which session they are reading. */
  ticker: string;
  /** "23 July 2026 · 5-minute" */
  session: string;
  bars: ChartBar[];
  marks: ChartMark[];
  /** Drills: bars from this index on are the resolution — drawn only after the call is locked. */
  revealFrom?: number;
  /** Extra price room the annotations need but the bars do not reach. */
  focus?: { top: number; bottom: number };
}

/* ── INTERACTIVE / LIVE EXAMPLE — step through the objects on a real chart ── */
export interface ChartStep extends BaseStep {
  type: "chart";
  heading: string;
  intro?: string;
  figure: ChartFigure;
  /** What to do before anything has been tapped. Authored per section — never assumed. */
  prompt: string;
  /** Continue label once every mark has been read. */
  done?: string;
}

/** The share of the frame the marked object must occupy before a figure is legible. */
export const CHART_MIN_OCCUPANCY = 0.2;

/**
 * Everything wrong with a figure, in plain sentences. Empty array = usable.
 *
 * The rules are the ones that were broken: a chart is a series (three bars minimum,
 * because the smallest thing taught here is a three-candle gap), a span is more than
 * one bar, a marked swing has to actually sit on the candle it names, a band has a
 * top above its bottom, and the object being taught has to be big enough in the frame
 * to look like the thing the heading calls it.
 */
export function validateChartFigure(f: ChartFigure, where = "figure"): string[] {
  const out: string[] = [];
  const at = (m: string) => out.push(`${where}: ${m}`);
  if (!f || typeof f !== "object") return [`${where}: missing`];
  if (!f.ticker) at("no ticker — every teaching chart is labelled");
  if (!f.session) at("no session label — every teaching chart says which day and timeframe");
  const bars = Array.isArray(f.bars) ? f.bars : [];
  if (bars.length < 3) at(`${bars.length} bar(s) — a teaching chart is a series; the smallest concept here (a fair value gap) needs three`);
  bars.forEach((b, i) => {
    const nums = [b.o, b.h, b.l, b.c];
    if (nums.some((n) => typeof n !== "number" || !Number.isFinite(n) || n <= 0)) { at(`bar ${i} has a price that is not a positive number`); return; }
    if (b.h < Math.max(b.o, b.c) || b.l > Math.min(b.o, b.c)) at(`bar ${i} is not a candle — the high must be the highest price and the low the lowest`);
    if (!b.t) at(`bar ${i} has no time label`);
  });
  if (!bars.length) return out;

  const lo = Math.min(...bars.map((b) => b.l));
  const hi = Math.max(...bars.map((b) => b.h));
  const range = hi - lo || 1;
  const marks = Array.isArray(f.marks) ? f.marks : [];
  if (!marks.length) at("no marks — a teaching chart with nothing named on it is decoration");
  const ids = new Set<string>();
  let mLo = Infinity, mHi = -Infinity;
  const see = (v: number) => { if (v < mLo) mLo = v; if (v > mHi) mHi = v; };

  for (const m of marks) {
    if (!m.id || ids.has(m.id)) at(`mark id "${m.id ?? ""}" is missing or repeated`);
    ids.add(m.id);
    if (!m.chip || !m.name || !m.title || !m.body) at(`mark "${m.id}" is missing chip/name/title/body`);
    const a = m.anchor;
    if (!a || typeof a !== "object") { at(`mark "${m.id}" has no anchor`); continue; }
    const inRange = (i: number) => Number.isInteger(i) && i >= 0 && i < bars.length;
    if (a.at === "bar") {
      if (!inRange(a.index)) at(`mark "${m.id}" points at bar ${a.index}, which is not in a ${bars.length}-bar series`);
      else { see(bars[a.index].l); see(bars[a.index].h); }
    } else if (a.at === "span") {
      if (!inRange(a.from) || !inRange(a.to)) at(`mark "${m.id}" spans bars ${a.from}–${a.to}, outside a ${bars.length}-bar series`);
      else if (a.to <= a.from) at(`mark "${m.id}" is a span of one bar — a span names a run of candles, so it needs at least two`);
      else for (let i = a.from; i <= a.to; i++) { see(bars[i].l); see(bars[i].h); }
    } else if (a.at === "price") {
      if (typeof a.price !== "number" || !Number.isFinite(a.price)) at(`mark "${m.id}" has no price`);
      else if (a.price < lo - range || a.price > hi + range) at(`mark "${m.id}" sits at ${a.price}, far outside the ${lo}–${hi} the bars cover`);
      else see(a.price);
    } else if (a.at === "band") {
      if (typeof a.top !== "number" || typeof a.bottom !== "number") at(`mark "${m.id}" needs a top and a bottom`);
      else if (a.top <= a.bottom) at(`mark "${m.id}" has a top (${a.top}) that is not above its bottom (${a.bottom})`);
      else { see(a.top); see(a.bottom); }
      if (a.from != null && !inRange(a.from)) at(`mark "${m.id}" starts at bar ${a.from}, outside the series`);
      if (a.to != null && !inRange(a.to)) at(`mark "${m.id}" ends at bar ${a.to}, outside the series`);
    } else if (a.at === "point") {
      if (!inRange(a.index)) at(`mark "${m.id}" points at bar ${a.index}, outside the series`);
      else {
        const b = bars[a.index];
        const slack = (b.h - b.l) * 0.02 + range * 0.002;
        if (a.price < b.l - slack || a.price > b.h + slack) at(`mark "${m.id}" marks ${a.price} on bar ${a.index}, but that candle only traded ${b.l}–${b.h} — a swing has to sit on the candle it names`);
        else see(a.price);
      }
    } else {
      at(`mark "${m.id}" has an anchor type this renderer does not draw`);
    }
  }

  if (f.focus) {
    if (f.focus.top <= f.focus.bottom) at("focus has a top that is not above its bottom");
    else { see(f.focus.top); see(f.focus.bottom); }
  }

  if (f.revealFrom != null) {
    if (!Number.isInteger(f.revealFrom) || f.revealFrom < 2 || f.revealFrom >= bars.length) {
      at(`revealFrom ${f.revealFrom} leaves no setup or no resolution in a ${bars.length}-bar series`);
    } else {
      for (const m of marks) {
        if (m.phase === "reveal") continue;
        const a = m.anchor;
        // A band's `to` is only how far the author extended a drawn zone to the right, which is
        // an act of drawing rather than knowledge of what price did. Its `from` is the bar it
        // was read off, and that is what has to sit inside the setup.
        const last = a.at === "bar" ? a.index : a.at === "span" ? a.to : a.at === "point" ? a.index : a.at === "band" ? (a.from ?? -1) : -1;
        if (last >= f.revealFrom) at(`mark "${m.id}" is part of the setup but reads off bar ${last}, which is behind the reveal — it would give the answer away`);
      }
    }
  }

  if (f.revealFrom != null && f.revealFrom >= 2 && f.revealFrom < bars.length) {
    // A drill draws one frame for both halves so the setup never changes shape under the reader.
    // That only works if the setup is big enough in that frame to be read while the call is open.
    const setup = bars.slice(0, f.revealFrom);
    const sLo = Math.min(...setup.map((b) => b.l)), sHi = Math.max(...setup.map((b) => b.h));
    const frame = Math.max(hi, mHi, f.focus?.top ?? -Infinity) - Math.min(lo, mLo, f.focus?.bottom ?? Infinity) || 1;
    const share = (sHi - sLo) / frame;
    if (share < 0.25) at(`the setup covers only ${(share * 100).toFixed(0)}% of the frame, so it will be a sliver while the call is open — give it more bars, or cut the resolution shorter`);
  }

  if (Number.isFinite(mLo) && Number.isFinite(mHi)) {
    const framedLo = Math.min(lo, mLo, f.focus?.bottom ?? Infinity);
    const framedHi = Math.max(hi, mHi, f.focus?.top ?? -Infinity);
    const frame = framedHi - framedLo || 1;
    const occ = (mHi - mLo) / frame;
    if (occ < CHART_MIN_OCCUPANCY) {
      at(`what is marked covers only ${(occ * 100).toFixed(0)}% of the frame — at 402px it will read as a sliver, not as the thing the heading names. Trim the bar window.`);
    }
  }
  return out;
}

/* ── KEY DISTINCTION — two things held side by side ── */
export interface CompareStep extends BaseStep {
  type: "compare";
  heading: string;
  intro?: string;
  /** `group` labels a run of adjacent columns — the rule that says which of them belong together. */
  columns: { title: string; tone: "green" | "red" | "neutral"; group?: string; candle?: CandleSpec; points: string[]; media?: LessonMedia }[];
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

/**
 * PREDICTION — a call, then the reveal. Never punished, never scored (see SCORED_TYPES);
 * the reveal is the teaching.
 *
 * `figure` is what makes a drill answerable: a member cannot read a chart they cannot see.
 * Its `revealFrom` splits the series — the setup is on screen while the call is open, the
 * resolution is drawn only once the call is locked in, and every mark tagged `reveal` is
 * held back with it.
 */
export interface PredictionStep extends BaseStep {
  type: "prediction";
  question: string;
  options: { label: string; value: string }[];
  outcomeValue: string;
  illustration?: LessonIllustration;
  /** Named `chart`, not `figure` — `figure` on an explainer is a stat/quote card and the two must never be confused. */
  chart?: ChartFigure;
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
  | RatioExplorerStep | TakeawaysStep | ChartStep;
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
  /** The lesson's own photograph, shown on the opening screen with `guide.intro`. */
  cover?: LessonMedia;
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
      cover: env.cover,
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
