import { awardXp, bad, dbError, ok, readJson, requireClub, xpFor } from "@/lib/live/route-utils";
export async function POST(req: Request) {
  const r = await requireClub(); if (r.error) return r.error;
  const b = await readJson<{ symbol?: string; companyName?: string; assigneeId?: string | null; reason?: string; dueLabel?: string }>(req);
  const symbol = (b.symbol ?? "").toUpperCase().trim();
  if (!/^[A-Z.]{1,8}$/.test(symbol)) return bad("Pick a company first");
  if (b.assigneeId && !r.ctx.members.some((m) => m.user_id === b.assigneeId)) return bad("Assignee must be a club member");
  const { data, error } = await r.supa.from("fic_club_research").insert({ club_id: r.ctx.club.id, symbol, company_name: b.companyName ?? null, assignee_id: b.assigneeId ?? null, reason: (b.reason ?? "").slice(0, 280) || null, due_label: (b.dueLabel ?? "").slice(0, 60) || null }).select("id").single();
  if (error) return dbError(error);
  return ok({ id: (data as { id: string }).id });
}
export async function PATCH(req: Request) {
  const r = await requireClub(); if (r.error) return r.error;
  const b = await readJson<{ id?: string; status?: string; notes?: string; assigneeId?: string | null }>(req);
  if (!b.id) return bad("Missing id");
  const patch: Record<string, unknown> = {};
  if (b.status !== undefined) { if (!["open", "ready", "done"].includes(b.status)) return bad("Invalid status"); patch.status = b.status; }
  if (b.notes !== undefined) patch.notes = String(b.notes).slice(0, 2000);
  if (b.assigneeId !== undefined) { if (b.assigneeId && !r.ctx.members.some((m) => m.user_id === b.assigneeId)) return bad("Assignee must be a club member"); patch.assignee_id = b.assigneeId; }
  if (!Object.keys(patch).length) return bad("Nothing to update");
  const { error } = await r.supa.from("fic_club_research").update(patch).eq("id", b.id).eq("club_id", r.ctx.club.id);
  if (error) return dbError(error);
  if (patch.status === "ready" || patch.status === "done") await awardXp(r.session.user.id, "research", xpFor("research")!, b.id);
  return ok();
}
