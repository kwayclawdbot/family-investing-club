"use client";
import type { DecisionMarker } from "@/lib/types";

const MARK: Record<DecisionMarker["kind"], string> = { add: "#4C8C4A", trim: "#E58234", reject: "#C96A57", vote: "#8B7BC7", pick: "#3A8C4A" };

/** Performance hero chart: club line with soft fill, dashed benchmark overlay, decision markers. */
export function PerfChart({ club, benchmark, markers, height = 96, className }: { club: number[]; benchmark?: number[]; markers?: DecisionMarker[]; height?: number; className?: string }) {
  const W = 340, H = height, pad = 8;
  const all = benchmark ? [...club, ...benchmark] : club;
  const min = Math.min(...all), max = Math.max(...all), span = max - min || 1;
  const pt = (arr: number[]) => arr.map((v, i) => [(i / Math.max(1, arr.length - 1)) * W, pad + (1 - (v - min) / span) * (H - pad * 2)] as const);
  const cp = pt(club);
  const line = cp.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const bench = benchmark ? pt(benchmark).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ") : null;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4C8C4A" stopOpacity="0.22" />
          <stop offset="1" stopColor="#4C8C4A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#perfFill)" points={`${line} ${W},${H} 0,${H}`} />
      {bench && <polyline fill="none" stroke="#B9AE94" strokeWidth={1.4} strokeDasharray="3 4" points={bench} vectorEffect="non-scaling-stroke" />}
      <polyline fill="none" stroke="#4C8C4A" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" points={line} vectorEffect="non-scaling-stroke" />
      {markers?.map((m) => {
        const p = cp[Math.min(cp.length - 1, Math.max(0, m.idx))];
        return (
          <g key={m.label + m.idx}>
            <circle cx={p[0]} cy={p[1]} r={4.2} fill={MARK[m.kind]} stroke="#FFFDF7" strokeWidth={1.6} />
          </g>
        );
      })}
    </svg>
  );
}

export function MarkerLegend({ markers }: { markers: DecisionMarker[] }) {
  return (
    <span className="text-[8.5px] font-extrabold text-ink-3 whitespace-nowrap">
      {markers.map((m, i) => (
        <span key={m.label}>
          {i > 0 && " · "}
          <span style={{ color: MARK[m.kind] }}>●</span> {m.label}
        </span>
      ))}
    </span>
  );
}
