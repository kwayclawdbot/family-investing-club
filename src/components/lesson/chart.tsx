"use client";
import { useMemo, useState } from "react";
import type { ChartFigure, ChartMark, ChartStep as ChartSpec, StepComponentProps } from "@/lib/learn/schema";
import { cx } from "@/components/ui";
import { PrimaryButton } from "./engine-ui";
import { DOWN, Foot, Pill, Readout, SectionHead, UP } from "./sections";

/**
 * The teaching chart.
 *
 * Everything Black Belt teaches — structure, zones, sweeps, gaps, opening ranges —
 * is an OBJECT that exists across bars. A swing high is not a candle high. A zone
 * has a top and a bottom. A fair value gap is defined by three candles, not one. So
 * this draws a real captured series and lets a section name things ON it: a bar, a
 * price, a range of prices, a run of bars, a price on a particular bar.
 *
 * It is not the Trend or Trap renderer and deliberately shares no code with it.
 * A game chart is a stimulus: it pops candles in one at a time, glows the payoff,
 * pulses where price meets a level, and keeps its annotations as scenery. A class
 * chart is a diagram someone is being walked through, so:
 *
 *   · the annotations are the interface — each one is tappable and explains itself;
 *   · nothing loops, glows, pops or scores, and no candle animates in;
 *   · the frame never rescales, so the shape a member is reading stays the shape
 *     the words describe, before and after a drill's reveal;
 *   · prices are on the axis in numbers, because the lesson quotes those numbers;
 *   · the ticker and the session are stamped on the chart, always.
 *
 * On the price domain, which is the one problem the games code had already met and
 * solved its own way: scaling naively to a full series crushes the setup whenever
 * the resolution move is large. The game fixes that at draw time by expanding the
 * domain around the setup and letting the resolution run out of frame. A class
 * cannot hide price action, so the fix moved to authoring instead: the frame here
 * is simply everything — every bar, every mark, the whole time — and
 * `validateChartFigure` REFUSES a figure whose marked object would occupy less
 * than a fifth of that frame. The author trims the bar window; the reader gets a
 * chart that never lies about scale and never moves under them.
 */

const W = 366;            // the lesson column at 402px, less its 18px gutters
const PAD_L = 4;
const AXIS_W = 46;        // right-hand price gutter
const PAD_T = 16;

type ToneKey = NonNullable<ChartMark["tone"]>;
const TONE: Record<ToneKey, { line: string; fill: string; chip: string; ink: string }> = {
  up: { line: UP, fill: "rgba(76,138,82,0.15)", chip: UP, ink: "#FFFCF5" },
  down: { line: DOWN, fill: "rgba(196,96,74,0.14)", chip: DOWN, ink: "#FFFCF5" },
  level: { line: "#2E2A21", fill: "rgba(46,42,33,0.08)", chip: "#2E2A21", ink: "#FFFCF5" },
  zone: { line: "#C96D25", fill: "rgba(229,130,52,0.16)", chip: "#E58234", ink: "#FFFCF5" },
  note: { line: "#8F8672", fill: "rgba(143,134,114,0.10)", chip: "#EFE7D6", ink: "#4A4436" },
};
const toneOf = (m: ChartMark) => TONE[m.tone ?? "note"];

const money = (n: number) => n.toFixed(2);

/* Label layout works in boxes: chips, candle bodies and wicks are all rectangles on the glass. */
type Box = { x0: number; x1: number; y0: number; y1: number };
type Spot = { x: number; y: number };
/** A placed chip: where it sits, how wide it is, what it points at, and whether it needs a leader. */
type ChipSpot = { x: number; y: number; w: number; ax: number; ay: number; lead: boolean };
const hits = (a: Box, b: Box, pad = 0) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;

/**
 * The last bar a mark READS OFF — which is what decides whether it can be shown before a drill's
 * reveal. A band's `to` is only how far a drawn zone was extended to the right, so it is the
 * `from` that matters; everything else is the bar it names.
 */
function readsOffBar(m: ChartMark): number {
  const a = m.anchor;
  return a.at === "bar" ? a.index : a.at === "span" ? a.to : a.at === "point" ? a.index : a.at === "band" ? (a.from ?? -1) : -1;
}

/* ────────────────────────── the drawing ────────────────────────── */

export function TeachingChart({ figure, height = 218, activeId = null, onPick, revealed = true }: {
  figure: ChartFigure;
  height?: number;
  activeId?: string | null;
  onPick?: (id: string) => void;
  /** Drills: false draws only the setup half of the series and holds the reveal marks back. */
  revealed?: boolean;
}) {
  const { bars, marks } = figure;
  const split = figure.revealFrom ?? bars.length;
  const shown = revealed ? bars.length : Math.min(split, bars.length);
  const visible = useMemo(
    () => marks.filter((m) => (revealed ? true : m.phase !== "reveal" && readsOffBar(m) < split)),
    [marks, revealed, split],
  );

  // Marks are drawn active-first, everywhere: the chip the reader just asked for must never be
  // the one that gets dropped for space.
  const order = useMemo(() => [...visible.filter((m) => m.id === activeId), ...visible.filter((m) => m.id !== activeId)], [visible, activeId]);
  const spans = order.filter((m) => m.anchor.at === "span");

  // A span is a run of TIME, so it gets its own lane under the price, on the time axis. That is
  // both where it belongs and the one place it can never land on top of a candle or a level.
  const laneOf = new Map(spans.map((m, i) => [m.id, i]));
  const padB = 22 + spans.length * 13;
  const plotL = PAD_L;
  const plotR = W - AXIS_W;
  const plotW = plotR - plotL;
  const n = bars.length;
  const slot = plotW / n;
  const bodyW = Math.max(3, Math.min(16, slot * 0.62));
  const xFor = (i: number) => plotL + i * slot + slot / 2;
  const baseline = height - padB;

  // The frame is the whole thing, always — every bar and every mark, whether it is drawn yet or
  // not. A chart that rescales when the resolution lands teaches the wrong lesson twice: the setup
  // looked one shape during the call and another afterwards.
  const { yFor, lo, hi } = useMemo(() => {
    let min = Infinity, max = -Infinity;
    const see = (v: number) => { if (v < min) min = v; if (v > max) max = v; };
    for (const b of bars) { see(b.l); see(b.h); }
    for (const m of marks) {
      const a = m.anchor;
      if (a.at === "price") see(a.price);
      else if (a.at === "band") { see(a.top); see(a.bottom); }
      else if (a.at === "point") see(a.price);
    }
    if (figure.focus) { see(figure.focus.top); see(figure.focus.bottom); }
    if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 1; }
    const pad = (max - min || 1) * 0.07;
    min -= pad; max += pad;
    const plotH = baseline - PAD_T;
    return { lo: min, hi: max, yFor: (p: number) => PAD_T + (1 - (p - min) / (max - min)) * plotH };
  }, [bars, marks, figure.focus, baseline]);

  /* ── where the labels go ──
   *
   * A chip is the only part of this chart that has no natural place: everything else is
   * drawn where its price and its bar put it. The first pass gave each chip exactly one
   * offset from its anchor, checked it against the chips already down, and dropped it if
   * it clashed. That failed twice over at 402px — a chip landing on the candle it names
   * hides the shape the sentence is about, and a dropped chip leaves an object on the
   * chart with nothing naming it.
   *
   * So: every chip gets a ladder of candidate spots, each one is costed against what is
   * already on the glass, and the cheapest always wins. A label is never dropped, never
   * covers another label, and only covers a candle when the frame genuinely has nowhere
   * else to put it. When the winner ends up away from what it names, a leader line runs
   * back to it, so the chip can go and find empty space without losing its referent.
   */
  const CH = 17;
  const chipW = (t: string) => 12 + t.length * 6.1;

  // The candles, as boxes. Wick and body separately — a chip may sit beside a thin wick
  // in space a full-slot box would have called occupied.
  const candles = useMemo(() => {
    const out: Box[] = [];
    for (let i = 0; i < shown; i++) {
      const b = bars[i], x = xFor(i);
      const wick = Math.max(1.2, bodyW * 0.16);
      out.push({ x0: x - wick / 2 - 1.5, x1: x + wick / 2 + 1.5, y0: yFor(b.h) - 1, y1: yFor(b.l) + 1 });
      const top = yFor(Math.max(b.o, b.c));
      out.push({ x0: x - bodyW / 2 - 1.5, x1: x + bodyW / 2 + 1.5, y0: top - 1, y1: Math.max(yFor(Math.min(b.o, b.c)), top + 1.6) + 1 });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bars, shown, bodyW, yFor, slot, plotL]);

  // Every level and band edge is a rule running the width of the plot. Text sitting on one
  // reads as struck through, so it costs — but less than covering price.
  const rules = order.flatMap((m) => {
    const a = m.anchor;
    if (a.at === "price") return [yFor(a.price)];
    if (a.at === "band") return [yFor(a.top), yFor(a.bottom)];
    return [];
  });

  const chip = (() => {
    const placed: Box[] = [];
    const out = new Map<string, ChipSpot>();
    // the reveal divider writes its own label along the top, so chips keep clear of that band
    const yMin = figure.revealFrom != null ? 15 : 1;
    const yMax = baseline - CH - 1;
    const clampX = (x: number, w: number) => Math.max(plotL + 1, Math.min(plotR - w - 1, x));
    const clampY = (y: number) => Math.max(yMin, Math.min(yMax, y));

    /** A row of spots across the whole plot at one height, nearest the preferred x first. */
    const sweep = (y: number, prefX: number): Spot[] => {
      const xs: number[] = [];
      for (let i = 0; i <= 8; i++) xs.push(plotL + 10 + ((plotW - 20) * i) / 8);
      return xs.sort((a, b) => Math.abs(a - prefX) - Math.abs(b - prefX)).map((x) => ({ x, y }));
    };

    const put = (m: ChartMark, ax: number, ay: number, cands: Spot[], leader: boolean) => {
      const w = chipW(m.chip);
      let best = { x: clampX(cands[0].x - w / 2, w), y: clampY(cands[0].y), cost: Infinity };
      for (let k = 0; k < cands.length; k++) {
        const x = clampX(cands[k].x - w / 2, w), y = clampY(cands[k].y);
        const box: Box = { x0: x, x1: x + w, y0: y, y1: y + CH };
        let cost = k * 2;                                                        // how far from first choice
        for (const p of placed) if (hits(box, p, 3)) { cost += 500; break; }     // another label: never
        for (const c of candles) if (hits(box, c, 1)) { cost += 90; break; }     // the price itself: almost never
        for (const r of rules) if (r > y - 1 && r < y + CH + 1) { cost += 14; break; }
        if (cost < best.cost) best = { x, y, cost };
        if (cost === k * 2) break;                                               // clean, and the best rank still open
      }
      placed.push({ x0: best.x, x1: best.x + w, y0: best.y, y1: best.y + CH });
      const far = Math.abs(best.x + w / 2 - ax) > w / 2 + 10 || Math.abs(best.y + CH / 2 - ay) > CH + 12;
      out.set(m.id, { x: best.x, y: best.y, w, ax, ay, lead: leader && far });
    };

    for (const m of order) {
      const a = m.anchor;
      // A span already owns a lane of its own under the price; nothing can land on it there.
      if (a.at === "span") {
        const lane = laneOf.get(m.id) ?? 0, w = chipW(m.chip);
        out.set(m.id, {
          x: Math.max(plotL, Math.min(plotR - w, (xFor(a.from) + xFor(a.to)) / 2 - w / 2)),
          y: baseline + 3 + lane * 13, w, ax: 0, ay: 0, lead: false,
        });
        continue;
      }
      if (a.at === "band") {
        const yT = yFor(a.top), yB = yFor(a.bottom);
        const prefX = (a.from != null ? xFor(a.from) : plotL) + 34;
        put(m, prefX, yT, [
          ...sweep(yT - CH - 3, prefX),
          ...(yB - yT > CH + 10 ? sweep((yT + yB - CH) / 2, prefX) : []),
          ...sweep(yB + 4, prefX),
          ...sweep(yT - CH - 20, prefX),
          ...sweep(yB + 21, prefX),
        ], false);
      } else if (a.at === "price") {
        const y = yFor(a.price);
        put(m, plotL, y, [...sweep(y - CH - 3, plotL), ...sweep(y + 4, plotL), ...sweep(y - CH - 20, plotL), ...sweep(y + 21, plotL)], false);
      } else if (a.at === "bar") {
        const b = bars[a.index], x = xFor(a.index), yH = yFor(b.h), yL = yFor(b.l);
        put(m, x, yH, [
          { x, y: yH - CH - 6 }, { x, y: yH - CH - 22 }, { x, y: yL + 6 }, { x, y: yL + 22 },
          { x: x - slot * 1.7, y: yH - CH - 6 }, { x: x + slot * 1.7, y: yH - CH - 6 },
          { x: x - slot * 1.7, y: yL + 6 }, { x: x + slot * 1.7, y: yL + 6 },
          ...sweep(yMin, x), ...sweep(yMax, x),
        ], true);
      } else if (a.at === "point") {
        const b = bars[a.index], x = xFor(a.index), y = yFor(a.price);
        const up = a.price >= (b.h + b.l) / 2;
        const near: Spot[] = up
          ? [{ x, y: y - CH - 10 }, { x, y: y - CH - 26 }, { x: x - slot * 1.8, y: y - CH - 10 }, { x: x + slot * 1.8, y: y - CH - 10 }]
          : [{ x, y: y + 10 }, { x, y: y + 26 }, { x: x - slot * 1.8, y: y + 10 }, { x: x + slot * 1.8, y: y + 10 }];
        put(m, x, y, [
          ...near,
          { x: x - slot * 2.5, y: y - CH / 2 }, { x: x + slot * 2.5, y: y - CH / 2 },
          ...sweep(up ? yMin : yMax, x), ...sweep(up ? yMin + 21 : yMax - 21, x),
        ], true);
      }
    }
    return out;
  })();

  /* ── the price gutter: a mark's own price always wins a slot; gridlines fill what is left ── */
  const axis = (() => {
    const taken: number[] = [];
    const rows: { y: number; text: string; colour: string; bold: boolean }[] = [];
    const claim = (p: number, colour: string, bold: boolean) => {
      const y = yFor(p);
      if (y < PAD_T - 6 || y > baseline + 4) return;
      for (const t of taken) if (Math.abs(t - y) < 12.5) return;
      taken.push(y);
      rows.push({ y, text: money(p), colour, bold });
    };
    for (const m of order) {
      const a = m.anchor;
      const c = toneOf(m).line;
      if (a.at === "band") { claim(a.top, c, true); claim(a.bottom, c, true); }
      else if (a.at === "price") claim(a.price, c, true);
    }
    for (let i = 0; i < 4; i++) claim(lo + ((hi - lo) * (i + 0.5)) / 4, "#A89F8D", false);
    return rows;
  })();

  function Chip({ id, t, on }: { id: string; t: ToneKey; on: boolean }) {
    const spot = chip.get(id);
    if (!spot) return null;
    const m = order.find((x) => x.id === id)!;
    const c = TONE[t];
    const { x, y, w } = spot;
    // The leader runs from the point the label names to the nearest edge of the label, so a chip
    // that had to go and find empty space still reads as belonging to that swing or that candle.
    const lx = Math.max(x, Math.min(x + w, spot.ax));
    const ly = spot.ay < y ? y : spot.ay > y + CH ? y + CH : spot.ay;
    return (
      <g opacity={on ? 1 : 0.62}>
        {spot.lead && (
          <line x1={spot.ax} y1={spot.ay} x2={lx} y2={ly} stroke={c.line} strokeWidth={on ? 1.5 : 1}
            strokeDasharray="2.5 2.5" strokeLinecap="round" opacity={0.85} />
        )}
        {/* a cream keyline, so a chip that had to sit near price still separates from it */}
        <rect x={x} y={y} width={w} height={CH} rx={5} fill={c.chip} stroke="#FFFDF7" strokeWidth={1.6} />
        <text x={x + w / 2} y={y + 12} textAnchor="middle" fill={c.ink} fontSize={10.5} fontWeight={800}>{m.chip}</text>
      </g>
    );
  }

  const plotH = baseline - PAD_T;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img"
      aria-label={`${figure.ticker} ${figure.session} — ${visible.length} marked points`} className="block overflow-visible">
      {/* ruled ground */}
      {axis.filter((r) => !r.bold).map((r, i) => (
        <line key={`g-${i}`} x1={plotL} x2={plotR} y1={r.y} y2={r.y} stroke="#EDE4D0" strokeWidth={1} />
      ))}
      <line x1={plotL} x2={plotR} y1={baseline} y2={baseline} stroke="#E4DAC4" strokeWidth={1.5} />
      <line x1={plotR} x2={plotR} y1={PAD_T - 8} y2={baseline} stroke="#EDE4D0" strokeWidth={1} />

      {/* bands, levels and single-bar callouts sit UNDER the price */}
      {order.map((m) => {
        const on = m.id === activeId;
        const c = toneOf(m);
        const a = m.anchor;
        const tap = onPick ? { onClick: () => onPick(m.id), className: "cursor-pointer" } : {};
        if (a.at === "band") {
          const yT = yFor(a.top), yB = yFor(a.bottom);
          const x0 = a.from != null ? xFor(a.from) - slot / 2 : plotL;
          const x1 = a.to != null ? xFor(a.to) + slot / 2 : plotR;
          // A band that fills most of the frame would wash the candles out; tint it back.
          const tall = (yB - yT) / plotH > 0.4;
          return (
            <g key={m.id} {...tap}>
              <rect x={x0} y={yT} width={Math.max(x1 - x0, 2)} height={Math.max(yB - yT, 2)} fill={c.fill} opacity={(on ? 1 : 0.6) * (tall ? 0.45 : 1)} />
              <line x1={x0} x2={x1} y1={yT} y2={yT} stroke={c.line} strokeWidth={on ? 2.2 : 1.4} opacity={on ? 1 : 0.55} />
              <line x1={x0} x2={x1} y1={yB} y2={yB} stroke={c.line} strokeWidth={on ? 2.2 : 1.4} opacity={on ? 1 : 0.55} />
            </g>
          );
        }
        if (a.at === "price") {
          const y = yFor(a.price);
          return (
            <g key={m.id} {...tap}>
              <line x1={plotL} x2={plotR} y1={y} y2={y} stroke={c.line} strokeWidth={on ? 2.4 : 1.5}
                strokeDasharray={on ? undefined : "5 4"} opacity={on ? 1 : 0.5} />
            </g>
          );
        }
        if (a.at === "bar") {
          return (
            <g key={m.id} {...tap}>
              <rect x={xFor(a.index) - slot / 2} y={PAD_T - 6} width={slot} height={baseline - PAD_T + 6} fill={c.fill} opacity={on ? 1 : 0.5} />
            </g>
          );
        }
        return null;
      })}

      {/* the price itself */}
      {bars.slice(0, shown).map((b, i) => {
        const up = b.c >= b.o;
        const col = up ? UP : DOWN;
        const x = xFor(i);
        const top = yFor(Math.max(b.o, b.c));
        const bot = yFor(Math.min(b.o, b.c));
        return (
          <g key={`b-${i}`}>
            <line x1={x} x2={x} y1={yFor(b.h)} y2={yFor(b.l)} stroke={col} strokeWidth={Math.max(1.2, bodyW * 0.16)} strokeLinecap="round" />
            <rect x={x - bodyW / 2} y={top} width={bodyW} height={Math.max(bot - top, 1.6)} rx={1.5} fill={col} stroke={col} strokeWidth={0.8} />
          </g>
        );
      })}

      {/* where the call was taken, and what came after it */}
      {figure.revealFrom != null && (
        <>
          <line x1={xFor(split) - slot / 2} x2={xFor(split) - slot / 2} y1={PAD_T - 8} y2={baseline}
            stroke="#C96D25" strokeWidth={1.4} strokeDasharray="4 4" opacity={0.75} />
          <text x={xFor(split) - slot / 2 - 4} y={PAD_T - 1} textAnchor="end" fill="#C96D25" fontSize={9} fontWeight={900}>
            {revealed ? "your call" : "you are here"}
          </text>
          {revealed && (
            <text x={Math.min(xFor(split) + 4, plotR - 56)} y={PAD_T - 1} fill="#8F8672" fontSize={9} fontWeight={900}>what happened</text>
          )}
        </>
      )}

      {/* swings sit OVER the price — they are readings of it */}
      {order.map((m) => {
        const a = m.anchor;
        if (a.at !== "point") return null;
        const on = m.id === activeId;
        const c = toneOf(m);
        return (
          <circle key={m.id} cx={xFor(a.index)} cy={yFor(a.price)} r={on ? 5.5 : 4} fill="#FFFDF7"
            stroke={c.line} strokeWidth={on ? 2.6 : 1.8} opacity={on ? 1 : 0.8}
            onClick={onPick ? () => onPick(m.id) : undefined} className={onPick ? "cursor-pointer" : undefined} />
        );
      })}

      {/* spans, in their own lanes on the time axis */}
      {spans.map((m) => {
        const a = m.anchor;
        if (a.at !== "span") return null;
        const on = m.id === activeId;
        const c = toneOf(m);
        const lane = laneOf.get(m.id) ?? 0;
        const y = baseline + 5 + lane * 13;
        const x0 = xFor(a.from) - slot * 0.4;
        const x1 = xFor(a.to) + slot * 0.4;
        return (
          <g key={m.id} opacity={on ? 1 : 0.6} onClick={onPick ? () => onPick(m.id) : undefined} className={onPick ? "cursor-pointer" : undefined}>
            <path d={`M ${x0} ${y + 4} L ${x0} ${y} L ${x1} ${y} L ${x1} ${y + 4}`} fill="none" stroke={c.line}
              strokeWidth={on ? 2.2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}

      {/* every chip, last, so nothing is drawn over a label */}
      {order.map((m) => <Chip key={`c-${m.id}`} id={m.id} t={m.tone ?? "note"} on={m.id === activeId} />)}

      {/* the price gutter */}
      {axis.map((r, i) => (
        <text key={`a-${i}`} x={plotR + 5} y={r.y + 3.5} fill={r.colour} fontSize={9.5} fontWeight={r.bold ? 900 : 800} className="tabular-nums">{r.text}</text>
      ))}

      {/* time */}
      <text x={plotL + 1} y={height - 4} fill="#A89F8D" fontSize={9.5} fontWeight={800}>{bars[0]?.t}</text>
      <text x={plotR - 1} y={height - 4} textAnchor="end" fill="#A89F8D" fontSize={9.5} fontWeight={800}>{bars[Math.max(0, shown - 1)]?.t}</text>
    </svg>
  );
}

/** Ticker and session, stamped on the chart. A member must always know what they are reading. */
export function ChartStamp({ figure }: { figure: ChartFigure }) {
  return (
    <div className="flex items-center gap-[7px]">
      <span className="inline-flex items-center justify-center rounded-[7px] bg-ink px-[7px] h-[19px] text-[10px] font-black text-cream-text tracking-[0.3px]">
        {figure.ticker}
      </span>
      <span className="text-[11px] font-extrabold text-ink-3 tracking-[0.2px]">{figure.session}</span>
    </div>
  );
}

/**
 * Where the chart stands. Same language as `Stage` — ruled ground, edges dissolved,
 * a horizon under it — but full width, because a series is not an object on a plinth.
 */
export function ChartGround({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mt-[10px]">
      <div aria-hidden className="absolute inset-x-[-18px] inset-y-[-6px] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.45) 70%, rgba(255,255,255,0) 100%)",
          maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
        }} />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ────────────────────────── ON THE CHART · step through the objects ────────────────────────── */

export function ChartStep({ spec, onResolve }: StepComponentProps<ChartSpec>) {
  const [active, setActive] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const pick = (id: string) => { setActive(id); setSeen((s) => (s.includes(id) ? s : [...s, id])); };
  const mark = spec.figure.marks.find((m) => m.id === active) ?? null;
  const all = spec.figure.marks.every((m) => seen.includes(m.id));

  return (
    <div className="fic-section flex-1 flex flex-col">
      <SectionHead label={spec.label} heading={spec.heading} intro={spec.intro} />
      <div className="mt-[10px]"><ChartStamp figure={spec.figure} /></div>
      <ChartGround>
        <TeachingChart figure={spec.figure} activeId={active} onPick={pick} height={226} />
      </ChartGround>
      <div className="mt-[12px] flex flex-wrap gap-[6px] fic-stagger">
        {spec.figure.marks.map((m) => (
          <Pill key={m.id} on={active === m.id} done={seen.includes(m.id)} onClick={() => pick(m.id)}>
            {seen.includes(m.id) && active !== m.id ? "✓ " : ""}{m.name}
          </Pill>
        ))}
      </div>
      <Readout swapKey={active} title={mark?.title} body={mark?.body}
        tone={mark ? toneOf(mark).line : "#E4DAC4"} placeholder={spec.prompt} />
      <Foot>
        <PrimaryButton onClick={() => onResolve({})} disabled={!all}>
          {all ? (spec.done ?? "Got it → Continue") : `Read all ${spec.figure.marks.length} · ${seen.length} so far`}
        </PrimaryButton>
      </Foot>
    </div>
  );
}

/** The drill's chart: evidence, not a toy. Marks are labelled, not tappable — the call is the interaction. */
export function DrillChart({ figure, revealed }: { figure: ChartFigure; revealed: boolean }) {
  return (
    <div className={cx("mt-3")}>
      <ChartStamp figure={figure} />
      <ChartGround>
        <TeachingChart figure={figure} height={186} revealed={revealed} />
      </ChartGround>
    </div>
  );
}
