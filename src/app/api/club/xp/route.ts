import { awardXp, bad, ok, readJson, requireSession, xpFor, XP_MAX } from "@/lib/live/route-utils";
/** Whitelisted, capped XP awards for learning/practice/family activity (never for trades, size or risk). */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { kind, amount, refId } = await readJson<{ kind?: string; amount?: number; refId?: string }>(req);
  const allowed = xpFor(kind ?? "");
  if (allowed === null) return bad("Unknown XP kind");
  const amt = Math.min(XP_MAX, allowed, Math.max(0, Math.round(Number(amount ?? allowed))));
  const xp = await awardXp(r.session.user.id, kind!, amt, refId);
  return ok({ xp });
}
