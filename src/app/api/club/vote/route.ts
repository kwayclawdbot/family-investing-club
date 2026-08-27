import { awardXp, bad, dbError, ok, readJson, requireClub, xpFor } from "@/lib/live/route-utils";
import { adminClient } from "@/lib/live/supa";
export async function POST(req: Request) {
  const r = await requireClub(); if (r.error) return r.error;
  const { proposalId, vote } = await readJson<{ proposalId?: string; vote?: string }>(req);
  if (!proposalId || !["for", "against"].includes(vote ?? "")) return bad("Vote For or Against");
  const me = r.ctx.members.find((m) => m.user_id === r.session.user.id);
  if (me?.vote_gated) return bad(me.gate_reason ? `Finish the mini-lesson first — ${me.gate_reason}` : "Your vote is gated until you finish the mini-lesson", 403);
  const { data: pr, error: pe } = await r.supa.from("fic_club_proposals").select("id, status, closes_at").eq("id", proposalId).single();
  if (pe) return dbError(pe);
  const p = pr as { status: string; closes_at: string };
  if (p.status !== "open") return bad("This proposal is closed", 409);
  const { error } = await r.supa.from("fic_club_votes").upsert({ proposal_id: proposalId, user_id: r.session.user.id, vote }, { onConflict: "proposal_id,user_id" });
  if (error) return dbError(error);
  await awardXp(r.session.user.id, "vote", xpFor("vote")!, proposalId);
  let status = "open";
  if (new Date(p.closes_at).getTime() <= Date.now()) {
    const admin = adminClient();
    if (admin) { const { data } = await admin.rpc("fic_resolve_proposal", { p_id: proposalId }); status = (data as string) ?? "open"; }
  }
  return ok({ status });
}
