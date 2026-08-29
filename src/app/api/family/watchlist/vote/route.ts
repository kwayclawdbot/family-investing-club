import { awardXp, bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";
import { VOTE_XP, todayIso, voteRef } from "@/lib/live/family";

/**
 * "Which company should we learn about tonight?" — one vote per member per night on FTA
 * `family_watchlist_votes` (unique family/user/night → changing your mind is an update).
 * RLS enforces the household guardrails (`family_writes_allowed`): downtime / daily limit refuse the write.
 *   POST   { ticker }  → first vote of the night pays VOTE_XP once (xp_events kind 'community', ref family_vote:<night>)
 *   DELETE            → clear tonight's vote
 */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const fam = r.session.profile?.family_id;
  if (!fam) return bad("Create your family first", 409);
  const b = await readJson<{ ticker?: string }>(req);
  const ticker = (b.ticker ?? "").trim().toUpperCase();
  if (!ticker) return bad("Pick a company");
  const { data: entry } = await r.supa.from("family_watchlist").select("ticker, company_name").eq("family_id", fam).eq("ticker", ticker).maybeSingle();
  if (!entry) return bad("That company isn't on the family list yet", 404);
  const night = todayIso();
  const { error } = await r.supa.from("family_watchlist_votes").upsert({ family_id: fam, user_id: r.session.user.id, ticker, company_name: entry.company_name, vote_night: night }, { onConflict: "family_id,user_id,vote_night" });
  if (error) {
    if (/row-level security/i.test(error.message ?? "")) return bad("A guardrail on this account is active right now (downtime, or the daily limit). Voting reopens when it lifts.", 403);
    return dbError(error);
  }
  const ref = voteRef(night);
  const { count } = await r.supa.from("xp_events").select("id", { count: "exact", head: true }).eq("user_id", r.session.user.id).eq("ref_id", ref);
  const xp = count ? 0 : await awardXp(r.session.user.id, "community", VOTE_XP, ref);
  return ok({ night, ticker, xp });
}

export async function DELETE() {
  const r = await requireSession(); if (r.error) return r.error;
  const fam = r.session.profile?.family_id;
  if (!fam) return bad("Create your family first", 409);
  const { error } = await r.supa.from("family_watchlist_votes").delete().eq("family_id", fam).eq("user_id", r.session.user.id).eq("vote_night", todayIso());
  if (error) return dbError(error);
  return ok();
}
