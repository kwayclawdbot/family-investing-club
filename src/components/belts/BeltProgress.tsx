import Link from "next/link";
import type { Belt } from "@/lib/types";

const BAR: Record<Belt["color"], string> = { white: "#C9BC9E", yellow: "#E9C46A", green: "#4C8A52", blue: "#4E7DA6", black: "#2E2A21" };
const TEXT: Record<Belt["color"], string> = { white: "#6E6654", yellow: "#8A6A10", green: "#2C5A31", blue: "#4E7DA6", black: "#2E2A21" };

/** "Progress to Blue Belt · 420 XP to go" card — belt colours are identity, so the bar blends current → next belt. */
export function BeltProgress({ xp, belt, next, href }: { xp: number; belt: Belt; next: Belt | null; href?: string }) {
  const span = next ? next.minXp - belt.minXp : 1;
  const pct = next ? Math.min(100, Math.round(((xp - belt.minXp) / span) * 100)) : 100;
  const body = (
    <div className="mt-3 bg-card border border-line rounded-[14px] px-[15px] py-3">
      <div className="flex justify-between text-[11.5px] font-extrabold text-ink-3">
        <span>
          {next ? (<>Progress to <b style={{ color: TEXT[next.color] }}>{next.label}</b></>) : <b style={{ color: TEXT.black }}>Black Belt — apex</b>}
        </span>
        <span>{next ? `${(next.minXp - xp).toLocaleString()} XP to go` : "no extra titles"}</span>
      </div>
      <div className="h-[9px] rounded-[5px] bg-line-2 mt-[7px] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-[5px]" style={{ width: `${pct}%`, background: next ? `linear-gradient(90deg, ${BAR[belt.color]}, ${BAR[next.color]})` : BAR[belt.color] }} />
      </div>
      <div className="mt-[5px] text-[10px] font-bold text-ink-4">
        {xp.toLocaleString()} / {(next ?? belt).minXp.toLocaleString()} lifetime XP · belts measure progression, never returns
      </div>
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}
