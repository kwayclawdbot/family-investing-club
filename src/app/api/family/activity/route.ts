import { dbError, ok, requireSession } from "@/lib/live/route-utils";

/**
 * POST /api/family/activity — credit a minute of "time in app" for the signed-in child
 * (FTA `family_activity_ping`: one minute per 50s of wall clock, writes family_activity_days).
 * Returns { minutes, limit, locked } so the kid shell can say when a guardrail is resting the account.
 */
export async function POST() {
  const r = await requireSession(); if (r.error) return r.error;
  const { data, error } = await r.supa.rpc("family_activity_ping");
  if (error) return dbError(error);
  const d = (data ?? {}) as { minutes?: number; limit?: number | null; locked?: boolean };
  return ok({ minutes: d.minutes ?? 0, limit: d.limit ?? null, locked: !!d.locked });
}
