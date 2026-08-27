/** Dependency-free SVG line chart (markets + practice). */
export function LineChart({
  data,
  color = "#4C8C4A",
  height = 120,
  fill = true,
  labels,
  strokeWidth = 2.4,
  className,
}: {
  data: number[];
  color?: string;
  height?: number;
  fill?: boolean;
  labels?: string[];
  strokeWidth?: number;
  className?: string;
}) {
  const W = 330;
  const H = height;
  const pad = 6;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * W;
    const y = pad + (1 - (v - min) / span) * (H - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} ${W},${H} 0,${H}`;
  return (
    <div className={className}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
        {fill && <polygon fill={color} opacity={0.09} points={area} />}
        <polyline fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" points={line} vectorEffect="non-scaling-stroke" />
      </svg>
      {labels && labels.length > 0 && (
        <div className="flex justify-between px-[6px] pt-[2px] pb-[4px] text-[10.5px] font-bold text-ink-4">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Tiny inline sparkline for list rows. */
export function Sparkline({ data, color, width = 56, height = 22 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${((i / Math.max(1, data.length - 1)) * width).toFixed(1)},${(2 + (1 - (v - min) / span) * (height - 4)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" points={pts} />
    </svg>
  );
}
