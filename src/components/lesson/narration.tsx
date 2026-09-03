"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { AudioAsset, StepAudio } from "@/lib/learn/schema";
import { cx } from "@/components/ui";

/**
 * Lesson narration — the voice, ported from the FTA University lessons and made native.
 *
 * The FTA bundles shipped one continuous MP3 per lesson and seeked into it by timestamp, because
 * the whole lesson was one scrolling page. Here the engine already shows exactly one section at a
 * time, so a cue is a file: `scripts/voice-lessons.mjs` renders one MP3 per `say` line and commits
 * it. Sync is then a fact rather than a calculation — the section on screen plays its own clip, a
 * wrong answer plays its own clip, and nothing can drift.
 *
 * Three rules this component exists to keep:
 *
 *  1. **Narration never blocks the lesson.** No await, no gate, no disabled button. If the file is
 *     missing, the network is out, or the member never gives the page a gesture, every section
 *     still advances and the lesson still completes. Failures are swallowed on purpose.
 *  2. **One <audio> element for the whole lesson.** iOS unlocks playback per element per gesture,
 *     so a shared element unlocked once on "Play it to me" keeps working for every later cue.
 *  3. **Every spoken word is also readable.** `say` is the caption, verbatim, so sound-off is a
 *     complete experience rather than a degraded one.
 */

type Ctx = {
  /** Member wants the voice. Persisted; false until they ask for it. */
  on: boolean;
  setOn: (v: boolean) => void;
  captions: boolean;
  setCaptions: (v: boolean) => void;
  playing: boolean;
  /** The cue currently loaded — what the bar and the captions are showing. */
  cue: AudioAsset | null;
  /** Queue a cue. Loads it whether or not the voice is on, so the caption follows the lesson. */
  play: (cue: AudioAsset | undefined | null, opts?: { force?: boolean }) => void;
  toggle: () => void;
  /** Bumped every time a cue finishes. A screen that waits for its own line watches this. */
  endedAt: number;
  /** True once any lesson in this session has audio at all — hides the bar for silent lessons. */
  available: boolean;
  register: (has: boolean) => void;
};

const NarrationCtx = createContext<Ctx | null>(null);
const KEY_ON = "fic.narration.on";
const KEY_CC = "fic.narration.cc";

/**
 * Two preferences that outlive the lesson, kept as an external store rather than component state.
 *
 * `localStorage` cannot be read while rendering — the server has no idea whether this member
 * likes the voice on, so reading it during render would hand React two different trees. A store
 * with `useSyncExternalStore` gives the server the default, the client the truth, and one
 * subscription for every consumer. Every access is wrapped: a browser with site data blocked
 * throws on read, and the lesson must still play.
 */
const flags = new Map<string, boolean>();
const listeners = new Set<() => void>();
function read(key: string, fallback: boolean) {
  if (flags.has(key)) return flags.get(key)!;
  let v = fallback;
  try { const raw = window.localStorage.getItem(key); if (raw !== null) v = raw === "1"; } catch { /* blocked — use the default */ }
  flags.set(key, v);
  return v;
}
function write(key: string, v: boolean) {
  flags.set(key, v);
  try { window.localStorage.setItem(key, v ? "1" : "0"); } catch { /* private mode — the session still works */ }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
function usePersisted(key: string, fallback: boolean) {
  return useSyncExternalStore(subscribe, () => read(key, fallback), () => fallback);
}

export function NarrationProvider({ children }: { children: React.ReactNode }) {
  const el = useRef<HTMLAudioElement | null>(null);
  const on = usePersisted(KEY_ON, false);
  const captions = usePersisted(KEY_CC, false);
  const [playing, setPlaying] = useState(false);
  const [cue, setCue] = useState<AudioAsset | null>(null);
  const [available, setAvailable] = useState(false);
  const [endedAt, setEndedAt] = useState(0);

  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    el.current = a;
    const p = () => setPlaying(true);
    const s = () => setPlaying(false);
    const e = () => { setPlaying(false); setEndedAt((n) => n + 1); };
    a.addEventListener("play", p); a.addEventListener("pause", s); a.addEventListener("ended", e);
    // A missing or unplayable file is a silent no-op, never an error the member has to clear.
    a.addEventListener("error", s);
    return () => { a.pause(); a.removeEventListener("play", p); a.removeEventListener("pause", s); a.removeEventListener("ended", e); a.removeEventListener("error", s); el.current = null; };
  }, []);

  const setOn = useCallback((v: boolean) => {
    write(KEY_ON, v);
    if (!v) el.current?.pause();
  }, []);
  const setCaptions = useCallback((v: boolean) => write(KEY_CC, v), []);

  /**
   * Queue a cue. The cue is always set — captions follow the lesson whether or not anyone is
   * listening — but the FILE is only fetched when the voice is actually on. A member reading
   * with the sound off should not pull down six minutes of MP3 they will never hear, and on a
   * phone that is the difference between 2.4 MB and nothing.
   */
  const pending = useRef<AudioAsset | null>(null);
  const load = (a: HTMLAudioElement, cue: AudioAsset) => {
    if (a.src !== new URL(cue.url, window.location.href).href) a.src = cue.url;
    a.currentTime = 0;
  };
  const play = useCallback((next: AudioAsset | undefined | null, opts?: { force?: boolean }) => {
    const a = el.current;
    setCue(next ?? null);
    pending.current = next ?? null;
    if (!a) return;
    a.pause();
    if (!next?.url || (!on && !opts?.force)) return;
    load(a, next);
    // `play()` rejects when the page has had no gesture yet. That is expected, not a failure:
    // the member reads instead, and the first tap on the bar starts the voice.
    void a.play().catch(() => setPlaying(false));
  }, [on]);

  const toggle = useCallback(() => {
    const a = el.current;
    if (!a) return;
    if (!a.paused) { a.pause(); return; }
    if (!on) setOn(true);
    // First press with the voice off: the current section has never been fetched, so load it now.
    if (!a.src && pending.current) load(a, pending.current);
    void a.play().catch(() => setPlaying(false));
  }, [on, setOn]);

  const register = useCallback((has: boolean) => setAvailable((v) => v || has), []);

  const value = useMemo<Ctx>(() => ({ on, setOn, captions, setCaptions, playing, cue, play, toggle, endedAt, available, register }),
    [on, setOn, captions, setCaptions, playing, cue, play, toggle, endedAt, available, register]);
  return <NarrationCtx.Provider value={value}>{children}</NarrationCtx.Provider>;
}

export function useNarration(): Ctx {
  const c = useContext(NarrationCtx);
  // A step rendered outside a provider (a test, a storybook, the legacy viewer) must still work.
  return c ?? SILENT;
}
const SILENT: Ctx = {
  on: false, setOn: () => {}, captions: false, setCaptions: () => {}, playing: false, cue: null,
  play: () => {}, toggle: () => {}, endedAt: 0, available: false, register: () => {},
};

/**
 * Speak one cue from a step's own audio map, once, when `when` becomes true.
 *
 * Every question uses this for its feedback, which is where the FTA lessons put their best
 * teaching: a wrong answer is spoken in its own recording rather than read off the same page
 * the member just misread.
 */
export function useCue(audio: StepAudio | undefined, key: string | null, when = true) {
  const { play } = useNarration();
  const fired = useRef<string | null>(null);
  useEffect(() => {
    if (!when || !key) return;
    const cue = audio?.[key];
    if (!cue || fired.current === key) return;
    fired.current = key;
    play(cue);
  }, [audio, key, when, play]);
}

/* ────────────────────────── the bar ────────────────────────── */

function PlayGlyph({ playing }: { playing: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden focusable="false">
      {playing
        ? <><rect x="3" y="2.5" width="3" height="9" rx="1.2" fill="currentColor" /><rect x="8" y="2.5" width="3" height="9" rx="1.2" fill="currentColor" /></>
        : <path d="M4 2.6 11.4 7 4 11.4Z" fill="currentColor" />}
    </svg>
  );
}

/**
 * The voice, as a strip of chrome rather than a card — a hairline, a translucent ground and the
 * two controls that matter. It sits under the content in the same column, so it never covers a
 * section's action button the way a fixed overlay would.
 */
export function NarrationBar({ label }: { label: string }) {
  const { on, playing, cue, toggle, captions, setCaptions, available } = useNarration();
  // A long line does not fit four lines of caption. Rather than clip it mid-word with no sign,
  // the box scrolls and fades its own bottom edge — but only when there is more to read.
  const capBox = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = capBox.current;
    if (el) el.dataset.more = el.scrollHeight - el.clientHeight > 2 ? "1" : "0";
  }, [cue, captions]);
  if (!available) return null;
  const idle = !on && !playing;
  return (
    <div className="shrink-0 border-t border-line-2 bg-paper/85 backdrop-blur-[10px] px-[18px] pt-[9px] pb-[calc(9px+env(safe-area-inset-bottom))]">
      {captions && cue?.say && (
        <p ref={capBox} key={cue.url} className="fic-caption mb-[8px] max-h-[86px] overflow-y-auto overscroll-contain no-scrollbar text-[12px] font-semibold text-ink-2 leading-[1.5]">
          {cue.say}
        </p>
      )}
      <div className="flex items-center gap-[11px]">
        <button type="button" onClick={toggle} aria-pressed={playing}
          aria-label={playing ? "Pause narration" : "Play narration"}
          className={cx("fic-press w-[32px] h-[32px] shrink-0 rounded-full flex items-center justify-center",
            playing ? "bg-ink text-cream-text shadow-[0_2px_0_#1C1913]" : "bg-orange text-cream-text shadow-[0_2px_0_#C96D25]")}>
          <PlayGlyph playing={playing} />
        </button>
        <span className="flex-1 min-w-0">
          <span className="block text-[9.5px] font-black uppercase tracking-[0.5px] text-ink-4">
            {playing ? "Narrating" : idle ? "Narrated lesson" : "Paused"}
          </span>
          <span className="block truncate text-[12px] font-extrabold text-ink-2">{label}</span>
        </span>
        {/* A live level rather than a spinner: it is the only thing on the screen that has to say
            "this is speaking right now", and it costs three divs. */}
        <span aria-hidden className={cx("flex items-end gap-[2px] h-[14px]", !playing && "opacity-25")}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={cx("w-[2.5px] rounded-full bg-orange", playing ? `fic-level fic-level-${i + 1}` : "h-[4px]")} />
          ))}
        </span>
        <button type="button" onClick={() => setCaptions(!captions)} aria-pressed={captions}
          className={cx("fic-press shrink-0 rounded-[8px] border px-[8px] py-[4px] text-[10px] font-black tracking-[0.3px]",
            captions ? "border-ink bg-ink text-cream-text" : "border-line bg-card text-ink-3")}>
          CC
        </button>
      </div>
    </div>
  );
}

/**
 * The opening screen: the question the lesson answers, in the author's own words, the shape of
 * what is coming, and the choice of how to take it. `guide.intro` was authored on sixteen lessons
 * across the belt and had no renderer — this is it.
 *
 * "Play it to me" is the FTA start gate, and it does the job that gate did: it is the one user
 * gesture a browser needs before it will let a page make a sound. The opening line then plays
 * here, on this screen, and the lesson starts when it finishes — or the moment the member decides
 * they would rather get on with it, which is always available.
 */
export function LessonPrologue({ title, intro, cover, minutes, xp, cue, sections, onStart }: {
  title: string; intro?: string; cover?: { src: string; alt: string } | null;
  minutes: number; xp: number; cue?: AudioAsset; sections: { label?: string; heading: string }[];
  onStart: (withVoice: boolean) => void;
}) {
  const { setOn, play, endedAt } = useNarration();
  const [started, setStarted] = useState(false);
  const mark = useRef<number | null>(null);
  useEffect(() => {
    if (started && mark.current !== null && endedAt > mark.current) onStart(true);
  }, [endedAt, started, onStart]);

  return (
    <div className="fic-section flex-1 flex flex-col">
      <div className="text-[10.5px] font-black uppercase tracking-[0.5px] text-orange">Before you start</div>
      <h1 className="mt-[6px] text-[26px] font-black text-ink leading-[1.14] tracking-[-0.025em] text-pretty">{title}</h1>
      {cover && (
        <figure className="fic-cover mt-[13px] -mx-[18px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover.src} alt={cover.alt} width={1200} height={750} className="w-full h-[162px] object-cover" />
        </figure>
      )}
      {intro && <p className="mt-[14px] text-[15px] font-semibold text-ink-2 leading-[1.55] text-pretty">{intro}</p>}

      {/* Where am I, and what is in here? Seven headings answer both, and they cost nothing to
          author — they are the sections themselves. */}
      {!!sections.length && (
        <ol className="mt-[16px] fic-stagger">
          {sections.map((sec, i) => (
            <li key={i} className={cx("flex items-baseline gap-[10px] py-[7px]", i > 0 && "border-t border-line-2")}>
              <span className="w-[14px] shrink-0 text-[10px] font-black tabular-nums text-ink-4">{i + 1}</span>
              <span className="flex-1 text-[12.5px] font-extrabold text-ink-2 leading-[1.3]">{sec.heading}</span>
              {sec.label && <span className="text-[8.5px] font-black uppercase tracking-[0.4px] text-ink-4">{sec.label}</span>}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-auto pt-5 flex flex-col gap-[10px]">
        <div className="flex items-center gap-[7px] text-[11px] font-extrabold text-ink-4">
          <span>{minutes} min</span><span aria-hidden>·</span><span>+{xp} XP</span>
          {cue && <><span aria-hidden>·</span><span>narrated</span></>}
        </div>
        {started ? (
          <button type="button" onClick={() => onStart(true)}
            className="fic-press w-full rounded-[16px] bg-ink py-[15px] text-center text-[15.5px] font-black text-cream-text shadow-[0_3px_0_#1C1913] active:translate-y-[2px] active:shadow-none">
            Start the lesson →
          </button>
        ) : (
          <button type="button"
            onClick={() => { setOn(true); mark.current = endedAt; setStarted(true); if (cue) play(cue, { force: true }); else onStart(true); }}
            className="fic-press w-full rounded-[16px] bg-orange py-[15px] text-center text-[15.5px] font-black text-cream-text shadow-[0_3px_0_#C96D25] active:translate-y-[2px] active:shadow-none">
            Play it to me
          </button>
        )}
        <button type="button" onClick={() => { setOn(false); onStart(false); }}
          className="fic-press w-full rounded-[16px] border border-line bg-card py-[13px] text-center text-[13.5px] font-black text-ink-2">
          I&apos;ll read it myself
        </button>
      </div>
    </div>
  );
}

/** A photograph inside a section. Full-bleed to the phone's edges — a framed box would be a card. */
export function SectionMedia({ media, height = 150 }: { media: { src: string; alt: string; caption?: string }; height?: number }) {
  return (
    <figure className="fic-cover mt-3 -mx-[18px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.src} alt={media.alt} width={1200} height={750} className="w-full object-cover" style={{ height }} />
      {media.caption && <figcaption className="px-[18px] pt-[6px] text-[11px] font-bold text-ink-4">{media.caption}</figcaption>}
    </figure>
  );
}
