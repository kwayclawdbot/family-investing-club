import { awardXp, bad, dbError, ok, readJson, requireClub, xpFor } from "@/lib/live/route-utils";
import { adminClient } from "@/lib/live/supa";
import { voteRefusal } from "@/lib/live/club";

/** Cast a vote. `vote_gated` (mini-lesson gate) and the club's kids-can-vote rule are enforced here via
 *  `voteRefusal()` — the same predicate `fic_resolve_proposal` uses for the eligible count. */
export async function POST(req: Request) {
  const r = await requireClub(); if (r.error) return r.error;
  const { proposalId, vote } = await readJson<{ proposalId?: string; vote?: string }>(req);
  if (!proposalId || !["for", "against"].includes(vote ?? "")) return bad("Vote For or Against");
  const refusal = voteRefusal(r.ctx, r.session.user.id);
  if (refusal) return bad(refusal, 403);
  const { data: pr, error: pe } = await r.supa.from("fic_club_proposals").select("id, club_id, status, closes_at").eq("id", proposalId).maybeSingle();
  if (pe) return dbError(pe);
  const p = pr as { club_id: string; status: string; closes_at: string } | null;
  if (!p || p.club_id !== r.ctx.club.id) return bad("That proposal isn't in your club", 404);
  if (p.status !== "open") return bad("This proposal is closed", 409);
  const { error } = await r.supa.from("fic_club_votes").upsert({ proposal_id: proposalId, user_id: r.session.user.id, vote }, { onConflict: "proposal_id,user_id" });
  if (error) return dbError(error);
  const xp = await awardXp(r.session.user.id, "vote", xpFor("vote")!, proposalId);
  let status = "open";
  if (new Date(p.closes_at).getTime() <= Date.now()) {
    const admin = adminClient();
    if (admin) { const { data } = await admin.rpc("fic_resolve_proposal", { p_id: proposalId }); status = (data as string) ?? "open"; }
  }
  return ok({ status, xp });
}
