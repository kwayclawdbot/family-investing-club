import { awardXp, bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";
import { FAMILY_NIGHT_XP, nightRef } from "@/lib/live/family";

const NIGHT = /^\d{4}-\d{2}-\d{2}$/;

/**
 * POST /api/family/night — record a Family Investing Night and pay attendance XP.
 * Body: { night: YYYY-MM-DD, attendeeIds: string[], ticker?, companyName? }
 *
 * One parent records XP for OTHER members, which the own-row xp_events policy can't allow from the
 * browser — so this runs here: the caller must be a parent/admin (from the DB, never the body) and every
 * attendee must share their family_id. `awardXp` inserts as the user and falls back to the service role
 * for other members. Dedupe = ref_id `family_night:<date>` (ledger of record is xp_events, kind 'community');
 * `family_night_sessions` is the transcript (RLS: parents of the household).
 */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const p = r.session.profile;
  if (!p?.family_id) return bad("Create your family first", 409);
  if (p.role !== "parent" && p.role !== "admin") return bad("Only a parent can record family night", 403);
  const b = await readJson<{ night?: string; attendeeIds?: string[]; ticker?: string; companyName?: string }>(req);
  const night = (b.night ?? "").trim();
  if (!NIGHT.test(night)) return bad("A night date is required");
  const ids = [...new Set((b.attendeeIds ?? []).filter((x) => typeof x === "string" && x))];
  if (!ids.length) return bad("Nobody was marked present, so there's nothing to record");

  const { data: roster, error: re } = await r.supa.from("profiles").select("id, family_id").in("id", ids);
  if (re) return dbError(re);
  const inFamily = new Set((roster ?? []).filter((x) => x.family_id === p.family_id).map((x) => x.id));
  if (inFamily.size !== ids.length) return bad("Somebody on that list isn't in this family", 403);

  const ref = nightRef(night);
  const { data: paid } = await r.supa.from("xp_events").select("user_id").in("user_id", ids).eq("ref_id", ref);
  const already = new Set((paid ?? []).map((x) => x.user_id));
  const results: { id: string; awarded: boolean; alreadyAwarded: boolean; xp: number }[] = [];
  for (const id of ids) {
    if (already.has(id)) { results.push({ id, awarded: false, alreadyAwarded: true, xp: 0 }); continue; }
    const xp = await awardXp(id, "community", FAMILY_NIGHT_XP, ref);
    results.push({ id, awarded: xp > 0, alreadyAwarded: false, xp });
  }

  const { error: te } = await r.supa.from("family_night_sessions").upsert(
    { family_id: p.family_id, night, ticker: (b.ticker ?? "").trim().toUpperCase() || null, company_name: (b.companyName ?? "").trim() || null, host_id: r.session.user.id, attendee_ids: ids },
    { onConflict: "family_id,night" },
  );
  return ok({ night, xpPerAttendee: FAMILY_NIGHT_XP, results, transcript: !te, transcriptError: te?.message ?? null });
}
