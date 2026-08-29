import Link from "next/link";
import { fmtPeople } from "@/lib/format";

/** What the rail needs from a circle — satisfied by a live `CircleView` (lib/live/community). */
export type RingCircle = { id: string; slug?: string; name: string; emoji: string; color: string; tint: string; daysLeft: number; people: number };

/** 56px countdown ring: arc = days left / 30 (circles are 30-day rooms). */
export function CircleRing({ c, size = 56 }: { c: RingCircle; size?: number }) {
  const r = (size / 56) * 24; const circ = 2 * Math.PI * r; const on = (Math.min(c.daysLeft, 30) / 30) * circ;
  const inner = (size / 56) * 42;
  return (
    <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EBDFC7" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.color} strokeWidth={3} strokeDasharray={`${on.toFixed(1)} ${circ.toFixed(1)}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="rounded-full flex items-center justify-center" style={{ width: inner, height: inner, background: c.tint, fontSize: Math.round(size * 0.3) }} aria-hidden>{c.emoji}</span>
    </span>
  );
}

/** Horizontal circles rail. `onPropose` renders the dashed ＋ tile; an empty rail is just that tile. */
export function CirclesRail({ items, onPropose }: { items: RingCircle[]; onPropose?: React.ReactNode }) {
  return (
    <div className="flex gap-2 mt-[11px] overflow-x-auto no-scrollbar -mx-[18px] px-[18px]">
      {items.map((c) => (
        <Link key={c.id} href={`/circle/${c.slug ?? c.id}`} className="flex flex-col items-center gap-[3px] w-[66px] shrink-0" aria-label={`${c.name} circle, ${c.daysLeft} days left`}>
          <CircleRing c={c} />
          <span className="text-[9px] font-black text-ink whitespace-nowrap">{c.name}</span>
          <span className="text-[8px] font-extrabold text-orange-2 whitespace-nowrap">{c.daysLeft}d · {fmtPeople(c.people)}</span>
        </Link>
      ))}
      {onPropose}
    </div>
  );
}
