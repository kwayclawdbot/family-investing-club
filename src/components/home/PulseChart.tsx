import type { DecisionMarker } from "@/lib/types";

const MARK: Record<DecisionMarker["kind"], string> = { pick: "#8B7BC7", vote: "#E58234", add: "#4C8C4A", trim: "#E58234", reject: "#C96A57" };

/** Hero chart with event markers (canvas v9 Home). Pure SVG, 340×110 like the artboard. */
export function PulseChart({ data, markers, height = 110 }: { data: number[]; markers: DecisionMarker[]; height?: number }) {
  const W = 340, H = height, pad = 8;
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pt = (i: number) => [(i / Math.max(1, data.length - 1)) * W, pad + (1 - (data[i] - min) / span) * (H - pad * 2)] as const;
  const pts = data.map((_, i) => pt(i));
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className="block mt-1">
      <defs>
        <linearGradient id="pulse-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C8C4A" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#4C8C4A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#pulse-fill)" points={`${line} ${W},${H} 0,${H}`} />
      <polyline fill="none" stroke="#4C8C4A" strokeWidth="2.6" strokeLinejoin="round" points={line} vectorEffect="non-scaling-stroke" />
      {markers.map((m) => {
        const i = Math.min(Math.max(0, m.idx), data.length - 1);
        const [x, y] = pt(i);
        return <circle key={m.label + m.idx} cx={x} cy={y} r="4" fill={MARK[m.kind]} />;
      })}
    </svg>
  );
}
export const markerColor = (k: DecisionMarker["kind"]) => MARK[k];
