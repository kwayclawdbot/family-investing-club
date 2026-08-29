import { awardXp, bad, dbError, ok, readJson, requireClub, requireSession, xpFor } from "@/lib/live/route-utils";
export async function POST(req: Request) {
  const r = await requireClub(); if (r.error) return r.error;
  const { question, symbol } = await readJson<{ question?: string; symbol?: string }>(req);
  const q = (question ?? "").trim();
  if (q.length < 5 || q.length > 500) return bad("Ask a real question (5–500 characters)");
  const sym = symbol ? symbol.toUpperCase().trim() : null;
  if (sym && !/^[A-Z.]{1,8}$/.test(sym)) return bad("Invalid symbol");
  const { data, error } = await r.supa.from("fic_club_asks").insert({ club_id: r.ctx.club.id, author_id: r.session.user.id, question: q, symbol: sym }).select("id").single();
  if (error) return dbError(error);
  const xp = await awardXp(r.session.user.id, "ask", xpFor("ask")!, (data as { id: string }).id);
  return ok({ id: (data as { id: string }).id, xp });
}
/** Withdraw your own question. Needs the own-row DELETE policy from 20260829010000_fic_club_rls_gaps.sql — until applied RLS matches 0 rows → 404. */
export async function DELETE(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { id } = await readJson<{ id?: string }>(req);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return bad("Missing id");
  const { data, error } = await r.supa.from("fic_club_asks").delete().eq("id", id).eq("author_id", r.session.user.id).select("id");
  if (error) return dbError(error);
  if (!(data as unknown[])?.length) return bad("That question isn't yours or can't be withdrawn yet", 404);
  return ok({ id });
}
