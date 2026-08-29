import { awardXp, bad, dbError, ok, readJson, requireSession, XP_MAX } from "@/lib/live/route-utils";

/**
 * POST /api/family/mission — complete a family mission for yourself (FTA `fic_missions` + `mission_completions`,
 * RLS: own insert). Body: { slug, evidence? }. Pays the mission's xp_reward once (kind 'bonus', ref mission:<slug>).
 */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const fam = r.session.profile?.family_id;
  if (!fam) return bad("Create your family first", 409);
  const b = await readJson<{ slug?: string; evidence?: string }>(req);
  const slug = (b.slug ?? "").trim();
  if (!slug) return bad("Which mission?");
  const { data: m, error: me } = await r.supa.from("fic_missions").select("id, slug, xp_reward").eq("slug", slug).maybeSingle();
  if (me) return dbError(me);
  if (!m) return bad("Unknown mission", 404);
  const { data: done } = await r.supa.from("mission_completions").select("id").eq("mission_id", m.id).eq("user_id", r.session.user.id).maybeSingle();
  if (done) return ok({ alreadyDone: true, xp: 0 });
  const evidence = (b.evidence ?? "").trim().slice(0, 500) || null;
  const { error } = await r.supa.from("mission_completions").insert({ mission_id: m.id, user_id: r.session.user.id, family_id: fam, evidence });
  if (error) return dbError(error);
  const xp = await awardXp(r.session.user.id, "bonus", Math.min(XP_MAX, m.xp_reward ?? 0), `mission:${m.slug}`);
  return ok({ alreadyDone: false, xp });
}
