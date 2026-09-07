/**
 * The step shapes the lesson player renders.
 *
 * These mirror the web app's `lib/learn/schema.ts` — same JSON, read by two players — so a lesson
 * authored once looks like the same lesson in both. The renderer handles the shapes that carry the
 * belt courses today; anything else falls through to a stated "not in this app yet" rather than a
 * blank screen, which is the failure the frozen legacy app is full of.
 */
export type LessonMedia = { src: string; alt: string; caption?: string };
export type AudioCue = { url: string; durationMs?: number };
export type StepAudio = { main?: AudioCue; [k: string]: AudioCue | undefined };

type Base = { id: string; type: string; label?: string; audio?: StepAudio };

export type ExplainerStep = Base & {
  type: "explainer";
  heading?: string;
  /** Authored as paragraphs, not one blob. */
  body: string[];
  /** A number or a line worth setting large — not an image. */
  figure?: { kind: "stat" | "quote"; value: string; caption?: string };
  media?: LessonMedia;
};
export type CompareStep = Base & {
  type: "compare"; heading: string; intro?: string; media?: LessonMedia;
  columns: { title: string; tone: "green" | "red" | "neutral"; group?: string; points: string[]; media?: LessonMedia }[];
  note?: string;
};
export type ProcessStep = Base & { type: "process"; heading: string; intro?: string; moves: { title: string; body: string }[]; closing?: string };
export type FlipCardsStep = Base & { type: "flip_cards"; heading: string; intro?: string; cards: { term: string; meaning: string }[] };
export type MultipleChoiceStep = Base & {
  type: "multiple_choice"; question: string; options: string[]; correctIndex: number;
  explanation?: string;
  /** One entry per option, in order — the answer to "why did I get that wrong". */
  wrongFeedback?: { text: string }[];
  reinforce?: string;
};
export type TakeawaysStep = Base & { type: "takeaways"; heading: string; points: string[]; closing?: string };
export type UnknownStep = Base & { type: string };

export type StepSpec =
  | ExplainerStep | CompareStep | ProcessStep | FlipCardsStep | MultipleChoiceStep | TakeawaysStep | UnknownStep;

export type LessonJSON = {
  title: string;
  duration_minutes?: number;
  xp?: number;
  guide?: { intro?: string; outro?: string };
  cover?: LessonMedia;
  audio?: StepAudio;
  steps: StepSpec[];
};

/** Media paths are authored relative to the web app's /public. Native needs them absolute. */
export function assetUrl(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  const base = process.env.EXPO_PUBLIC_ASSET_BASE ?? process.env.EXPO_PUBLIC_API_BASE ?? "";
  return `${base}${src.startsWith("/") ? "" : "/"}${src}`;
}
