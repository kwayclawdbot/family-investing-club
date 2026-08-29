/**
 * Vercel Cron auth — every /api/cron/* handler is gated by CRON_SECRET, presented as
 * `Authorization: Bearer <secret>` (Vercel injects it) or `?secret=` for manual runs.
 * Refuses when CRON_SECRET is unset (fail-safe), exactly as FTA did.
 *
 * PURE and dependency-free on purpose: `scripts/platform-smoke.mjs` imports this file
 * directly (Node type-stripping) to assert accept/reject without a server. The
 * route-side wrapper lives in ./cron-guard.ts.
 */
export type CronAuthResult = { ok: true } | { ok: false; status: number; error: string };

export function cronAuthorized(
  input: { authorization: string | null | undefined; secretParam: string | null | undefined },
  secret: string | null | undefined
): CronAuthResult {
  const s = (secret ?? "").trim();
  if (!s) return { ok: false, status: 401, error: "CRON_SECRET not configured" };
  const auth = input.authorization ?? "";
  const qs = input.secretParam ?? "";
  if (auth === `Bearer ${s}` || (qs !== "" && qs === s)) return { ok: true };
  return { ok: false, status: 401, error: "unauthorized" };
}
