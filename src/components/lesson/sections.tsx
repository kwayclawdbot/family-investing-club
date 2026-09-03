"use client";
import { useCallback, useMemo, useState } from "react";
import type {
  AnatomyStep as AnatomySpec, AnnotatedValuesStep as AnnotatedSpec, BuildCandleStep as BuildSpec,
  CandlePart, CandleSpec, CompareStep as CompareSpec, FlipCardsStep as FlipSpec, ProcessStep as ProcessSpec,
  RatioExplorerStep as RatioSpec, StepComponentProps, TakeawaysStep as TakeawaysSpec,
} from "@/lib/learn/schema";
import { cx } from "@/components/ui";
import { Eyebrow, FeedbackNote, PrimaryButton } from "./engine-ui";

/**
 * The FTA University section vocabulary, rebuilt as app-native steps.
 *
 * The original lessons were 237 KB standalone HTML files — one bespoke build each, reporting
 * nothing back. These are the same teaching moves (concept · interactive · distinction · process ·
 * live example · practice · exercise · deeper insight · check · wrap up) as reusable components
 * driven by `lessons.steps`, so a lesson is content rather than code and every answer reaches
 * mastery, XP and the parent report. Skinned in FIC's warm light system, not the original's
 * black-and-gold — this lives inside the member app.
 */

/* ────────────────────────── shared candle drawing ────────────────────────── */

const UP = "#4C8A52";      // green-2
const DOWN = "#C4604A";    // red

function useScale(c: CandleSpec, h: number, pad: number) {
  return useMemo(() => {
    const hi = Math.max(c.high, c.open, c.close);
    const lo = Math.min(c.low, c.open, c.close);
    const span = hi - lo || 1;
    const y = (p: number) => pad + ((hi - p) / span) * (h - pad * 2);
    return { hi, lo, y };
  }, [c, h, pad]);
}

/**
 * One candle. `active` lifts a part; `onPart` makes every part tappable.
 *
 * `marks` labels the open and the close. It matters most in a side-by-side: a bullish and a bearish
 * candle with the same high and low are the SAME shape, and only which end is the open tells them
 * apart. Without the labels the comparison reads as "one is green, one is red", which is the
 * misunderstanding the section exists to prevent.
 */
function Candle({ c, w = 132, h = 208, active, onPart, showAxis = false, bodyWidth = 46, marks = false, animate = false }: {
  c: CandleSpec; w?: number; h?: number; active?: CandlePart | null; onPart?: (p: CandlePart) => void; showAxis?: boolean; bodyWidth?: number; marks?: boolean; animate?: boolean;
}) {
  const pad = 18;
  const { y } = useScale(c, h, pad);
  const up = c.close >= c.open;
  const col = up ? UP : DOWN;
  const cx0 = w / 2;
  const bodyTop = y(Math.max(c.open, c.close));
  const bodyBot = y(Math.min(c.open, c.close));
  const bodyH = Math.max(bodyBot - bodyTop, 3);
  const hit = (p: CandlePart, x: number, yy: number, ww: number, hh: number) => onPart ? (
    <rect key={p} x={x} y={yy} width={ww} height={Math.max(hh, 14)} fill="transparent" className="cursor-pointer"
      onClick={() => onPart(p)} role="button" aria-label={p.replace("_", " ")} />
  ) : null;
  const dot = (p: CandlePart, yy: number) => (
    <circle key={`d-${p}`} cx={cx0} cy={yy} r={active === p ? 5.5 : 3.5}
      fill={active === p ? col : "#FFFDF7"} stroke={col} strokeWidth={2} />
  );

  const grow = animate ? { transformBox: "fill-box" as const } : undefined;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      {showAxis && (
        <>
          <line x1={cx0 - bodyWidth} y1={y(c.high)} x2={cx0 + bodyWidth + 6} y2={y(c.high)} stroke="#E8DFCB" strokeWidth={1} strokeDasharray="3 3" />
          <line x1={cx0 - bodyWidth} y1={y(c.low)} x2={cx0 + bodyWidth + 6} y2={y(c.low)} stroke="#E8DFCB" strokeWidth={1} strokeDasharray="3 3" />
        </>
      )}
      {/* wicks — each grows out of the body it belongs to, not out of nothing */}
      <line x1={cx0} y1={y(c.high)} x2={cx0} y2={bodyTop} stroke={col} strokeWidth={active === "upper_wick" ? 5 : 3} strokeLinecap="round"
        className={animate ? "fic-candle-wick" : undefined} style={grow && { ...grow, transformOrigin: "bottom" }} />
      <line x1={cx0} y1={bodyBot} x2={cx0} y2={y(c.low)} stroke={col} strokeWidth={active === "lower_wick" ? 5 : 3} strokeLinecap="round"
        className={animate ? "fic-candle-wick" : undefined} style={grow && { ...grow, transformOrigin: "top" }} />
      {/* body */}
      <rect x={cx0 - bodyWidth / 2} y={bodyTop} width={bodyWidth} height={bodyH} rx={4}
        fill={col} opacity={active === "body" ? 1 : 0.92}
        stroke={active === "body" ? "#2E2A21" : col} strokeWidth={active === "body" ? 2.5 : 1}
        className={animate ? "fic-candle-body" : undefined} style={grow && { ...grow, transformOrigin: "center" }} />
      {/* price dots */}
      <g className={animate ? "fic-candle-dot" : undefined} style={grow}>
        {dot("high", y(c.high))}
        {dot("low", y(c.low))}
        {dot("open", y(c.open))}
        {dot("close", y(c.close))}
      </g>
      {marks && (
        <>
          <text x={cx0 - bodyWidth / 2 - 7} y={y(c.open) + 4} textAnchor="end" className="fill-ink-3" fontSize={11} fontWeight={800}>open</text>
          <text x={cx0 + bodyWidth / 2 + 7} y={y(c.close) + 4} textAnchor="start" className="fill-ink-3" fontSize={11} fontWeight={800}>close</text>
          <line x1={cx0 - bodyWidth / 2 - 5} y1={y(c.open)} x2={cx0 - 2} y2={y(c.open)} stroke="#8A8272" strokeWidth={1} />
          <line x1={cx0 + 2} y1={y(c.close)} x2={cx0 + bodyWidth / 2 + 5} y2={y(c.close)} stroke="#8A8272" strokeWidth={1} />
        </>
      )}
      {/* tap targets, largest last so small ones win */}
      {onPart && (
        <>
          {hit("upper_wick", cx0 - 12, y(c.high), 24, bodyTop - y(c.high))}
          {hit("lower_wick", cx0 - 12, bodyBot, 24, y(c.low) - bodyBot)}
          {hit("body", cx0 - bodyWidth / 2, bodyTop, bodyWidth, bodyH)}
          {hit("high", cx0 - 14, y(c.high) - 11, 28, 22)}
          {hit("low", cx0 - 14, y(c.low) - 11, 28, 22)}
          {hit("open", cx0 - 14, y(c.open) - 11, 28, 22)}
          {hit("close", cx0 - 14, y(c.close) - 11, 28, 22)}
        </>
      )}
    </svg>
  );
}

function SectionHead({ label, heading, intro }: { label?: string; heading: string; intro?: string }) {
  return (
    <div>
      {label && <Eyebrow tone={label === "KNOWLEDGE CHECK" || label === "EXERCISE" ? "purple" : label === "WRAP UP" ? "green" : "orange"}>{label}</Eyebrow>}
      <h1 className="mt-[6px] text-[21px] font-black text-ink leading-[1.28] text-pretty">{heading}</h1>
      {intro && <p className="mt-2 text-[14px] font-semibold text-ink-2 leading-[1.55]">{intro}</p>}
    </div>
  );
}

/** Every section ends the same way: one action, pinned to the bottom of the phone. */
function Foot({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto pt-5">{children}</div>;
}

/**
 * Where a candle stands. Deliberately NOT a card: a bordered white rectangle
 * inside the page's own rectangle is a box within a box, and it makes the
 * candle look like an illustration pasted into a slot. This is ruled ground
 * with a horizon line — the chart the candle belongs on.
 */
function Stage({ children, tall = false }: { children: React.ReactNode; tall?: boolean }) {
  return (
    <div className={cx("relative mt-2 flex items-center justify-center", tall ? "py-2" : "py-1")}>
      <div aria-hidden className="absolute inset-x-[-18px] inset-y-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0) 100%), repeating-linear-gradient(to bottom, rgba(228,218,196,0.45) 0 1px, transparent 1px 30px)",
          maskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
        }} />
      <div className="relative">{children}</div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-line-3"
        style={{ maskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)" }} />
    </div>
  );
}

/**
 * The thing the reader just tapped, explained. A rule in the candle's own
 * colour rather than a bordered panel — it reads as the same object continuing,
 * not a second card announcing itself.
 */
function Readout({ swapKey, title, body, tone = "#E4DAC4", placeholder }: {
  swapKey: string | null; title?: string; body?: string; tone?: string; placeholder: string;
}) {
  return (
    <div className="mt-4 min-h-[96px] border-l-[3px] pl-[14px]" style={{ borderColor: swapKey ? tone : "#EBDFC7" }}>
      {swapKey ? (
        <div key={swapKey} className="fic-swap">
          <div className="text-[15px] font-black text-ink leading-[1.3]">{title}</div>
          <p className="mt-[4px] text-[13.5px] font-semibold text-ink-2 leading-[1.55]">{body}</p>
        </div>
      ) : (
        <p className="text-[13px] font-bold text-ink-3 leading-[1.5]">{placeholder}</p>
      )}
    </div>
  );
}

/** A tappable pill. Tactile: it has a bottom edge, and it answers the press. */
function Pill({ on, done, children, onClick }: { on: boolean; done: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cx("fic-press rounded-full px-[13px] py-[7px] text-[11.5px] font-extrabold border",
        on ? "bg-ink text-cream-text border-ink shadow-[0_2px_0_#1C1913]"
          : done ? "bg-green-tint text-green border-green-line shadow-[0_2px_0_#D8E5CE]"
            : "bg-card text-ink-2 border-line shadow-[0_2px_0_#EFE4CF]")}>
      {children}
    </button>
  );
}

const PART_NAME: Record<CandlePart, string> = {
  open: "Open", high: "High", low: "Low", close: "Close",
  body: "Body", upper_wick: "Upper wick", lower_wick: "Lower wick",
};

/* ────────────────────────── INTERACTIVE · anatomy ────────────────────────── */

export function AnatomyStep({ spec, onResolve }: StepComponentProps<AnatomySpec>) {
  const [seen, setSeen] = useState<CandlePart[]>([]);
  const [active, setActive] = useState<CandlePart | null>(null);
  const open = useCallback((p: CandlePart) => {
    setActive(p);
    setSeen((s) => (s.includes(p) ? s : [...s, p]));
  }, []);
  const spot = spec.hotspots.find((h) => h.part === active) ?? null;
  const all = spec.hotspots.every((h) => seen.includes(h.part));

  return (
    <div className="fic-section flex-1 flex flex-col">
      <SectionHead label={spec.label} heading={spec.heading} intro={spec.caption} />
      <Stage tall><Candle c={spec.candle} w={132} h={172} active={active} onPart={open} showAxis animate /></Stage>
      <div className="mt-[14px] flex flex-wrap gap-[6px] fic-stagger">
        {spec.hotspots.map((h) => (
          <Pill key={h.part} on={active === h.part} done={seen.includes(h.part)} onClick={() => open(h.part)}>
            {seen.includes(h.part) && active !== h.part ? "✓ " : ""}{PART_NAME[h.part]}
          </Pill>
        ))}
      </div>
      <Readout swapKey={active} title={spot?.title} body={spot?.body} tone={spec.candle.close >= spec.candle.open ? UP : DOWN}
        placeholder="Tap a point on the candle — or a name below it — to find out what that part is telling you." />
      <Foot>
        <PrimaryButton onClick={() => onResolve({})} disabled={!all}>
          {all ? "Got it → Continue" : `Explore all ${spec.hotspots.length} · ${seen.length} seen`}
        </PrimaryButton>
      </Foot>
    </div>
  );
}

/* ────────────────────────── KEY DISTINCTION · compare ────────────────────────── */

export function CompareStep({ spec, onResolve }: StepComponentProps<CompareSpec>) {
  return (
    <div className="fic-section flex-1 flex flex-col">
      <SectionHead label={spec.label} heading={spec.heading} intro={spec.intro} />
      <div className="mt-3 grid grid-cols-2 gap-[10px] fic-stagger">
        {spec.columns.map((col, i) => {
          const tone = col.tone === "green" ? "border-green-line bg-green-tint shadow-[0_3px_0_#D8E5CE]"
            : col.tone === "red" ? "border-[#EDD3CB] bg-[#FBE9E4] shadow-[0_3px_0_#E8C9C1]"
              : "border-line bg-card shadow-[0_3px_0_#EFE4CF]";
          const tc = col.tone === "green" ? "text-green" : col.tone === "red" ? "text-red" : "text-ink";
          return (
            <div key={i} className={cx("rounded-[18px] border px-3 pt-3 pb-[14px] flex flex-col", tone)}>
              <div className={cx("text-[13.5px] font-black leading-[1.2]", tc)}>{col.title}</div>
              {col.candle && <div className="mt-1 flex justify-center"><Candle c={col.candle} w={140} h={132} bodyWidth={24} marks animate /></div>}
              <ul className="mt-1 flex flex-col gap-[7px]">
                {col.points.map((p, k) => (
                  <li key={k} className="text-[12px] font-bold text-ink-2 leading-[1.45] flex gap-[7px]">
                    <span className={cx("mt-[6px] w-[4px] h-[4px] rounded-full shrink-0", col.tone === "green" ? "bg-green-2" : col.tone === "red" ? "bg-red" : "bg-ink-4")} aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {spec.note && (
        <p className="mt-4 border-l-[3px] border-gold pl-[14px] text-[13px] font-bold text-ink leading-[1.55]">{spec.note}</p>
      )}
      <Foot><PrimaryButton onClick={() => onResolve({})}>Got it → Continue</PrimaryButton></Foot>
    </div>
  );
}

/* ────────────────────────── PROCESS · one move at a time ────────────────────────── */

export function ProcessStep({ spec, onResolve }: StepComponentProps<ProcessSpec>) {
  const [shown, setShown] = useState(1);
  const all = shown >= spec.moves.length;
  return (
    <div className="fic-section flex-1 flex flex-col">
      <SectionHead label={spec.label} heading={spec.heading} intro={spec.intro} />
      {/* A numbered spine rather than a stack of cards: the rule down the left is
          what makes four steps read as one sequence. */}
      <ol className="mt-4 flex flex-col">
        {spec.moves.slice(0, shown).map((m, i) => {
          const last = i === spec.moves.length - 1;
          return (
            <li key={i} className={cx("relative flex gap-[13px] pb-[15px]", i === shown - 1 && "fic-swap")}>
              {!last && <span aria-hidden className="absolute left-[13px] top-[27px] bottom-0 w-[2px] bg-line-2 rounded-full" />}
              <span className="relative w-[27px] h-[27px] shrink-0 rounded-full bg-orange text-cream-text text-[12.5px] font-black flex items-center justify-center shadow-[0_2px_0_#C96D25]">{i + 1}</span>
              <div className="pt-[2px]">
                <div className="text-[14.5px] font-black text-ink leading-[1.25]">{m.title}</div>
                <p className="mt-[3px] text-[13px] font-semibold text-ink-2 leading-[1.5]">{m.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {all && spec.closing && <p className="mt-3 text-[13.5px] font-bold text-ink-2 leading-[1.55]">{spec.closing}</p>}
      <Foot>
        <PrimaryButton onClick={() => (all ? onResolve({}) : setShown((s) => s + 1))}>
          {all ? "Got it → Continue" : `Next step (${shown} of ${spec.moves.length})`}
        </PrimaryButton>
      </Foot>
    </div>
  );
}

/* ────────────────────────── LIVE EXAMPLE · annotated values ────────────────────────── */

export function AnnotatedValuesStep({ spec, onResolve }: StepComponentProps<AnnotatedSpec>) {
  const [active, setActive] = useState<CandlePart | null>(null);
  const [seen, setSeen] = useState<CandlePart[]>([]);
  const pick = (p: CandlePart) => { setActive(p); setSeen((s) => (s.includes(p) ? s : [...s, p])); };
  const row = spec.values.find((v) => v.part === active) ?? null;
  const all = spec.values.every((v) => seen.includes(v.part));
  return (
    <div className="fic-section flex-1 flex flex-col">
      <SectionHead label={spec.label} heading={spec.heading} intro={spec.caption} />
      <div className="mt-[10px] text-[11px] font-extrabold text-ink-3 uppercase tracking-[0.4px]">{spec.subject}</div>
      <Stage>
        <div className="flex items-center gap-4">
          <Candle c={spec.candle} w={92} h={138} bodyWidth={30} active={active} animate />
          <div className="grid grid-cols-2 gap-[7px] fic-stagger">
            {spec.values.map((v) => (
              <button key={v.part} type="button" onClick={() => pick(v.part)}
                className={cx("fic-press rounded-[13px] border px-[11px] py-[8px] text-left min-w-[86px]",
                  active === v.part ? "border-ink bg-card shadow-[0_2px_0_#1C1913]"
                    : seen.includes(v.part) ? "border-green-line bg-green-tint shadow-[0_2px_0_#D8E5CE]"
                      : "border-line bg-card shadow-[0_2px_0_#EFE4CF]")}>
                <div className="text-[9.5px] font-extrabold text-ink-3 uppercase tracking-[0.4px]">{v.label}</div>
                <div className="text-[15.5px] font-black text-ink tabular-nums leading-[1.15]">{v.value}</div>
              </button>
            ))}
          </div>
        </div>
      </Stage>
      <Readout swapKey={active} title={row ? `${row.label} · ${row.value}` : undefined} body={row?.meaning}
        tone={spec.candle.close >= spec.candle.open ? UP : DOWN}
        placeholder="Tap each number to read what it actually tells you about the day." />
      <Foot>
        <PrimaryButton onClick={() => onResolve({})} disabled={!all}>
          {all ? "Got it → Continue" : `Tap all four · ${seen.length} of ${spec.values.length}`}
        </PrimaryButton>
      </Foot>
    </div>
  );
}

/* ────────────────────────── PRACTICE · flip to learn ────────────────────────── */

export function FlipCardsStep({ spec, onResolve }: StepComponentProps<FlipSpec>) {
  const [flipped, setFlipped] = useState<number[]>([]);
  const all = flipped.length >= spec.cards.length;
  return (
    <div className="fic-section flex-1 flex flex-col">
      <SectionHead label={spec.label} heading={spec.heading} intro={spec.intro} />
      <div className="mt-3 grid grid-cols-2 gap-[10px] fic-stagger">
        {spec.cards.map((card, i) => {
          const on = flipped.includes(i);
          return (
            <button key={i} type="button" aria-pressed={on} data-on={on} className="fic-flip fic-press relative h-[124px] text-left"
              onClick={() => setFlipped((f) => (f.includes(i) ? f.filter((x) => x !== i) : [...f, i]))}>
              <span className="fic-flip-inner block w-full h-full">
                <span className="fic-flip-face absolute inset-0 rounded-[16px] border border-line bg-card shadow-[0_3px_0_#EFE4CF] px-3 py-3 flex flex-col justify-between">
                  <span className="text-[14px] font-black text-ink leading-[1.25]">{card.front}</span>
                  <span className="text-[10.5px] font-extrabold text-ink-4 uppercase tracking-[0.3px]">Tap to flip</span>
                </span>
                {/* The term stays on the back too — six answers with no questions
                    is not a reference anyone can revise from. */}
                <span className="fic-flip-face fic-flip-back rounded-[16px] border border-green-line bg-green-tint shadow-[0_3px_0_#D8E5CE] px-3 py-[10px] flex flex-col gap-[5px]">
                  <span className="text-[9.5px] font-extrabold text-green uppercase tracking-[0.5px]">{card.front}</span>
                  <span className="text-[12.5px] font-bold text-ink-2 leading-[1.4]">{card.back}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <Foot>
        <PrimaryButton onClick={() => onResolve({})} disabled={!all}>
          {all ? "Got it → Continue" : `Flip all ${spec.cards.length} · ${flipped.length} done`}
        </PrimaryButton>
      </Foot>
    </div>
  );
}

/* ────────────────────────── EXERCISE · build the candle ────────────────────────── */

const LIMITS = { min: 100, max: 140 };

export function BuildCandleStep({ spec, onResolve }: StepComponentProps<BuildSpec>) {
  const tol = spec.tolerance ?? 1.5;
  const [c, setC] = useState<CandleSpec>({ open: 115, close: 125, high: 132, low: 108 });
  const [checked, setChecked] = useState<null | boolean>(null);
  const set = (k: keyof CandleSpec) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(null);
    setC((p) => ({ ...p, [k]: Number(e.target.value) }));
  };
  // A candle is only valid if the high is the highest point and the low the lowest.
  const valid = c.high >= Math.max(c.open, c.close) && c.low <= Math.min(c.open, c.close);
  const near = (a: number, b: number) => Math.abs(a - b) <= tol;
  const matches = (["open", "high", "low", "close"] as const).filter((k) => near(c[k], spec.target[k]));

  const [firstTry, setFirstTry] = useState(true);
  function check() {
    const ok = valid && matches.length === 4;
    setChecked(ok);
    // Do NOT resolve here. Getting it right is the moment the explanation lands —
    // resolving on the spot advances the section and the learner never reads it.
    if (!ok) setFirstTry(false);
  }

  return (
    <div className="fic-section flex-1 flex flex-col">
      <SectionHead label={spec.label} heading={spec.heading} intro={spec.prompt} />
      <Stage><Candle c={c} w={120} h={150} bodyWidth={42} showAxis /></Stage>
      <div className="mt-[14px] flex flex-col gap-[11px]">
        {(["high", "open", "close", "low"] as const).map((k) => {
          const hit = near(c[k], spec.target[k]);
          return (
            <label key={k} className="flex items-center gap-3">
              <span className="w-[42px] text-[11px] font-extrabold text-ink-3 uppercase tracking-[0.4px]">{k}</span>
              <input type="range" min={LIMITS.min} max={LIMITS.max} step={1} value={c[k]} onChange={set(k)}
                className="flex-1 accent-[#4C8A52]" aria-label={`${k} price`} />
              <span className={cx("w-[42px] text-right text-[13px] font-black tabular-nums rounded-[8px] py-[2px] transition-colors",
                hit ? "text-green bg-green-tint" : "text-ink")}>{c[k]}</span>
            </label>
          );
        })}
      </div>
      {!valid && <p className="mt-2 text-[12.5px] font-bold text-coral leading-[1.45]">The high has to be the highest point and the low the lowest — that is what makes it a candle.</p>}
      <Foot>
        {checked === true ? (
          <FeedbackNote kind="correct" title="That's the candle" action={<PrimaryButton onClick={() => onResolve({ correct: true, firstTry, skill: spec.skill })}>Continue</PrimaryButton>}>{spec.success}</FeedbackNote>
        ) : (
          <div className="flex flex-col gap-3">
            {checked === false && <FeedbackNote kind="wrong" title="Not there yet">{spec.hint ?? `${matches.length} of 4 prices are in place — keep moving the ones still showing dark.`}</FeedbackNote>}
            <PrimaryButton onClick={check} disabled={!valid}>Check my candle</PrimaryButton>
          </div>
        )}
      </Foot>
    </div>
  );
}

/* ────────────────────────── DEEPER INSIGHT · ratio explorer ────────────────────────── */

export function RatioExplorerStep({ spec, onResolve }: StepComponentProps<RatioSpec>) {
  const [pct, setPct] = useState(50);
  const [touched, setTouched] = useState(false);
  const band = spec.bands.find((b) => pct <= b.upTo) ?? spec.bands[spec.bands.length - 1];
  // Body share drives the drawing: 100 % is all body, 0 % is all wick.
  const candle = useMemo<CandleSpec>(() => {
    const total = 40;
    const body = (pct / 100) * total;
    const wick = (total - body) / 2;
    const mid = 120;
    return { open: mid - body / 2, close: mid + body / 2, high: mid + body / 2 + wick, low: mid - body / 2 - wick };
  }, [pct]);
  const tc = band.tone === "green" ? "text-green" : band.tone === "red" ? "text-red" : "text-ink";
  return (
    <div className="fic-section flex-1 flex flex-col">
      <SectionHead label={spec.label} heading={spec.heading} intro={spec.intro} />
      <Stage tall><Candle c={candle} w={120} h={162} bodyWidth={44} /></Stage>
      <label className="mt-[14px] flex items-center gap-3">
        <span className="text-[10.5px] font-extrabold text-ink-3 uppercase tracking-[0.4px]">All wick</span>
        <input type="range" min={4} max={100} step={1} value={pct} aria-label="Body share of the candle"
          onChange={(e) => { setPct(Number(e.target.value)); setTouched(true); }} className="flex-1 accent-[#4C8A52]" />
        <span className="text-[10.5px] font-extrabold text-ink-3 uppercase tracking-[0.4px]">All body</span>
      </label>
      <div className="mt-4 min-h-[96px] border-l-[3px] pl-[14px]" style={{ borderColor: band.tone === "green" ? UP : band.tone === "red" ? DOWN : "#E4DAC4" }}>
        <div key={band.title} className="fic-swap">
          <div className={cx("text-[15px] font-black leading-[1.3]", tc)}>{band.title}</div>
          <p className="mt-[4px] text-[13.5px] font-semibold text-ink-2 leading-[1.55]">{band.body}</p>
        </div>
      </div>
      <Foot>
        <PrimaryButton onClick={() => onResolve({})} disabled={!touched}>
          {touched ? "Got it → Continue" : "Move the slider to explore"}
        </PrimaryButton>
      </Foot>
    </div>
  );
}

/* ────────────────────────── WRAP UP · takeaways ────────────────────────── */

export function TakeawaysStep({ spec, onResolve }: StepComponentProps<TakeawaysSpec>) {
  return (
    <div className="fic-section flex-1 flex flex-col">
      <SectionHead label={spec.label} heading={spec.heading} />
      {/* Five tinted rectangles in a row is a wall. Ticks on ruled lines let the
          eye run down the list, which is what a takeaways list is for. */}
      <ul className="mt-4 flex flex-col fic-stagger">
        {spec.points.map((p, i) => (
          <li key={i} className={cx("flex gap-[11px] py-[11px]", i > 0 && "border-t border-line-2")}>
            <span className="mt-[1px] w-[19px] h-[19px] shrink-0 rounded-full bg-green-2 text-cream-text text-[10.5px] font-black flex items-center justify-center" aria-hidden>✓</span>
            <span className="text-[13.5px] font-bold text-ink leading-[1.5]">{p}</span>
          </li>
        ))}
      </ul>
      {spec.closing && <p className="mt-3 text-[13.5px] font-semibold text-ink-2 leading-[1.55]">{spec.closing}</p>}
      <Foot><PrimaryButton onClick={() => onResolve({})}>Finish the lesson</PrimaryButton></Foot>
    </div>
  );
}
