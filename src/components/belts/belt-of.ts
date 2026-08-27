import type { Belt } from "@/lib/types";
import { beltFor, identityOf } from "@/lib/data";
import { identities } from "@/lib/fixtures/belts";

/** Belt for a club member id, or by display name ("Mom", "Kway (you)", "Arielle M."). Non-members → null (no belt shown). Server-safe. */
export function beltOf(memberIdOrName?: string | null): Belt | null {
  if (!memberIdOrName) return null;
  const key = memberIdOrName.toLowerCase().replace(/\s*\(you\)\s*/, "").trim();
  const byId = identityOf(key);
  if (byId) return beltFor(byId.lifetimeXp);
  const first = key.split(/[\s·]/)[0];
  const byName = identities.find((i) => i.name.toLowerCase() === first);
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
