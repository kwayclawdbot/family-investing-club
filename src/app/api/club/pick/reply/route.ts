import { awardXp, bad, dbError, ok, readJson, requireSession, xpFor } from "@/lib/live/route-utils";
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { pickId, body } = await readJson<{ pickId?: string; body?: string }>(req);
  const text = (body ?? "").trim();
  if (!pickId || text.length < 1 || text.length > 1000) return bad("Write a reply (up to 1000 characters)");
  const { data, error } = await r.supa.from("fic_club_pick_replies").insert({ pick_id: pickId, author_id: r.session.user.id, body: text }).select("id").single();
  if (error) return dbError(error);
  const xp = await awardXp(r.session.user.id, "reply", xpFor("reply")!, pickId);
  return ok({ id: (data as { id: string }).id, xp });
}
/** Delete your own reply. Needs the own-row DELETE policy from 20260829010000_fic_club_rls_gaps.sql — until applied RLS matches 0 rows → 404. */
export async function DELETE(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { id } = await readJson<{ id?: string }>(req);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return bad("Missing id");
  const { data, error } = await r.supa.from("fic_club_pick_replies").delete().eq("id", id).eq("author_id", r.session.user.id).select("id");
  if (error) return dbError(error);
  if (!(data as unknown[])?.length) return bad("That reply isn't yours or can't be deleted yet", 404);
  return ok({ id });
}
