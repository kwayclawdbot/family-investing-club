/**
 * The belt ladder — real product config, not a fixture: 7 levels, 5 colours, no rank names.
 *
 * White · Yellow · Green · Blue · Black, one course per colour (docs/BELT-CURRICULUM.md). Purple was
 * retired 2026-09-03: it is Kai's colour everywhere else in the app, so a purple belt put the
 * assistant's identity on a member. Only the two colours moved — every threshold is unchanged, so no
 * member's level shifted.
 * The belt IS the rank. Pure and client-safe; XP comes from `xp_events` (see `lib/live/identity.ts`).
 */
import type { Belt, MemberIdentity } from "@/lib/types";

export const BELTS: Belt[] = [
  { level: 1, color: "white", label: "White Belt I", short: "White I", minXp: 0 },
  { level: 2, color: "white", label: "White Belt II", short: "White II", minXp: 150 },
  { level: 3, color: "yellow", label: "Yellow Belt I", short: "Yellow I", minXp: 400 },
  { level: 4, color: "yellow", label: "Yellow Belt II", short: "Yellow II", minXp: 800 },
  { level: 5, color: "green", label: "Green Belt", short: "Green", minXp: 1400 },
  { level: 6, color: "blue", label: "Blue Belt", short: "Blue", minXp: 2200 },
  { level: 7, color: "black", label: "Black Belt", short: "Black", minXp: 3200 },
];

export function beltFor(xp: number): Belt {
  let b = BELTS[0];
  for (const belt of BELTS) if (xp >= belt.minXp) b = belt;
  return b;
}

export function nextBelt(xp: number): Belt | null {
  const cur = beltFor(xp);
  return BELTS.find((b) => b.level === cur.level + 1) ?? null;
}

/**
 * Belt for a member id (uuid) or a display name ("Mom", "Kway (you)", "Arielle M.") against a set of
 * real identities. Nobody we can't resolve gets a belt — a wrong chip is worse than none.
 */
export function beltFromIdentities(identities: MemberIdentity[], memberIdOrName?: string | null): Belt | null {
  if (!memberIdOrName) return null;
  const key = memberIdOrName.toLowerCase().replace(/\s*\(you\)\s*/, "").trim();
  const byId = identities.find((i) => i.memberId.toLowerCase() === key);
  if (byId) return beltFor(byId.lifetimeXp);
  const first = key.split(/[\s·]/)[0];
  const byName = identities.find((i) => i.name.toLowerCase().split(/\s+/)[0] === first);
  return byName ? beltFor(byName.lifetimeXp) : null;
}

/** Summarise a set of belts: ["2× Yellow II · Yellow I", "2× White II"]. */
export function summariseBelts(belts: Belt[]): string[] {
  const counts = new Map<string, { belt: Belt; n: number }>();
  for (const b of belts) {
    const c = counts.get(b.short);
    if (c) c.n++; else counts.set(b.short, { belt: b, n: 1 });
  }
  const sorted = [...counts.values()].sort((a, b) => b.belt.level - a.belt.level);
  const label = (c: { belt: Belt; n: number }) => (c.n > 1 ? `${c.n}× ${c.belt.short}` : c.belt.short);
  const upper = sorted.filter((c) => c.belt.color !== "white").map(label).join(" · ");
  const white = sorted.filter((c) => c.belt.color === "white").map(label).join(" · ");
  return [upper, white].filter(Boolean);
}
